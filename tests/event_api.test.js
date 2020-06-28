const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)
const Event = require('./../models/event')

beforeEach(async () => {
  await Event.deleteMany({})

  let eventObject = new Event(helper.initialEvents[0])
  await eventObject.save()

  eventObject = new Event(helper.initialEvents[1])
  await eventObject.save()
})

test('events are saved as json', async () => {
  await api
    .post('/api/events')
    .send(...helper.initialEvents)
    .set('Accept', 'application/json')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('event without required fields is not added', async () => {
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

test('a specific event can be viewed', async () => {
  const eventsAtStart = await helper.eventsInDb()

  const eventToView = eventsAtStart[0]

  const resultEvent = await api
    .get(`/api/events/${eventToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultEvent.body.description).toEqual(eventToView.description)
})

test('a event can be deleted', async () => {
  const eventsAtStart = await helper.eventsInDb()
  const eventToDelete = eventsAtStart[0]

  await api.delete(`/api/events/${eventToDelete.id}`).expect(204)

  const eventsAtEnd = await helper.eventsInDb()

  expect(eventsAtEnd).toHaveLength(helper.initialEvents.length - 1)

  const titles = eventsAtEnd.map(r => r.title)

  expect(titles).not.toContain(eventToDelete.title)
})

afterAll(() => {
  mongoose.connection.close()
})
