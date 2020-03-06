class CmdInfo {
    read(buf) {
        this.flags = buf.readInt32();
        this.viewOrigin = buf.readVector();
        this.viewAngles = buf.readQAngle();
        this.localViewAngles = buf.readQAngle();
        this.viewOrigin2 = buf.readVector();
        this.viewAngles2 = buf.readQAngle();
        this.localViewAngles2 = buf.readQAngle();

        return this;
    }
}

module.exports = {
    CmdInfo,
};
