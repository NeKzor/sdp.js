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
    isType(name) {
        return this.constructor.name === name;
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
    findPacket(type) {
        return this.packets.find((packet) => packet.isType(type));
    }
    read(buf, demo) {
        let mssc = demo.demoProtocol === 4 ? 2 : 1;

        this.cmdInfo = [];
        while (mssc--) {
            let cmd = new CmdInfo();
            cmd.read(buf);
            this.cmdInfo.push(cmd);
        }

        this.inSequence = buf.readInt32();
        this.outSequence = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
}
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
        Packet, // 1
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
        Packet, // 1
        Packet, // 2
        SyncTick, // 3
        ConsoleCmd, // 4
        UserCmd, // 5
        DataTable, // 6
        Stop, // 7
        StringTable, // 8
    ],
};
