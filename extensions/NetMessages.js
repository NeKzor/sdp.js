class NetMessage {
    constructor(type) {
        Object.defineProperty(this, '_type', {
            enumerable: false,
            value: type,
        });
    }
    get type() {
        return this._type;
    }
    get name() {
        return this.constructor.name;
    }
    read() {
        throw new Error(`read() for ${this.name} not implemented!`);
    }
    write() {
        throw new Error(`write() for ${this.name} not implemented!`);
    }
}

class NetNop extends NetMessage {
    read() {}
}
class NetDisconnect extends NetMessage {
    read(buf) {
        this.text = buf.readASCIIString();
    }
}
class NetFile extends NetMessage {
    read(buf) {
        this.transferId = buf.readUint32();
        this.fileName = buf.readASCIIString();
        this.fileRequested = buf.readBoolean();
    }
}
class NetSplitScreenUser extends NetMessage {
    read(buf) {
        this.unk = buf.readBoolean();
    }
}
class NetTick extends NetMessage {
    read(buf) {
        const NET_TICK_SCALEUP = 100000;
        this.tick = buf.readInt32();
        this.hostFrameTime = buf.readInt16() / NET_TICK_SCALEUP;
        this.hostFrameTimeStdDeviation = buf.readInt16() / NET_TICK_SCALEUP;
    }
}
class NetStringCmd extends NetMessage {
    read(buf) {
        this.command = buf.readASCIIString();
    }
}
class NetSetConVar extends NetMessage {
    read(buf) {
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
    read(buf, demo) {
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
    read(buf, demo) {
        this.protocol = buf.readInt16();
        this.serverCount = buf.readInt32();
        this.isHltv = buf.readBoolean();
        this.isDedicated = buf.readBoolean();
        this.clientCrc = buf.readInt32();
        this.maxClasses = buf.readUint16();
        this.mapCrc = buf.readInt32();
        this.playerSlot = buf.readInt8();
        this.maxClients = buf.readInt8();
        if (demo.header.demoProtocol === 4) {
            this.unk = buf.readInt32();
        } else if (demo.header.networkProtocol === 24) {
            this.unk = buf.readBits(96);
        }
        this.tickInterval = buf.readFloat32();
        this.operatingSystem = String.fromCharCode(buf.readInt8());
        this.gameDir = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.hostName = buf.readASCIIString();
    }
}
class SvcSendTable extends NetMessage {
    read(buf) {
        this.needsDecoder = buf.readBoolean();
        this.length = buf.readInt16();
        this.data = buf.readBits(this.data);
    }
}
class SvcClassInfo extends NetMessage {
    read(buf) {
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
    read(buf) {
        this.paused = buf.readBoolean();
    }
}
class SvcCreateStringTable extends NetMessage {
    read(buf, demo) {
        this.tableName = buf.readASCIIString();
        this.maxEntries = buf.readInt16();
        this.entries = buf.readBits(Math.log2(this.maxEntries) + 1);
        this.length = buf.readBits(20);
        this.userDataFixedSize = buf.readBoolean();
        this.userDataSize = this.userDataFixedSize ? buf.readBits(12) : 0;
        this.userDataSizeBits = this.userDataFixedSize ? buf.readBits(4) : 0;
        this.unk = buf.readBits(demo.header.demoProtocol === 4 ? 2 : 1);
        this.data = buf.readBits(this.length);
    }
}
class SvcUpdateStringTable extends NetMessage {
    read(buf) {
        this.id = buf.readBits(5);
        this.entriesChanged = buf.readBoolean();
        this.changedEntries = this.entriesChanged ? buf.readInt16() : 1;
        this.length = buf.readBits(20, false);
        this.data = buf.readBits(this.length);
    }
}
class SvcVoiceInit extends NetMessage {
    read(buf) {
        this.voiceCodec = buf.readASCIIString();
        this.quality = buf.readInt8();
        if (this.quality === 255) this.unk = buf.readFloat32();
    }
}
class SvcVoiceData extends NetMessage {
    read(buf) {
        this.fromClient = buf.readInt8();
        this.proximity = buf.readInt8();
        this.length = buf.readUint16();
        this.data = buf.readBits(this.length);
    }
}
class SvcPrint extends NetMessage {
    read(buf) {
        this.message = buf.readASCIIString();
    }
}
class SvcSounds extends NetMessage {
    read(buf) {
        this.reliableSound = buf.readBoolean();
        this.sounds = this.reliableSound ? 1 : buf.readBits(8);
        this.length = this.reliableSound ? buf.readBits(8) : buf.readBits(16);
        this.data = buf.readBits(this.length);
    }
}
class SvcSetView extends NetMessage {
    read(buf) {
        this.entityIndex = buf.readBits(11);
    }
}
class SvcFixAngle extends NetMessage {
    read(buf) {
        this.relative = buf.readBoolean();
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
}
class SvcCrosshairAngle extends NetMessage {
    read(buf) {
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
}
class SvcBspDecal extends NetMessage {
    read(buf) {
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
    read(buf) {
        this.unk = buf.readBits(1);
        this.length = buf.readBits(11);
        this.data = buf.readBits(this.length);
    }
}
class SvcUserMessage extends NetMessage {
    read(buf, demo) {
        this.umType = buf.readBits(8);
        this.length = buf.readBits(demo.header.demoProtocol === 4 ? 12 : 11);
        this.data = buf.readBits(this.length);
    }
}
class SvcEntityMessage extends NetMessage {
    read(buf) {
        this.entityIndex = buf.readBits(11);
        this.classId = buf.readBits(9);
        this.length = buf.readBits(11);
        buf.readBits(this.length);
    }
}
class SvcGameEvent extends NetMessage {
    read(buf) {
        this.length = buf.readBits(11);
        this.data = buf.readBits(this.length);
    }
}
class SvcPacketEntities extends NetMessage {
    read(buf) {
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
    read(buf) {
        this.entries = buf.readBits(8);
        this.length = buf.readBits(17);
        this.data = buf.readBits(this.length);
    }
}
class SvcPrefetch extends NetMessage {
    read(buf) {
        this.soundIndex = buf.readBits(13);
    }
}
class SvcMenu extends NetMessage {
    read(buf) {
        this.menuType = buf.readint16();
        this.length = buf.readUint32();
        this.data = buf.readBits(this.length);
    }
}
class SvcGameEventList extends NetMessage {
    read(buf) {
        this.events = buf.readBits(9);
        this.length = buf.readBits(20);
        this.data = buf.readBits(this.length);
    }
}
class SvcGetCvarValue extends NetMessage {
    read(buf) {
        this.cookie = buf.readInt32();
        this.cvarName = buf.readASCIIString();
    }
}
class SvcCmdKeyValues extends NetMessage {
    read(buf) {
        this.length = buf.readUint32();
        this.buffer = buf.readArrayBuffer(this.length);
    }
}
class SvcPaintMapData extends NetMessage {
    read(buf) {
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
