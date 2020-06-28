const eventsRouter = require('express').Router()
const Event = require('./../models/event')

eventsRouter.get('/', async (req, res) => {
  const events = await Event.find({})
  res.json(events.map(event => event.toJSON()))
})

eventsRouter.post('/', async (req, res, next) => {
  const body = req.body

  const event = new Event({
    date: body.date || new Date(),
    title: body.title,
    price: body.price || 0,
    organizer: body.organizer,
    capacity: body.capacity,
    description: body.description,
    group: body.group,
    place: body.place
  })

  try {
    const savedEvent = await event.save()
    res.json(savedEvent.toJSON())
  } catch (err) {
    next(err)
  }
})

eventsRouter.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
    if (event) {
      res.json(event.toJSON())
    } else {
      res.status(404).end()
    }
  } catch (err) {
    next(err)
  }
})

eventsRouter.delete('/:id', async (req, res, next) => {
  try {
    await Event.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
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
