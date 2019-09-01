class NetMessage {
    static create() {
        return new this();
    }
    encode() {
        throw new Error(`Encoding for ${this.constructor.name} not implemented!`);
    }
}

class NetNop extends NetMessage {
    encode() {}
}
class NetDisconnect extends NetMessage {
    encode(buf) {
        this.text = buf.readASCIIString();
    }
}
class NetFile extends NetMessage {
    encode(buf) {
        this.transferId = buf.readUint32();
        this.fileName = buf.readASCIIString();
        this.fileRequested = buf.readBoolean();
    }
}
class NetSplitScreenUser extends NetMessage {}
class NetTick extends NetMessage {
    encode(buf) {
        this.tick = buf.readInt32();
        this.hostFrameTime = buf.readInt16();
        this.hostFrameTimeStdDeviation = buf.readInt16();
    }
}
class NetStringCmd extends NetMessage {
    encode(buf) {
        this.command = buf.readASCIIString(256); // MAX_COMMAND_LEN
    }
}
class NetSetConVar extends NetMessage {
    encode(buf) {
        this.conVars = [];
        let length = buf.readInt32();
        while (length-- != 0) {
            this.conVars.push({
                name: buf.readASCIIString(),
                value: buf.readASCIIString(),
            });
        }
    }
}
class NetSignonState extends NetMessage {
    encode(buf) {
        this.signonState = buf.readInt8();
        this.spawnCount = buf.readInt32();
    }
}
class SvcServerInfo extends NetMessage {
    encode(buf, demo) {
        this.protocol = buf.readInt16();
        this.serverCount = buf.readInt32();
        this.isHltv = buf.readBoolean();
        this.isDedicated = buf.readBoolean();
        this.clientCrc = buf.readInt32();
        this.maxClasses = buf.readUint16();
        this.mapCrc = demo.header.demoProtocol < 18 ? buf.readInt32() : buf.readBits(128);
        this.playerSlot = buf.readInt8();
        this.maxClients = buf.readInt8();
        this.unk = buf.readInt16();
        this.unk2 = buf.readInt16();
        this.tickInterval = buf.readFloat32();
        this.operatingSystem = String.fromCharCode(buf.readInt8());
        this.gameDir = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.hostName = buf.readASCIIString();
    }
}
class SvcSendTable extends NetMessage {}
class SvcClassInfo extends NetMessage {}
class SvcSetPause extends NetMessage {}
class SvcCreateStringTable extends NetMessage {
    encode(buf) {
        this.tableName = buf.readASCIIString(); // 256
        this.maxEntries = buf.readInt16();
        let toread = Math.log(this.maxEntries, 2) + 1;
        this.entries = buf.readBits(toread === 1 ? 2 : toread);
        this.length = buf.readBits(20); // NET_MAX_PALYLOAD_BITS + 3
        this.userDataFixedSize = buf.readBoolean();
        this.userDataSize = this.userDataFixedSize ? buf.readBits(12) : 0;
        this.userDataSizeBits = this.userDataFixedSize ? buf.readBits(4) : 0;
        this.compressed = buf.readBoolean();
        this.data = buf.readBits(this.length);
    }
}
class SvcUpdateStringTable extends NetMessage {
    encode(buf) {
        this.id = buf.readBits(5);
        this.entriesChanged = buf.readBoolean();
        this.changedEntries = this.entriesChanged ? buf.readInt16() : 1;
        this.length = buf.readBits(20, false);
        this.data = buf.readBits(this.length);
    }
}
class SvcVoiceInit extends NetMessage {}
class SvcVoiceData extends NetMessage {
    encode(buf) {
        this.fromClient = buf.readInt8();
        this.proximity = buf.readInt8();
        this.length = buf.readUint16();
        this.data = buf.readBits(this.length);
    }
}
class SvcPrint extends NetMessage {
    encode(buf) {
        this.message = buf.readASCIIString();
    }
}
class SvcSounds extends NetMessage {}
class SvcSetView extends NetMessage {
    encode(buf) {
        this.entityIndex = buf.readBits(11);
    }
}
class SvcFixAngle extends NetMessage {}
class SvcCrosshairAngle extends NetMessage {}
class SvcBspDecal extends NetMessage {}
class SvcSplitScreen extends NetMessage {}
class SvcUserMessage extends NetMessage {}
class SvcEntityMessage extends NetMessage {
    encode(buf) {
        this.entityIndex = buf.readBits(11); // MAX_EDICT_BITS
        this.classId = buf.readBits(9); // MAX_SERVER_CLASS_BITS
        this.length = buf.readBits(11);
        buf.readBits(this.length);
    }
}
class SvcGameEvent extends NetMessage {}
class SvcPacketEntities extends NetMessage {
    encode(buf) {
        this.maxEntries = buf.readBits(11); // ?
        this.isDelta = buf.readBoolean();
        this.deltaFrom = this.isDelta ? buf.readInt32() : 0;
        //let length = buf.readUint32();
        this.baseLine = buf.readBoolean();
        this.updatedEntries = buf.readBits(11); // ?
        this.length = buf.readBits(20);
        this.updateBaseline = buf.readBoolean();
        buf.readBits(this.length);
    }
}
class SvcTempEntities extends NetMessage {
    encode(buf) {
        this.entries = buf.readBits(8);
        this.length = buf.readBits(17);
        this.data = buf.readBits(this.length);
    }
}
class SvcPrefetch extends NetMessage {
    encode(buf) {
        this.soundIndex = buf.readBits(13);
    }
}
class SvcMenu extends NetMessage {
    encode(buf) {
        this.menuType = buf.readint16();
        this.length = buf.readUint32();
        this.data = buf.readBits(this.length);
    }
}
class SvcGameEventList extends NetMessage {
    encode(buf) {
        this.events = buf.readBits(9); // ?
        this.length = buf.readBits(20); // ?
        //this.data = buf.readBits(this.length);
    }
}
class SvcGetCvarValue extends NetMessage {
    encode(buf) {
        this.cookie = buf.readInt32();
        this.cvarName = buf.readASCIIString();
    }
}
class SvcCmdKeyValues extends NetMessage {
    encode(buf) {
        this.length = buf.readUint32();
        this.buffer = buf.readArrayBuffer(this.length);
    }
}

module.exports = {
    Portal2Engine: [
        NetNop,
        NetDisconnect,
        NetFile,
        NetSplitScreenUser,
        NetTick,
        NetStringCmd,
        NetSetConVar,
        NetSignonState,
        SvcServerInfo,
        SvcSendTable,
        SvcClassInfo,
        SvcSetPause,
        SvcCreateStringTable,
        SvcUpdateStringTable,
        SvcVoiceInit,
        SvcVoiceData,
        SvcPrint,
        SvcSounds,
        SvcSetView,
        SvcFixAngle,
        SvcCrosshairAngle,
        SvcBspDecal,
        SvcSplitScreen,
        SvcUserMessage,
        SvcEntityMessage,
        SvcGameEvent,
        SvcPacketEntities,
        SvcTempEntities,
        SvcPrefetch,
        SvcMenu,
        SvcGameEventList,
        SvcGetCvarValue,
        SvcCmdKeyValues,
    ],
    HalfLife2Engine: [
        NetNop,
        NetDisconnect,
        NetFile,
        NetTick,
        NetStringCmd,
        NetSetConVar,
        NetSignonState,
        SvcPrint,
        SvcServerInfo,
        SvcSendTable,
        SvcClassInfo,
        SvcSetPause,
        SvcCreateStringTable,
        SvcUpdateStringTable,
        SvcVoiceInit,
        SvcVoiceData,
        undefined,
        SvcSounds,
        SvcSetView,
        SvcFixAngle,
        SvcCrosshairAngle,
        SvcBspDecal,
        undefined,
        SvcUserMessage,
        SvcEntityMessage,
        SvcGameEvent,
        SvcPacketEntities,
        SvcTempEntities,
        SvcPrefetch,
        SvcMenu,
        SvcGameEventList,
        SvcGetCvarValue,
        SvcCmdKeyValues,
    ],
};
