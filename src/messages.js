const { CmdInfo } = require('./types/CmdInfo');

class Message {
    constructor(type) {
        Object.defineProperty(this, '_type', {
            enumerable: false,
            value: type,
        });
    }
    static default(type) {
        return new this(type);
    }
    getType() {
        return this._type;
    }
    getName() {
        return this.constructor.name;
    }
    getTick() {
        return this.tick;
    }
    getSlot() {
        return this.slot;
    }
    setTick(tick) {
        this.tick = tick;
        return this;
    }
    setSlot(slot) {
        this.slot = slot;
        return this;
    }
    read() {
        throw new Error(`read() for ${this.constructor.name} not implemented!`);
    }
}

class Packet extends Message {
    constructor(type) {
        super(type);
    }
    findPacket(type) {
        const byType = type.prototype instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);

        return this.packets.find(byType);
    }
    findPackets(type) {
        const byType = type.prototype instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);

        return this.packets.filter(byType);
    }
    read(buf, demo) {
        let mssc = demo.demoProtocol === 4 ? 2 : 1;

        this.cmdInfo = [];
        while (mssc--) {
            const cmd = new CmdInfo();
            cmd.read(buf);
            this.cmdInfo.push(cmd);
        }

        this.inSequence = buf.readInt32();
        this.outSequence = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    *[Symbol.iterator]() {
        for (const packet of this.packets) {
            yield packet;
        }
    }
}
class SignOn extends Packet {}
class SyncTick extends Message {
    read() {
        return this;
    }
}
class ConsoleCmd extends Message {
    read(buf) {
        this.command = buf.readASCIIString(buf.readInt32());
        return this;
    }
}
class UserCmd extends Message {
    read(buf) {
        this.cmd = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
}
class DataTable extends Message {
    read(buf) {
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
}
class Stop extends Message {
    read(buf) {
        this.restData = buf.readBitStream(buf.bitsLeft);
        return this;
    }
}
class CustomData extends Message {
    read(buf) {
        this.unk = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
}
class StringTable extends Message {
    read(buf) {
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
}

module.exports = {
    NewEngine: [
        undefined,
        SignOn, // 1
        Packet, // 2
        SyncTick, // 3
        ConsoleCmd, // 4
        UserCmd, // 5
        DataTable, // 6
        Stop, // 7
        CustomData, // 8
        StringTable, // 9
    ],
    OldEngine: [
        undefined,
        SignOn, // 1
        Packet, // 2
        SyncTick, // 3
        ConsoleCmd, // 4
        UserCmd, // 5
        DataTable, // 6
        Stop, // 7
        StringTable, // 8
    ],
    Message,
    SignOn,
    Packet,
    SyncTick,
    ConsoleCmd,
    UserCmd,
    DataTable,
    Stop,
    CustomData,
    StringTable,
};
