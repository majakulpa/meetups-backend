const Event = require('../models/events')
const User = require('../models/users')
const Group = require('../models/groups')

const initialEvents = [
  {
    date: new Date(),
    title: 'First Test Event',
    price: 9.99,
    capacity: 100,
    description: 'First Test Event description',
    place: 'Melbourne'
  },
  {
    date: new Date(),
    title: 'Second Test Event',
    price: 9.99,
    capacity: 100,
    description: 'Second Test Event description',
    place: 'Sydney'
  }
]

const initialUsers = [
  {
    username: 'marika',
    name: 'Marika',
    email: 'marika@example.com',
    password: 'marika'
  },
  {
    username: 'marek',
    name: 'Marek',
    email: 'mar@example.com',
    password: 'marek'
  },
  {
    username: 'jolanda',
    name: 'Jolanda',
    email: 'jola@example.com',
    password: 'jolanda'
  }
]

const initialGroups = [
  {
    name: 'Coding',
    description: 'Learn how to code'
  },
  {
    name: 'Cooking',
    description: 'Learn how to cook'
  },
  {
    name: 'Danicing',
    description: 'Learn how to dance'
  }
]

const nonExistingEventId = async () => {
  const event = new Event({
    date: new Date(),
    title: 'Third Test Event',
    price: 9.99,
    capacity: 100,
    description: 'Second Test Event description',
    place: 'Sydney'
  })

  await event.save()
  await event.remove()
  return event._id.toString()
}

const nonExistingUserId = async () => {
  const user = new User({
    username: 'usertest',
    name: 'usertest',
    email: 'usertest@example.com',
    password: 'usertest'
  })

  await user.save()
  await user.remove()
  return user._id.toString()
}

const eventsInDb = async () => {
  const events = await Event.find({})
  return events.map(event => event.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

const groupsInDb = async () => {
  const groups = await Group.find({})
  return groups.map(group => group.toJSON())
}

module.exports = {
  initialEvents,
  initialUsers,
  initialGroups,
  nonExistingEventId,
  nonExistingUserId,
  eventsInDb,
  usersInDb,
  groupsInDb
}
