const jwt = require('jsonwebtoken')
const eventsRouter = require('express').Router()
const Event = require('../models/events')
const User = require('../models/users')
const Booking = require('../models/bookings')
const Group = require('../models/groups')

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
    groups: body.groups,
    place: body.place
  })

  for (let i = 0; i < event.groups.length; i++) {
    let group = await Group.findById(event.groups[i])
    group.events = group.events.concat(event._id)
    await group.save()
  }

  const savedEvent = await event.save()
  user.events = user.events.concat(savedEvent._id)
  await user.save()

  res.json(savedEvent.toJSON())
})

eventsRouter.get('/', async (req, res) => {
  const events = await Event.find({})
    .populate('user', { name: 1, email: 1 })
    .populate('attendees', { name: 1, email: 1, profileImage: 1 })
    .populate('groups', { name: 1 })
  res.json(events.map(event => event.toJSON()))
})

eventsRouter.get('/:id', async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('user', {
      name: 1,
      email: 1,
      profileImage: 1
    })
    .populate('attendees', { name: 1, email: 1, profileImage: 1 })
    .populate('groups', { name: 1 })
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

  if (!event) {
    return res.status(404).json({ error: "this event doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (event.user.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  await Event.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

eventsRouter.patch('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const event = await Event.findById(req.params.id)

  if (!event) {
    return res.status(404).json({ error: "this event doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (event.user.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  const body = req.body
  const eventToUpdate = await Event.findById(req.params.id)

  if (body.title) {
    eventToUpdate.title = body.title
  }
  if (body.date) {
    eventToUpdate.date = body.date
  }
  if (body.price) {
    eventToUpdate.price = body.price
  }
  if (body.capacity) {
    eventToUpdate.capacity = body.capacity
  }
  if (body.description) {
    eventToUpdate.description = body.description
  }
  if (body.place) {
    eventToUpdate.place = body.place
  }

  if (body.groups && body.groups.length > 0) {
    eventToUpdate.groups = body.groups
    let allGroups = await Group.find({})
    let allFilteredGroups = allGroups.filter(
      group => !eventToUpdate.groups.includes(group._id)
    )
    for (let j = 0; j < allFilteredGroups.length; j++) {
      let oneGroup = allFilteredGroups[j]
      if (oneGroup.events.includes(eventToUpdate._id)) {
        oneGroup.events.remove(eventToUpdate._id)
      }
      await oneGroup.save()
    }

    for (let i = 0; i < eventToUpdate.groups.length; i++) {
      let group = await Group.findById(eventToUpdate.groups[i])
      if (!group.events.includes(eventToUpdate._id)) {
        group.events = group.events.concat(eventToUpdate._id)
      }

      await group.save()
    }
  }

  const savedEvent = await eventToUpdate.save()
  res.json(savedEvent.toJSON())
})

// book en event
eventsRouter.post('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)
  const event = await Event.findById(req.params.id)

  const booking = new Booking({
    user: user._id,
    event: event._id
  })

  user.bookedEvents = user.bookedEvents.concat(booking._id)
  if (!event.attendees.includes(user._id)) {
    event.attendees = event.attendees.concat(user._id)
  } else {
    return res.status(404).json({ error: 'You already booked this event' })
  }

  await booking.save()
  await user.save()
  await event.save()

  res.json(event.toJSON())
})

module.exports = eventsRouter
