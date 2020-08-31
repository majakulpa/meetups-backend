const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: String,
  email: {
    type: String,
    unique: true
  },
  description: String,
  profileImage: String,
  passwordHash: String,
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ],
  bookedEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  ],
  createdGroups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    }
  ],
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    }
  ]
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)
