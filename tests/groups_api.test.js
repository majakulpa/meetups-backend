const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helpers')
const app = require('../app')
const api = supertest(app)

let groupsAtStart = null

beforeEach(async () => {
  groupsAtStart = await helper.groupsInDb()
})

describe('Get the groups', () => {
  test('if returns groups as json', async done => {
    await api
      .get('/api/groups')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    done()
  })

  test('if returns all groups', async done => {
    const response = await api.get('/api/groups')

    expect(response.body).toHaveLength(groupsAtStart.length)
    done()
  })

  test('if a specific user is within returned groups', async done => {
    const response = await api.get('/api/groups')

    const names = response.body.map(r => r.name)
    expect(names).toContain('Coding')
    done()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
