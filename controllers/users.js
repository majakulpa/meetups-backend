const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('./../models/users')
const Booking = require('./../models/bookings')
const Event = require('./../models/events')
const Group = require('../models/groups')

usersRouter.post('/', async (req, res) => {
  const body = req.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    email: body.email,
    description: body.description,
    groups: body.groups,
    passwordHash
  })

  for (let i = 0; i < user.groups.length; i++) {
    let group = await Group.findById(user.groups[i])
    group.members = group.members.concat(user._id)
    await group.save()
  }

  const savedUser = await user.save()

  res.json(savedUser.toJSON())
})

usersRouter.get('/', async (req, res) => {
  const users = await User.find({})
    .populate('events', { title: 1, date: 1 })
    .populate('bookedEvents', { user: 1, event: 1 })
    .populate('createdGroups', { name: 1 })
    .populate('groups', { name: 1 })
  res.json(users.map(user => user.toJSON()))
})

usersRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('events', {
      title: 1,
      date: 1
    })
    .populate({
      path: 'bookedEvents',
      model: Booking,
      populate: {
        path: 'event',
        model: Event
      }
    })
    .populate('createdGroups', { name: 1 })
    .populate('groups', { name: 1 })
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
  if (body.groups) {
    userToUpdate.groups = body.groups
    for (let i = 0; i < userToUpdate.groups.length; i++) {
      let group = await Group.findById(userToUpdate.groups[i])
      group.members = group.members.concat(userToUpdate._id)
      await group.save()
    }
  }

  const savedUser = await userToUpdate.save()
  res.json(savedUser.toJSON())
})

module.exports = usersRouter
