const jwt = require('jsonwebtoken')
const bookingsRouter = require('express').Router()
const Booking = require('../models/bookings')
const Event = require('../models/events')
const User = require('../models/users')

const getTokenFrom = req => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}

bookingsRouter.get('/', async (req, res) => {
  const bookings = await Booking.find({})
    .populate('user', {
      name: 1,
      email: 1
    })
    .populate('event', { title: 1, date: 1 })
  res.json(bookings.map(booking => booking.toJSON()))
})

bookingsRouter.get('/:id', async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', {
      name: 1,
      email: 1
    })
    .populate('event', { title: 1, date: 1 })
  if (booking) {
    res.json(booking.toJSON())
  } else {
    res.status(404).end()
  }
})

bookingsRouter.delete('/:id', async (req, res) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  const booking = await Booking.findById(req.params.id)
  const event = await Event.findById(booking.event)
  const user = await User.findById(decodedToken.id)

  if (!booking) {
    return res.status(404).json({ error: "this booking doesn't exist" })
  } else if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  } else if (booking.user.toString() !== decodedToken.id) {
    return res
      .status(401)
      .json({ error: "you don't have permission to perform this action" })
  }

  await event.attendees.remove(user._id)
  await event.save()
  await Booking.findByIdAndRemove(req.params.id)
  res.status(204).end()
})

module.exports = bookingsRouter
