const eventsRouter = require('express').Router()
const Event = require('./../models/event')

eventsRouter.get('/', (req, res) => {
  Event.find({}).then(events => {
    res.json(events.map(event => event.toJSON()))
  })
})

eventsRouter.post('/', (req, res, next) => {
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

  event
    .save()
    .then(savedEvent => savedEvent.toJSON())
    .then(savedAndFormattedEvent => {
      res.json(savedAndFormattedEvent)
    })
    .catch(error => next(error))
})

eventsRouter.get('/:id', (req, res, next) => {
  Event.findById(req.params.id)
    .then(event => {
      if (event) {
        res.json(event.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch(err => next(err))
})

eventsRouter.delete('/:id', (req, res, next) => {
  Event.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch(err => next(err))
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
