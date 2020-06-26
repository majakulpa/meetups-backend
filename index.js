const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(morgan())

let events = [
  {
    id: 1,
    title: 'Coding together',
    date: '2019-05-30T17:30:31.098Z',
    price: 0,
    organizer: 'Bill Smith',
    capacity: 100,
    description: "Let's code together, it will be fun!",
    group: 'Web developers'
  },
  {
    id: 2,
    title: 'Basic CSS',
    date: '2019-05-30T17:30:31.098Z',
    price: 10.0,
    organizer: 'Olla Fiu',
    capacity: 25,
    description: 'Learn basics of styling with CSS',
    group: 'Web developers'
  },
  {
    id: 3,
    title: 'Singing together',
    date: '2019-05-30T17:30:31.098Z',
    price: 0,
    organizer: 'Oscar Han',
    capacity: 200,
    description: "Let's sing together, it will be fun!",
    group: 'Musical people'
  }
]

app.use(function(req, res, next) {
  console.log('Method:', req.method)
  console.log('Path:  ', req.path)
  console.log('Body:  ', req.body)
  console.log('---')
  next()
})

app.get('/', (req, res) => {
  res.send('<h1>Events</h1>')
})

app.get('/api/events', (req, res) => {
  res.json(events)
})

app.get('/api/events/:id', (req, res) => {
  const id = +req.params.id
  const event = events.find(event => event.id === id)
  if (event) {
    res.json(event)
  } else {
    res.status(404).end()
  }
})

app.post('/api/events', (req, res) => {
  const body = req.body
  if (!body.date) {
    return res.status(400).json({
      error: 'Date missing'
    })
  } else if (!body.title) {
    return res.status(400).json({
      error: 'Title missing'
    })
  } else if (!body.description) {
    return res.status(400).json({
      error: 'Description missing'
    })
  } else if (!body.capacity) {
    return res.status(400).json({
      error: 'Capacity missing'
    })
  }
  const event = {
    date: body.date || new Date(),
    id: events.length + 1,
    title: body.title,
    price: body.price || 0,
    organizer: body.organizer,
    capacity: body.capacity,
    description: body.description,
    group: body.group
  }
  events = events.concat(event)
  res.json(event)
})

app.delete('/api/events/:id', (req, res) => {
  const id = +req.params.id
  events = events.filter(event => event.id !== id)
  res.status(204).end()
})

app.use(function(req, res, next) {
  res.status(404).send({ error: 'unknown endpoint' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
