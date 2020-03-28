class GameEvent {
    constructor(descriptor) {
        this.descriptor = descriptor;
        this.dataKeys = {};
    }
    get(keyName) {
        return this.dataKeys[keyName];
    }
    set(keyName, defaultValue) {
        return (this.dataKeys[keyName] = defaultValue);
    }
}

class GameEventManager {
    constructor(gameEvents) {
        this.gameEvents = gameEvents;
    }
    deserializeEvent(buf) {
        const eventId = buf.readBits(9);

        const descriptor = this.gameEvents.find(descriptor => descriptor.eventId === eventId);
        if (!descriptor) {
            throw new Error(`Unknown event id ${eventId}!`);
        }

        const event = new GameEvent(descriptor);

        for (const [keyName, type] of Object.entries(descriptor.keys)) {
            switch (type) {
                case 0:
                    break;
                case 1:
                    event.set(keyName, buf.readASCIIString());
                    break;
                case 2:
                    event.set(keyName, buf.readFloat32());
                    break;
                case 3:
                    event.set(keyName, buf.readInt32());
                    break;
                case 4:
                    event.set(keyName, buf.readInt16());
                    break;
                case 5:
                    event.set(keyName, buf.readInt8());
                    break;
                case 6:
                    event.set(keyName, buf.readBoolean());
                    break;
                default:
                    throw new Error(`Unknown type ${type} for key ${keyName}!`);
            }
        }

        return event;
    }
}

module.exports = {
    GameEventManager,
};
