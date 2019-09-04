class StringTable {
    read(buf, demo) {
        this.name = buf.readASCIIString();
        this.entries = [];
        this.classes = [];

        const EntryType = StringTableEntryTypes[this.name];

        let entries = buf.readInt16();
        while (entries--) {
            let entryName = buf.readASCIIString();
            let entry = new StringTableEntry(entryName);

            if (buf.readBoolean()) {
                entry.read(buf, EntryType, demo);
            }

            this.entries.push(entry);
        }

        if (buf.readBoolean()) {
            let entries = buf.readInt16();
            while (entries--) {
                let entryName = buf.readASCIIString();
                let entry = new StringTableClass(entryName);

                if (buf.readBoolean()) {
                    entry.read(buf, demo);
                }

                this.classes.push(entry);
            }
        }
    }
}

class StringTableEntry {
    constructor(name) {
        this.name = name;
    }
    read(buf, type, demo) {
        let length = buf.readInt16();
        if (type) {
            this.data = new type();
            this.data.read(buf.readBitStream(length * 8), demo);
        } else {
            this.data = buf.readArrayBuffer(length);
        }
    }
}

class StringTableClass {
    constructor(name) {
        this.name = name;
    }
    read(buf) {
        let length = buf.readInt16();
        this.data = buf.readASCIIString(length);
    }
}

// player_info_s
class PlayerInfo {
    read(buf, demo) {
        if (demo.isNewEngine()) {
            this.version = buf.readInt32();
            this.xuid = buf.readInt32();
        }
        this.name = buf.readASCIIString(32);
        this.userId = buf.readInt32();
        this.guid = buf.readASCIIString(32);
        this.friendsId = buf.readInt32();
        this.friendsName = buf.readASCIIString(32);
        this.fakePlayer = buf.readBoolean();
        this.isHltv = buf.readBoolean();
        this.customFiles = [buf.readInt32(), buf.readInt32(), buf.readInt32(), buf.readInt32()];
        this.filesDownloaded = buf.readInt32();
    }
}

const StringTableEntryTypes = { userinfo: PlayerInfo };

module.exports = { StringTable, StringTableEntry, StringTableClass, StringTableEntryTypes };
