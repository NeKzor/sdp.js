const ReplayHeader = 'sar-tas-replay v1.8\n';

class SourceAutoRecordReplay extends Buffer {
    constructor(size) {
        this.buffer = this.alloc(size);
    }
    writeInt8(value) {
        let data = this.alloc(1);
        data.writeInt8(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeInt16(value) {
        let data = this.alloc(2);
        data.writeInt16LE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeInt32(value) {
        let data = this.alloc(4);
        data.writeInt32LE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeFloat(value) {
        let data = this.alloc(4);
        data.writeFloatLE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeString(value) {
        let data = this.alloc(value.length);
        data.write(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    convertFromDemos(demos) {
        this.writeString(ReplayHeader);
        this.writeInt32(demos.length);

        for (let demo of demos) {
            for (let message of demo.messages) {
                if (message.isType('UserCmd') && message.userCmd) {
                    this.writeInt32(message.userCmd.buttons || 0);
                    this.writeFloat(message.userCmd.forwardMove || 0);
                    this.writeInt8(message.userCmd.impulse || 0);
                    this.writeInt16(message.userCmd.mouseDx || 0);
                    this.writeInt16(message.userCmd.mouseDy || 0);
                    this.writeFloat(message.userCmd.sideMove || 0);
                    this.writeFloat(message.userCmd.upMove || 0);
                    this.writeFloat(message.userCmd.viewAngleX || 0);
                    this.writeFloat(message.userCmd.viewAngleY || 0);
                    this.writeFloat(message.userCmd.viewAngleZ || 0);
                }
            }
        }

        return this.buffer;
    }
}

module.exports = { SourceAutoRecordReplay };
