const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)

const Event = require('../models/events')
const User = require('../models/users')
const Group = require('../models/groups')

let userId = null
let loginInfo = null
let newLoginInfo = null
let eventsAtStart = null
let groupsAtStart = null
let eventToTakeActions = null

const newEvent = {
  price: 11.99,
  place: 'Warsaw'
}

beforeEach(async () => {
  await Promise.all([
    Event.deleteMany({}),
    User.deleteMany({}),
    Group.deleteMany({})
  ])

  const saltRounds = 10

  for (let usr of helper.initialUsers) {
    let passwordHash = await bcrypt.hash(usr.password, saltRounds)
    let userObject = new User({ ...usr, passwordHash })
    await userObject.save()
  }

  const user = await User.findOne({ username: helper.initialUsers[0].username })
  userId = user._id.toString()

  const groupsIds = []
  for (let group of helper.initialGroups) {
    let GroupObject = new Group({ ...group, creator: userId })
    let savedGroups = await GroupObject.save()
    groupsIds.push(savedGroups._id.toString())
  }

  groupsAtStart = await helper.groupsInDb()

  const eventIds = []
  for (let event of helper.initialEvents) {
    let eventObject = new Event({ ...event, user: userId, groups: groupsIds })
    let savedEvent = await eventObject.save()
    eventIds.push(savedEvent._id.toString())
  }

  eventsAtStart = await helper.eventsInDb()
  eventToTakeActions = eventsAtStart[0]

  user.events = eventIds
  await user.save()
  const login = await api.post('/api/login').send({
    username: helper.initialUsers[0].username,
    password: helper.initialUsers[0].password
  })
  loginInfo = login.body

  const newLoginUser = await api.post('/api/login').send({
    username: helper.initialUsers[1].username,
    password: helper.initialUsers[1].password
  })

  newLoginInfo = newLoginUser.body
})

describe('Creating events', () => {
  test('if event is created by logged in user and saved as json', async done => {
    await api
      .post('/api/events')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send({
        date: new Date(),
        title: 'Third Test Event',
        price: 9.99,
        capacity: 100,
        description: 'Second Test Event description',
        place: 'Sydney'
      })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length + 1)
    done()
  })

  test('if event without required fields is not added and fails with code 400', async done => {
    await api
      .post('/api/events')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(newEvent)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length)
    done()
  })
})

describe('Returning all events', () => {
  test('if events are returned as json', async done => {
    await api
      .get('/api/events')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('if all events are returned', async done => {
    const response = await api.get('/api/events')
    expect(response.body).toHaveLength(eventsAtStart.length)
    done()
  })

  test('if a specific event is within returned events', async done => {
    const response = await api.get('/api/events')

    const titles = response.body.map(r => r.title)
    expect(titles).toContain('First Test Event')
    done()
  })
})

describe('Viewing one event', () => {
  test('if a specific event can be viewed', async done => {
    const resultEvent = await api
      .get(`/api/events/${eventToTakeActions.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultEvent.body.id).toEqual(eventToTakeActions.id)
    expect(resultEvent.body.title).toEqual(eventToTakeActions.title)
    done()
  })

  test('if viewing fails with statuscode 404 if event does not exist', async done => {
    const validNonexistingId = await helper.nonExistingEventId()

    await api.get(`/api/events/${validNonexistingId}`).expect(404)
    done()
  })

  test('if viewing fails with statuscode 400 if event id is invalid', async done => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.get(`/api/events/${invalidId}`).expect(400)
    done()
  })
})

describe('Deleting events', () => {
  test('if event can be deleted by user who created it, succeeds with code 204 if id is valid', async done => {
    const token = loginInfo.token
    const decodedToken = jwt.verify(token, process.env.SECRET)

    expect(eventsAtStart[0].user.toString()).toEqual(decodedToken.id)

    await api
      .delete(`/api/events/${eventToTakeActions.id}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .expect(204)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(eventsAtStart.length - 1)

    const titles = eventsAtEnd.map(r => r.title)
    expect(titles).not.toContain(eventToTakeActions.title)
    done()
  })

  test('if deleting when user not logged in fails', async done => {
    await api.delete(`/api/events/${eventToTakeActions.id}`).expect(401)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
    done()
  })

  test('if deleting event with invalid id will return statuscode 400', async done => {
    const invalidId = '5a3d5da59070081a82a3445xfgh'

    await api
      .delete(`/api/events/${invalidId}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()

    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
    done()
  })

  test('if deleting event by wrong user will fail with statuscode 401', async done => {
    await api
      .delete(`/api/events/${eventToTakeActions.id}`)
      .set('Authorization', `Bearer ${newLoginInfo.token}`)
      .expect(401)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length)
    done()
  })

  test('if event does not exist test deleting by right user will fail with code 404', async done => {
    const validNonexistingId = await helper.nonExistingEventId()
    await api
      .delete(`/api/events/${validNonexistingId}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .expect(404)
    done()
  })
})

describe('Updating events', () => {
  test('if event can be updated by user who created it', async done => {
    const token = loginInfo.token
    const decodedToken = jwt.verify(token, process.env.SECRET)

    expect(eventsAtStart[0].user.toString()).toEqual(decodedToken.id)

    await api
      .patch(`/api/events/${eventToTakeActions.id}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(newEvent)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    done()
  })

  test('if updating when user not logged in fails', async done => {
    await api
      .patch(`/api/events/${eventToTakeActions.id}`)
      .send(newEvent)
      .expect(401)

    done()
  })

  test('if updating event with invalid id will return statuscode 400', async done => {
    const invalidId = '5a3d5da59070081a82a3445xfghytyu'

    await api
      .patch(`/api/events/${invalidId}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(newEvent)
      .expect(400)

    done()
  })

  test('if updating event by wrong user will fail with statuscode 401', async done => {
    await api
      .patch(`/api/events/${eventToTakeActions.id}`)
      .set('Authorization', `Bearer ${newLoginInfo.token}`)
      .send(newEvent)
      .expect(401)

    done()
  })
})

describe('Creating groups', () => {
  test('if group is created by logged in user and saved as json', async done => {
    await api
      .post('/api/groups')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send({
        name: 'Test Groups',
        description: 'Something about this group'
      })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const groupsAtEnd = await helper.groupsInDb()
    expect(groupsAtEnd.length).toBe(groupsAtStart.length + 1)
    done()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
