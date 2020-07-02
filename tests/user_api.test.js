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
    const user = new User({ username: 'alan', passwordHash })

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

  test('creation fails with proper statuscode if username already exists', async () => {
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

    console.log('err', result.body.error)
    expect(result.body.err).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
