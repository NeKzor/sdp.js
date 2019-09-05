const ReplayHeader = 'sar-tas-replay v1.8\n';

class SarTimer {
    static default() {
        return new SarTimer();
    }
    time(demo) {
        if (demo.messages.length === 0) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }

        let timings = [];
        for (let message of demo.messages) {
            if (message.isType('ConsoleCmd')) {
                if (message.command === 'sar_timer_start') {
                    timings.push({ tick: message.tick, type: 'start' });
                } else if (message.command === 'sar_timer_stop') {
                    timings.push({ tick: message.tick, type: 'stop' });
                }
            }
        }

        let start = timings.reverse().find((x) => x.type === 'start');
        let end = timings.find((x) => x.type === 'stop');

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
}

module.exports = { SarTimer, SarReplay };
