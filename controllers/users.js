const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('./../models/users')

usersRouter.post('/', async (req, res) => {
  const body = req.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    email: body.email,
    description: body.description,
    passwordHash
  })

  const savedUser = await user.save()

  res.json(savedUser.toJSON())
})

usersRouter.get('/', async (req, res) => {
  const users = await User.find({}).populate('events', { title: 1, date: 1 })
  res.json(users.map(user => user.toJSON()))
})

usersRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).populate('events', {
    title: 1,
    date: 1
  })
  if (user) {
    res.json(user.toJSON())
  } else {
    res.status(404).end()
  }
})

usersRouter.delete('/:id', async (req, res) => {
  await User.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

usersRouter.patch('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    res.status(404).end()
  }

  const body = req.body
  const userToUpdate = await User.findById(req.params.id)

  if (body.name) {
    userToUpdate.name = body.name
  }
  if (body.username) {
    userToUpdate.username = body.username
  }
  if (body.email) {
    userToUpdate.email = body.email
  }
  if (body.description) {
    userToUpdate.description = body.description
  }

  const savedUser = await userToUpdate.save()
  res.json(savedUser.toJSON())
})

module.exports = usersRouter
