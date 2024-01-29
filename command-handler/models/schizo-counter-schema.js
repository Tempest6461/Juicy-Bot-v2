const { Schema, model } = require("mongoose");

const schizoCounterSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    changes: [{
        oldNickname: String,
        newNickname: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

// Ensure the collection has a TTL index for the timestamp field
schizoCounterSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

const modelName = "schizo-counter";

module.exports = model(modelName, schizoCounterSchema);
