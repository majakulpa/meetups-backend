const jwt = require('jsonwebtoken')
const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)

const Event = require('../models/events')
const User = require('../models/users')

let userId = null
let loginInfo = null

beforeEach(async done => {
  await Promise.all([Event.deleteMany({}), User.deleteMany({})])

  await api.post('/api/users').send({
    username: 'jolanda',
    name: 'Jolanda',
    email: 'jola@example.com',
    password: 'jolanda'
  })

  const user = await User.findOne({ username: 'jolanda' })
  userId = user._id.toString()

  const eventIds = []
  for (let event of helper.initialEvents) {
    let eventObject = new Event({ ...event, user: userId })
    let savedEvent = await eventObject.save()
    eventIds.push(savedEvent._id.toString())
  }

  user.events = eventIds
  await user.save()
  const login = await api
    .post('/api/login')
    .send({ username: 'jolanda', password: 'jolanda' })
  loginInfo = login.body
  done()
})

describe('creating events', () => {
  test('events created by logged in user and saved as json', async done => {
    await api
      .post('/api/events')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(helper.initialEvents[0])
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('event without required fields is not added, fails with code 400', async done => {
    const eventsAtStart = await helper.eventsInDb()
    const newEvent = {
      price: 9.99,
      place: 'Melbourne'
    }

    await api
      .post('/api/events')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(newEvent)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length)
    done()
  })

  test('if user logged in and data is valid event is created', async done => {
    const eventsAtStart = await helper.eventsInDb()

    const newEvent = new Event({
      date: new Date(),
      title: 'New Test Event',
      price: 9.99,
      capacity: 100,
      description: 'Second Test Event description',
      group: 'Tests',
      place: 'Sydney'
    })

    await api
      .post('/api/events')
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .send(newEvent)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length + 1)

    const titles = eventsAtEnd.map(n => n.title)
    expect(titles).toContain('New Test Event')
    done()
  })
})

describe('returning all events', () => {
  test('events are returned as json', async done => {
    await api
      .get('/api/events')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('all events are returned', async done => {
    const response = await api.get('/api/events')

    expect(response.body).toHaveLength(helper.initialEvents.length)
    done()
  })

  test('a specific event is within returned events', async done => {
    const response = await api.get('/api/events')

    const titles = response.body.map(r => r.title)

    expect(titles).toContain('First Test Event')
    done()
  })
})

describe('viewing one event', () => {
  test('a specific event can be viewed', async done => {
    const eventsAtStart = await helper.eventsInDb()

    const eventToView = eventsAtStart[0]

    const resultEvent = await api
      .get(`/api/events/${eventToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultEvent.body.id).toEqual(eventToView.id)
    expect(resultEvent.body.title).toEqual(eventToView.title)
    done()
  })

  test('fails with statuscode 404 if event does not exist', async done => {
    const validNonexistingId = await helper.nonExistingId()

    await api.get(`/api/events/${validNonexistingId}`).expect(404)
    done()
  })

  test('fails with statuscode 400 if id is invalid', async done => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.get(`/api/events/${invalidId}`).expect(400)
    done()
  })
})

describe('deleting events', () => {
  test('a event can be deleted by user who created it, succeeds with code 204 if id is valid', async done => {
    const eventsAtStart = await helper.eventsInDb()
    const eventToDelete = eventsAtStart[0]
    const token = loginInfo.token
    const decodedToken = jwt.verify(token, process.env.SECRET)

    expect(eventsAtStart[0].user.toString()).toEqual(decodedToken.id)

    await api
      .delete(`/api/events/${eventToDelete.id}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .expect(204)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(eventsAtStart.length - 1)

    const titles = eventsAtEnd.map(r => r.title)
    expect(titles).not.toContain(eventToDelete.title)
    done()
  })

  test('deleting when user not logged in fails', async done => {
    const eventsAtStart = await helper.eventsInDb()
    const eventToDelete = eventsAtStart[0]

    await api.delete(`/api/events/${eventToDelete.id}}`).expect(401)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
    done()
  })

  test('deleting with invalid id will return statuscode 400', async done => {
    const invalidId = '5a3d5da59070081a82a3445xfgh'

    await api
      .delete(`/api/events/${invalidId}`)
      .set('Authorization', `Bearer ${loginInfo.token}`)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()

    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
    done()
  })

  test('deleting event by wrong user will fail with statuscode 400', async done => {
    const eventsAtStart = await helper.eventsInDb()
    const eventToDelete = eventsAtStart[0]

    await api.post('/api/users').send({
      username: 'brian',
      name: 'Brian',
      email: 'brian@example.com',
      password: 'brian'
    })

    const loginUser = await api
      .post('/api/login')
      .send({ username: 'brian', password: 'brian' })

    let newLoginInfo = loginUser.body

    await api
      .delete(`/api/events/${eventToDelete.id}}`)
      .set('Authorization', `Bearer ${newLoginInfo.token}`)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd.length).toBe(eventsAtStart.length)
    done()
  })
})

afterAll(done => {
  mongoose.connection.close()
  done()
})
