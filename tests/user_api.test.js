const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const bcrypt = require('bcrypt')
const app = require('./../app')
const api = supertest(app)

const User = require('./../models/users')

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'alan',
      name: 'Alan',
      email: 'alan@example.com',
      passwordHash
    })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mikolas',
      name: 'Mikolas Legolas',
      email: 'miko@las',
      password: 'mikolas'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with code 400 if username already exists', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'alan',
      name: 'Mikola Legolas',
      email: 'miko@example',
      password: 'mikolas'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .set('Accept', 'application/json')
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.err).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with code 400 if email already exists', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'superuser',
      name: 'Mikola Legolas',
      email: 'alan@example.com',
      password: 'mikolas'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .set('Accept', 'application/json')
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.err).toContain('`email` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

describe('Returning all users', () => {
  test('users are returned as json', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all users are returned', async () => {
    const response = await api.get('/api/users')
    const users = await helper.usersInDb()

    expect(response.body).toHaveLength(users.length)
  })

  test('a specific user is within returned users', async () => {
    const response = await api.get('/api/users')

    const usernames = response.body.map(r => r.username)

    expect(usernames).toContain('alan')
  })
})

afterAll(() => {
  mongoose.connection.close()
})
