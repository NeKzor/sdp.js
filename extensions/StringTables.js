const { BitStream } = require('bit-buffer');

const decodeString = (bytes, trim = true) => {
    if (trim) bytes = bytes.slice(0, bytes.indexOf(0x00));
    return String.fromCharCode.apply(null, bytes);
};

class PlayerInfo {
    static create() {
        return new PlayerInfo();
    }
    encode(data, demo) {
        let buf = new BitStream(Buffer.from(data));

        if (demo.header.demoProtocol === 4) {
            let isCsgo = demo.header.gameDirectory === 'csgo';
            this.version = isCsgo ? buf.readBits(64) : buf.readInt32();
            this.xuid = isCsgo ? buf.readBits(64) : buf.readInt32();
        }

        // player_info_s
        this.name = decodeString(buf.readArrayBuffer(32)); // MAX_PLAYER_NAME_LENGTH
        this.userId = buf.readInt32();
        this.guid = decodeString(buf.readArrayBuffer(33)); // SIGNED_GUID_LEN + 1
        this.friendsId = buf.readInt32();
        this.friendsName = decodeString(buf.readArrayBuffer(32)); // MAX_PLAYER_NAME_LENGTH
        this.fakePlayer = buf.readBoolean();
        this.isHltv = buf.readBoolean();
        this.customFiles = [buf.readInt32(), buf.readInt32(), buf.readInt32(), buf.readInt32()];
        this.filesDownloaded = buf.readInt32();
    }
}

module.exports = { userinfo: PlayerInfo };
