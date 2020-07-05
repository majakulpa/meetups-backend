const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('./../app')
const api = supertest(app)

let usersAtStart = null
let userToTakeActions = null

beforeEach(async () => {
  usersAtStart = await helper.usersInDb()
  userToTakeActions = usersAtStart[0]
})

describe('Creating users', () => {
  test('if creates user with a new username', async done => {
    const newUser = {
      username: 'mikolas',
      name: 'Mikolas Legolas',
      email: 'miko@las',
      password: 'mikolas'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
    done()
  })

  test('if fails to create user with code 400 if username already exists', async done => {
    const newUser = {
      username: usersAtStart[0].username,
      name: 'Mikola Legolas',
      email: 'example@example',
      password: 'mikolas'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .set('Accept', 'application/json')
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.err).toContain('`username` to be unique')
    done()
  })

  test('if fails to create user with 400 if email already exists', async done => {
    const newUser = {
      username: 'superuser',
      name: 'Mikola Legolas',
      email: usersAtStart[0].email,
      password: 'mikolas'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.err).toContain('`email` to be unique')

    done()
  })
})

describe('Returning all users', () => {
  test('if returns users as json', async done => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('if returns all users', async done => {
    const response = await api.get('/api/users')

    expect(response.body).toHaveLength(usersAtStart.length)
    done()
  })

  test('if a specific user is within returned users', async done => {
    const response = await api.get('/api/users')

    const usernames = response.body.map(r => r.username)
    const specificUsr = userToTakeActions.username
    expect(usernames).toContain(specificUsr)
    done()
  })
})

describe('Returning one user by id', () => {
  test('if specific user can be viewed', async done => {
    const resultUser = await api
      .get(`/api/users/${userToTakeActions.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultUser.body.id).toEqual(userToTakeActions.id)
    expect(resultUser.body.username).toEqual(userToTakeActions.username)
    done()
  })

  test('if viewing fails with statuscode 404 if user does not exist', async done => {
    const validNonexistingId = await helper.nonExistingUserId()

    await api.get(`/api/users/${validNonexistingId}`).expect(404)
    done()
  })

  test('if viewing fails with statuscode 400 if event id is invalid', async done => {
    const invalidId = '5a3d5da59070081a82a3445q3435'

    await api.get(`/api/users/${invalidId}`).expect(400)
    done()
  })
})

describe('Deleting users', () => {
  test('if user can be deleted, succeeds with code 204 if id is valid', async done => {
    await api.delete(`/api/users/${userToTakeActions.id}`).expect(204)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length - 1)

    const usernames = usersAtEnd.map(r => r.username)
    expect(usernames).not.toContain(userToTakeActions.username)
    done()
  })

  test('if deleting user with invalid id will return statuscode 400', async done => {
    const invalidId = '5a3d5da59070081a82a3445xfgh'

    await api.delete(`/api/users/${invalidId}`).expect(400)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
    done()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
