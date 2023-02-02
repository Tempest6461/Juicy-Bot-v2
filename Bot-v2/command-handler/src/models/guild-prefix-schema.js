const { Schema, model, models } = require('mongoose');

const guildPrefixSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },
    prefix: {
        type: String,
        required: true,
    }
})

const name = 'guild-prefixes';
module.exports = models[name] || model(name, guildPrefixSchema);