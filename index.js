const express = require('express')
const app = express()
require('dotenv').config()
const morgan = require('morgan')
const Event = require('./models/event')

const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(morgan())

app.get('/api/events', (req, res) => {
  Event.find({}).then(events => {
    res.json(events.map(event => event.toJSON()))
  })
})

app.post('/api/events', (req, res, next) => {
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

app.get('/api/events/:id', (req, res, next) => {
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

app.delete('/api/events/:id', (req, res, next) => {
  Event.findByIdAndRemove(req.params.id)
    .then(result => {
      res.status(204).end()
    })
    .catch(err => next(err))
})

app.put('/api/events/:id', (req, res, next) => {
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

app.use(function(req, res, next) {
  res.status(404).send({ error: 'unknown endpoint' })
})

const errorHandler = (err, req, res, next) => {
  console.error(err.message)

  if (err.name === 'CastError' && err.kind == 'ObjectId') {
    return res.status(400).send({ err: 'malformatted id' })
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({ err: err.message })
  }
  next(err)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
