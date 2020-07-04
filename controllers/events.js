const jwt = require('jsonwebtoken')
const eventsRouter = require('express').Router()
const Event = require('../models/events')
const User = require('../models/users')

const getTokenFrom = req => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

eventsRouter.post('/', async (req, res) => {
  const body = req.body
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const event = new Event({
    date: body.date,
    title: body.title,
    price: body.price || 0,
    user: user._id,
    capacity: body.capacity,
    description: body.description,
    group: body.group,
    place: body.place
  })

  const savedEvent = await event.save()
  user.events = user.events.concat(savedEvent._id)
  await user.save()

  res.json(savedEvent.toJSON())
})

eventsRouter.get('/', async (req, res) => {
  const events = await Event.find({}).populate('user', { name: 1, email: 1 })
  res.json(events.map(event => event.toJSON()))
})

eventsRouter.get('/:id', async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (event) {
    res.json(event.toJSON())
  } else {
    res.status(404).end()
  }
})

eventsRouter.delete('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const event = await Event.findById(req.params.id)

  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (event.user.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to delete this event" })
  }

  await Event.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

eventsRouter.put('/:id', (req, res, next) => {
  const body = req.body

  const event = {
    date: body.date,
    title: body.title,
    price: body.price,
    organizer: body.organizer,
    capacity: body.capacity,
    description: body.description,
    group: body.group
  }

  Event.findByIdAndUpdate(req.params.id, event, { new: true })
    .then(updatedEvent => {
      res.json(updatedEvent.toJSON())
    })
    .catch(err => next(err))
})

module.exports = eventsRouter
