class CmdInfo {
    read(buf) {
        const readVec3 = () => {
            return {
                x: buf.readFloat32(),
                y: buf.readFloat32(),
                z: buf.readFloat32(),
            };
        };

        this.flags = buf.readInt32();
        this.viewOrigin = readVec3();
        this.viewAngles = readVec3();
        this.localViewAngles = readVec3();
        this.viewOrigin2 = readVec3();
        this.viewAngles2 = readVec3();
        this.localViewAngles2 = readVec3();

        return this;
    }
}

module.exports = {
    CmdInfo,
};
