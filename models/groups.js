const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  description: String,
  mainImage: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }
  ]
})

groupSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

groupSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Group', groupSchema)
