const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)

const User = require('./../models/users')

beforeEach(async done => {
  await User.deleteMany({})

  for (let user of helper.initialUsers) {
    let userObject = new User(user)
    await userObject.save()
  }

  done()
})

describe('when there is initially one user in db', () => {
  test('creation succeeds with a fresh username', async done => {
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
    done()
  })

  test('creation fails with code 400 if username already exists', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: usersAtStart[0].username,
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
  })

  test('creation fails with code 400 if email already exists', async done => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'superuser',
      name: 'Mikola Legolas',
      email: usersAtStart[0].email,
      password: 'mikolas'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .set('Accept', 'application/json')
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.err).toContain('`email` to be unique')

    done()
  })
})

describe('Returning all users', () => {
  test('users are returned as json', async done => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('all users are returned', async done => {
    const response = await api.get('/api/users')
    const users = await helper.usersInDb()

    expect(response.body).toHaveLength(users.length)
    done()
  })

  test('a specific user is within returned users', async done => {
    const response = await api.get('/api/users')

    const usernames = response.body.map(r => r.username)

    expect(usernames).toContain('marika')
    done()
  })
})

afterAll(done => {
  mongoose.connection.close()
  done()
})
