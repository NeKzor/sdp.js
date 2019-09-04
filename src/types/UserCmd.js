class UserCmd {
    read(buf) {
        if (buf.readBoolean()) this.commandNumber = buf.readInt32();
        if (buf.readBoolean()) this.tickCount = buf.readInt32();
        if (buf.readBoolean()) this.viewAngleX = buf.readFloat32();
        if (buf.readBoolean()) this.viewAngleY = buf.readFloat32();
        if (buf.readBoolean()) this.viewAngleZ = buf.readFloat32();
        if (buf.readBoolean()) this.forwardMove = buf.readFloat32();
        if (buf.readBoolean()) this.sideMove = buf.readFloat32();
        if (buf.readBoolean()) this.upMove = buf.readFloat32();
        if (buf.readBoolean()) this.buttons = buf.readInt32();
        if (buf.readBoolean()) this.impulse = buf.readInt8();
        if (buf.readBoolean()) {
            this.weaponSelect = buf.readBits(11);
            if (buf.readBoolean()) this.weaponSubtype = buf.readBits(6);
        }
        if (buf.readBoolean()) this.mouseDx = buf.readInt16();
        if (buf.readBoolean()) this.mouseDy = buf.readInt16();
    }
}

module.exports = {
    UserCmd,
};
