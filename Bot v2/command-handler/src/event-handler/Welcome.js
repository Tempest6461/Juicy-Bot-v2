const welcomeChannel = require('../util/welcomeMessages.js');

class WelcomeChannel {
    // `${guildId}`: [channelId]
    _welcomeChannel = new Map();

    async action(action, guildId, channelId) {
        const _id = `${guildId}`;

        const result = await welcomeChannel.findOneAndUpdate(
            {
                _id,
            },
            {
                _id,
                [action === 'add' ? '$addToSet' : '$pull']: {
                    channels: channelId,
                },
            },
            {
                upsert: true,
                new: true,
            }
        );


        this._welcomeChannel.set(_id, result.channels);
        return result.channels;
    }

    async add(guildId, channelId) {
        return await this.action('add', guildId, channelId);
    }

    async remove(guildId, channelId) {
        return await this.action('remove', guildId, channelId);
    }
}

module.exports = WelcomeChannel;