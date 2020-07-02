const Event = require('../models/events')
const User = require('../models/users')

const initialEvents = [
  {
    date: new Date(),
    title: 'First Test Event',
    price: 9.99,
    user: 'Alan Kowalski',
    capacity: 100,
    description: 'First Test Event description',
    group: 'Tests',
    place: 'Melbourne'
  },
  {
    date: new Date(),
    title: 'Second Test Event',
    price: 9.99,
    user: 'Olla Smith',
    capacity: 100,
    description: 'Second Test Event description',
    group: 'Tests',
    place: 'Sydney'
  }
]

const nonExistingId = async () => {
  const event = new Event({
    date: new Date(),
    title: 'Third Test Event',
    price: 9.99,
    user: 'Olla Smith',
    capacity: 100,
    description: 'Second Test Event description',
    group: 'Tests',
    place: 'Sydney'
  })

  await event.save()
  await event.remove()
  return event._id.toString()
}

const eventsInDb = async () => {
  const events = await Event.find({})
  return events.map(event => event.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

module.exports = {
  initialEvents,
  nonExistingId,
  eventsInDb,
  usersInDb
}
