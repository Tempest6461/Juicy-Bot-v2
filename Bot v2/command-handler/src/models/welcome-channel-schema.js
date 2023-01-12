const { Schema, model, models } = require('mongoose')

const welcomeChannelSchema = new Schema({
  // guildId-welcomeChannel
  _id: {
    type: String,
    required: true,
  },
  channels: {
    type: [String],
    required: true,
  },
})

const name = 'welcome-channel'
module.exports = models[name] || model(name, welcomeChannelSchema)
