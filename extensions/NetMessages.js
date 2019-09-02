class NetMessage {
    static create() {
        return new this();
    }
    name() {
        return this.constructor.name;
    }
    encode() {
        throw new Error(`Encoding for ${this.name()} not implemented!`);
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
class NetSplitScreenUser extends NetMessage {
    encode(buf) {
        this.unk = buf.readBoolean();
    }
}
class NetTick extends NetMessage {
    encode(buf) {
        this.tick = buf.readInt32();
        this.hostFrameTime = buf.readInt16();
        this.hostFrameTimeStdDeviation = buf.readInt16();
    }
}
class NetStringCmd extends NetMessage {
    encode(buf) {
        this.command = buf.readASCIIString();
    }
}
class NetSetConVar extends NetMessage {
    encode(buf) {
        this.conVars = [];
        let length = buf.readInt8();
        while (length--) {
            this.conVars.push({
                name: buf.readASCIIString(),
                value: buf.readASCIIString(),
            });
        }
    }
}
class NetSignonState extends NetMessage {
    encode(buf, demo) {
        this.signonState = buf.readInt8();
        this.spawnCount = buf.readInt32();
        if (demo.header.demoProtocol === 4) {
            this.unk1 = buf.readInt32();
            this.unk2 = buf.readInt32();
            if (this.unk2 > 0) {
                this.unk2Buffer = buf.readArrayBuffer(this.unk2);
            }
            this.unk3 = buf.readInt32();
            if (this.unk3 > 0) {
                this.unk3Buffer = buf.readArrayBuffer(this.unk3);
            }
        }
    }
}
class SvcServerInfo extends NetMessage {
    encode(buf, demo) {
        let newEngine = demo.header.demoProtocol === 4;

        this.protocol = buf.readInt16();
        this.serverCount = buf.readInt32();
        this.isHltv = buf.readBoolean();
        this.isDedicated = buf.readBoolean();
        this.clientCrc = buf.readInt32();
        this.maxClasses = buf.readUint16();
        this.mapCrc = newEngine ? buf.readInt32() : buf.readBits(128);
        this.playerSlot = buf.readInt8();
        this.maxClients = buf.readInt8();
        if (newEngine) {
            this.unk1 = buf.readInt16();
            this.unk2 = buf.readInt16();
        }
        this.tickInterval = buf.readFloat32();
        this.operatingSystem = String.fromCharCode(buf.readInt8());
        this.gameDir = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.hostName = buf.readASCIIString();
    }
}
class SvcSendTable extends NetMessage {}
class SvcClassInfo extends NetMessage {
    encode(buf) {
        this.length = buf.readInt16();
        this.createOnClient = buf.readBoolean();
        if (!this.createOnClient) {
            this.serverClasses = [];
            while (this.length-- > 0) {
                this.serverClasses.push({
                    classId: buf.readBits(Math.log2(this.length, 2) + 1),
                    className: buf.readASCIIString(),
                    dataTableName: buf.readASCIIString(),
                });
            }
        }
    }
}
class SvcSetPause extends NetMessage {
    encode(buf) {
        this.paused = buf.readBoolean();
    }
}
class SvcCreateStringTable extends NetMessage {
    encode(buf) {
        this.tableName = buf.readASCIIString();
        this.maxEntries = buf.readInt16();
        this.entries = buf.readBits(Math.log2(this.maxEntries) + 1);
        this.length = buf.readBits(20);
        this.userDataFixedSize = buf.readBoolean();
        this.userDataSize = this.userDataFixedSize ? buf.readBits(12) : 0;
        this.userDataSizeBits = this.userDataFixedSize ? buf.readBits(4) : 0;
        this.unk = buf.readBits(2);
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
class SvcVoiceInit extends NetMessage {
    encode(buf) {
        this.voiceCodec = buf.readASCIIString();
        this.quality = buf.readInt8();
        if (this.quality === 255) this.unk = buf.readFloat32();
    }
}
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
class SvcSounds extends NetMessage {
    encode(buf) {
        this.reliableSound = buf.readBoolean();
        this.sounds = this.reliableSound ? 1 : buf.readBits(8);
        this.length = this.reliableSound ? buf.readBits(8) : buf.readBits(16);
        this.data = buf.readBits(this.length);
    }
}
class SvcSetView extends NetMessage {
    encode(buf) {
        this.entityIndex = buf.readBits(11);
    }
}
class SvcFixAngle extends NetMessage {
    encode(buf) {
        this.relative = buf.readBoolean();
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
}
class SvcCrosshairAngle extends NetMessage {
    encode(buf) {
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
}
class SvcBspDecal extends NetMessage {
    encode(buf) {
        const readBitVec3Coord = (buf) => {
            const readBitCoord = (buf) => {
                const COORD_INTEGER_BITS = 14;
                const COORD_FRACTIONAL_BITS = 5;
                const COORD_DENOMINATOR = 1 << COORD_FRACTIONAL_BITS;
                const COORD_RESOLUTION = 1.0 / COORD_DENOMINATOR;

                let value = 0.0;
                let intval = buf.readBits(1);
                let fractval = buf.readBits(1);
                if (intval || fractval) {
                    let signbit = buf.readBits(1);
                    if (intval) {
                        intval = buf.readBits(COORD_INTEGER_BITS) + 1;
                    }
                    if (fractval) {
                        fractval = buf.readBits(COORD_FRACTIONAL_BITS);
                    }
                    value = intval + fractval * COORD_RESOLUTION;
                    if (signbit) value = -value;
                }
                return value;
            };

            let [x, y, z] = [buf.readBoolean(), buf.readBoolean(), buf.readBoolean()];
            return [x ? readBitCoord(buf) : 0, y ? readBitCoord(buf) : 0, z ? readBitCoord(buf) : 0];
        };

        this.position = readBitVec3Coord(buf);
        this.decalTextureIndex = buf.readBits(9);
        this.hasEntities = buf.readBoolean();
        this.entityIndex = this.hasEntities ? buf.readBits(11) : 0;
        this.modelIndex = this.hasEntities ? buf.readBits(11) : 0;
        this.lowPriority = buf.readBoolean();
    }
}
class SvcSplitScreen extends NetMessage {
    encode(buf) {
        this.unk = buf.readBits(1);
        this.length = buf.readBits(11);
        this.data = buf.readBits(this.length);
    }
}
class SvcUserMessage extends NetMessage {
    encode(buf) {
        this.type = buf.readBits(8);
        this.length = buf.readBits(12);
        this.data = buf.readBits(this.length);
    }
}
class SvcEntityMessage extends NetMessage {
    encode(buf) {
        this.entityIndex = buf.readBits(11);
        this.classId = buf.readBits(9);
        this.length = buf.readBits(11);
        buf.readBits(this.length);
    }
}
class SvcGameEvent extends NetMessage {
    encode(buf) {
        this.length = buf.readBits(11);
        this.data = buf.readBits(this.length);
    }
}
class SvcPacketEntities extends NetMessage {
    encode(buf) {
        this.maxEntries = buf.readBits(11);
        this.isDelta = buf.readBoolean();
        this.deltaFrom = this.isDelta ? buf.readInt32() : 0;
        this.baseLine = buf.readBoolean();
        this.updatedEntries = buf.readBits(11);
        this.length = buf.readBits(20);
        this.updateBaseline = buf.readBoolean();
        this.data = buf.readBits(this.length);
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
        this.events = buf.readBits(9);
        this.length = buf.readBits(20);
        this.data = buf.readBits(this.length);
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
class SvcPaintMapData extends NetMessage {
    encode(buf) {
        this.length = buf.readInt32();
        this.data = buf.readBits(this.length);
    }
}

module.exports = {
    Portal2Engine: [
        NetNop, // 0
        NetDisconnect, // 1
        NetFile, // 2
        NetSplitScreenUser, // 3
        NetTick, // 4
        NetStringCmd, // 5
        NetSetConVar, // 6
        NetSignonState, // 7
        SvcServerInfo, // 8
        SvcSendTable, // 9
        SvcClassInfo, // 10
        SvcSetPause, // 11
        SvcCreateStringTable, // 12
        SvcUpdateStringTable, // 13
        SvcVoiceInit, // 14
        SvcVoiceData, // 15
        SvcPrint, // 16
        SvcSounds, // 17
        SvcSetView, // 18
        SvcFixAngle, // 19
        SvcCrosshairAngle, // 20
        SvcBspDecal, // 21
        SvcSplitScreen, // 22
        SvcUserMessage, // 23
        SvcEntityMessage, // 24
        SvcGameEvent, // 25
        SvcPacketEntities, // 26
        SvcTempEntities, // 27
        SvcPrefetch, // 28
        SvcMenu, // 29
        SvcGameEventList, // 30
        SvcGetCvarValue, // 31
        SvcCmdKeyValues, // 32
        SvcPaintMapData, // 33
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
