const { SourceDemoParser } = require('../parser');

class BinaryBuffer {
    constructor(size) {
        this.buffer = Buffer.alloc(size);
    }
    writeInt8(value) {
        let data = Buffer.alloc(1);
        data.writeInt8(value, 0);
        this.buffer = Buffer.concat([this.buffer, data]);
    }
    writeInt16(value) {
        let data = Buffer.alloc(2);
        data.writeInt16LE(value, 0);
        this.buffer = Buffer.concat([this.buffer, data]);
    }
    writeInt32(value) {
        let data = Buffer.alloc(4);
        data.writeInt32LE(value, 0);
        this.buffer = Buffer.concat([this.buffer, data]);
    }
    writeFloat(value) {
        let data = Buffer.alloc(4);
        data.writeFloatLE(value, 0);
        this.buffer = Buffer.concat([this.buffer, data]);
    }
    writeString(value) {
        let data = Buffer.alloc(value.length);
        data.write(value, 0);
        this.buffer = Buffer.concat([this.buffer, data]);
    }
}

class SourceAutoRecord {
    static convertToReplay(demos) {
        const bb = new BinaryBuffer(0);
    
        bb.writeString('sar-tas-replay v1.8\n');
        bb.writeInt32(demos.length);

        let parser = new SourceDemoParser();

        for (let demo of demos) {
            let messages = parser.encodeUserCmdMessages(demo);
            for (let message of messages) {
                bb.writeInt32(message.buttons || 0);
                bb.writeFloat(message.forwardMove || 0);
                bb.writeInt8(message.impulse || 0);
                bb.writeInt16(message.mouseDx || 0);
                bb.writeInt16(message.mouseDy || 0);
                bb.writeFloat(message.sideMove || 0);
                bb.writeFloat(message.upMove || 0);
                bb.writeFloat(message.viewAngleX || 0);
                bb.writeFloat(message.viewAngleY || 0);
                bb.writeFloat(message.viewAngleZ || 0);
            }
        }

        return bb.buffer;
    }
}

module.exports = { SourceAutoRecord };
