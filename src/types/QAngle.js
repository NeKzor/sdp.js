class QAngle {
    constructor(pitch, yaw, roll) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.roll = roll;
    }
    *[Symbol.iterator]() {
        yield this.pitch;
        yield this.yaw;
        yield this.roll;
    }
}

module.exports = { QAngle };
