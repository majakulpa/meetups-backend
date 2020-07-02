const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)

const Event = require('../models/events')

beforeEach(async () => {
  await Event.deleteMany({})

  // const eventObjects = helper.initialEvents.map(event => new Event(event))
  // const promiseArray = eventObjects.map(event => event.save())
  // await Promise.all(promiseArray)
  for (let event of helper.initialEvents) {
    let eventObject = new Event(event)
    await eventObject.save()
  }
})

describe('creating events', () => {
  test('events are saved as json', async () => {
    await api
      .post('/api/events')
      .send(...helper.initialEvents)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('event without required fields is not added, fails with code 400', async () => {
    const newEvent = {
      price: 9.99,
      organizer: 'Alan Kowalski',
      group: 'Tests',
      place: 'Melbourne'
    }

    await api
      .post('/api/events')
      .send(newEvent)
      .expect(400)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
  })

  test('succeeds with valid data', async () => {
    const newEvent = new Event({
      date: new Date(),
      title: 'New Test Event',
      price: 9.99,
      user: 'Olla Smith',
      capacity: 100,
      description: 'Second Test Event description',
      group: 'Tests',
      place: 'Sydney'
    })

    await api
      .post('/api/events')
      .send(newEvent)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const eventsAtEnd = await helper.eventsInDb()
    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length + 1)

    const titles = eventsAtEnd.map(n => n.title)
    expect(titles).toContain('New Test Event')
  })
})

describe('returning all events', () => {
  test('events are returned as json', async () => {
    await api
      .get('/api/events')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all events are returned', async () => {
    const response = await api.get('/api/events')

    expect(response.body).toHaveLength(helper.initialEvents.length)
  })

  test('a specific event is within returned events', async () => {
    const response = await api.get('/api/events')

    const titles = response.body.map(r => r.title)

    expect(titles).toContain('First Test Event')
  })
})

describe('viewing one event', () => {
  test('a specific event can be viewed', async () => {
    const eventsAtStart = await helper.eventsInDb()

    const eventToView = eventsAtStart[0]

    const resultEvent = await api
      .get(`/api/events/${eventToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultEvent.body).toEqual(eventToView)
  })

  test('fails with statuscode 404 if event does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api.get(`/api/events/${validNonexistingId}`).expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.get(`/api/events/${invalidId}`).expect(400)
  })
})

describe('deleting events', () => {
  test('a event can be deleted, succeeds with code 204 if id is valid', async () => {
    const eventsAtStart = await helper.eventsInDb()
    const eventToDelete = eventsAtStart[0]

    await api.delete(`/api/events/${eventToDelete.id}`).expect(204)

    const eventsAtEnd = await helper.eventsInDb()

    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length - 1)

    const titles = eventsAtEnd.map(r => r.title)

    expect(titles).not.toContain(eventToDelete.title)
  })

  test('deleting with invalid id will return statuscode 400', async () => {
    const invalidId = '5a3d5da59070081a82a3445xfgh'

    await api.delete(`/api/events/${invalidId}`).expect(400)

    const eventsAtEnd = await helper.eventsInDb()

    expect(eventsAtEnd).toHaveLength(helper.initialEvents.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
