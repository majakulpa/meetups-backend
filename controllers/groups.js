const jwt = require('jsonwebtoken')
const groupsRouter = require('express').Router()
const Group = require('../models/groups')
const User = require('../models/users')
const Event = require('../models/events')

const getTokenFrom = req => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

groupsRouter.post('/', async (req, res) => {
  const body = req.body
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const group = new Group({
    name: body.name,
    description: body.description,
    creator: user._id
  })

  const savedGroup = await group.save()
  user.createdGroups = user.createdGroups.concat(savedGroup._id)
  await user.save()

  res.json(savedGroup.toJSON())
})

groupsRouter.get('/', async (req, res) => {
  const groups = await Group.find({})
    .populate('creator', { name: 1, email: 1 })
    .populate('members', { name: 1, email: 1 })
    .populate('events', { title: 1, date: 1 })
  res.json(groups.map(group => group.toJSON()))
})

groupsRouter.get('/:id', async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('creator', { name: 1, email: 1 })
    .populate('members', { name: 1, email: 1 })
    .populate({
      path: 'events',
      model: Event
    })
  if (group) {
    res.json(group.toJSON())
  } else {
    res.status(404).end()
  }
})

groupsRouter.delete('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const group = await Group.findById(req.params.id)

  if (!group) {
    return res.status(404).json({ error: "this groups doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (group.creator.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  await Group.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

groupsRouter.patch('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const group = await Group.findById(req.params.id)

  if (!group) {
    return res.status(404).json({ error: "this group doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (group.creator.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  const body = req.body
  const groupToUpdate = await Group.findById(req.params.id)

  if (body.name) {
    groupToUpdate.name = body.name
  }
  if (body.description) {
    groupToUpdate.description = body.description
  }

  const savedGroup = await groupToUpdate.save()
  res.json(savedGroup.toJSON())
})

//join the group
groupsRouter.post('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  const group = await Group.findById(req.params.id)
  const user = await User.findById(decodedToken.id)

  user.groups = user.groups.concat(group._id)
  if (!group.members.includes(user._id)) {
    group.members = group.members.concat(user._id)
  } else {
    return res.status(404).json({ error: 'You already belong to this group.' })
  }

  await user.save()
  await group.save()

  res.json(user.toJSON())
})

//leave the group
groupsRouter.delete('/:id/unsubscribe', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const group = await Group.findById(req.params.id)
  const user = await User.findById(decodedToken.id)

  if (!group) {
    return res.status(404).json({ error: "this group doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (!group.members.includes(user._id)) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  await user.groups.remove(group._id)
  await group.members.remove(user._id)
  await user.save()
  await group.save()
  res.status(204).end()
})

module.exports = groupsRouter
