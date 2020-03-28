const { ConsoleCmd, UserCmd } = require('../messages');

const ReplayHeader = 'sar-tas-replay v1.8\n';

class SarTimer {
    static default() {
        return new SarTimer();
    }
    time(demo) {
        if (demo.messages.length === 0) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }

        const timings = [];
        for (const message of demo.messages) {
            if (message instanceof ConsoleCmd) {
                if (message.command === 'sar_timer_start') {
                    timings.push({ tick: message.tick, type: 'start' });
                } else if (message.command === 'sar_timer_stop') {
                    timings.push({ tick: message.tick, type: 'stop' });
                }
            }
        }

        const start = timings.reverse().find((x) => x.type === 'start');
        const end = timings.find((x) => x.type === 'stop');

        return start !== undefined && end !== undefined
            ? { startTick: start.tick, endTick: end.tick, delta: end.tick - start.tick }
            : undefined;
    }
}

class SarReplay extends Buffer {
    constructor(size) {
        this.buffer = this.alloc(size);
    }
    static default() {
        return new SarReplay(0);
    }
    convert(demos) {
        this.writeString(ReplayHeader);
        this.writeInt32(demos.length);

        for (const demo of demos) {
            for (const message of demo.messages) {
                if (message instanceof UserCmd && message.userCmd) {
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
    writeInt8(value) {
        const data = this.alloc(1);
        data.writeInt8(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeInt16(value) {
        const data = this.alloc(2);
        data.writeInt16LE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeInt32(value) {
        const data = this.alloc(4);
        data.writeInt32LE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeFloat(value) {
        const data = this.alloc(4);
        data.writeFloatLE(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
    writeString(value) {
        const data = this.alloc(value.length);
        data.write(value, 0);
        this.buffer = this.concat([this.buffer, data]);
    }
}

module.exports = { SarTimer, SarReplay };
