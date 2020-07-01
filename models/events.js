const mongoose = require('mongoose')

mongoose.set('useFindAndModify', false)

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: 3,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  price: Number,
  organizer: String,
  capacity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    minlength: 10,
    required: true
  },
  group: String,
  place: {
    type: String,

    required: true
  }
})

eventSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.date = returnedObject.date.toISOString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Event', eventSchema)
