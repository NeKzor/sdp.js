const { SoundInfo } = require('./SoundInfo');
const { GameEventManager } = require('./GameEventManager');

class NetMessage {
    constructor(type) {
        Object.defineProperty(this, '_type', {
            enumerable: false,
            value: type,
        });
    }
    getType() {
        return this._type;
    }
    getName() {
        return this.constructor.name;
    }
    isType(name) {
        return this.constructor.name === name;
    }
    read() {
        throw new Error(`read() for ${this.constructor.name} not implemented!`);
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
        this.transferId = buf.readInt32();
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
        this.convars = [];
        let length = buf.readInt8();
        while (length--) {
            this.convars.push({
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
        if (demo.isNewEngine()) {
            this.numServerPlayers = buf.readInt32();
            let length = buf.readInt32();
            if (length > 0) {
                this.playersNetworkids = buf.readArrayBuffer(length);
            }
            length = buf.readInt32();
            if (length > 0) {
                this.mapName = buf.readASCIIString(length);
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
        this.maxClasses = buf.readInt16();
        this.mapCrc = buf.readInt32();
        this.playerSlot = buf.readInt8();
        this.maxClients = buf.readInt8();
        if (demo.isNewEngine()) {
            this.unk = buf.readInt32();
        } else if (demo.networkProtocol === 24) {
            this.unk = buf.readBits(96);
        }
        this.tickInterval = buf.readFloat32();
        this.cOs = String.fromCharCode(buf.readInt8());
        this.gameDir = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.hostName = buf.readASCIIString();
    }
}
class SvcSendTable extends NetMessage {
    read(buf) {
        this.needsDecoder = buf.readBoolean();
        let length = buf.readInt16();
        this.props = buf.readBits(length);
    }
}
class SvcClassInfo extends NetMessage {
    read(buf) {
        let length = buf.readInt16();
        this.createOnClient = buf.readBoolean();
        if (!this.createOnClient) {
            this.serverClasses = [];
            while (length--) {
                this.serverClasses.push({
                    classId: buf.readBits(Math.log2(length) + 1),
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
        this.name = buf.readASCIIString();
        this.maxEntries = buf.readInt16();
        this.numEntries = buf.readBits(Math.log2(this.maxEntries) + 1);
        let length = buf.readBits(20);
        this.userDataFixedSize = buf.readBoolean();
        this.userDataSize = this.userDataFixedSize ? buf.readBits(12) : 0;
        this.userDataSizeBits = this.userDataFixedSize ? buf.readBits(4) : 0;
        this.flags = buf.readBits(demo.isNewEngine() ? 2 : 1);
        this.stringData = buf.readBits(length);
    }
}
class SvcUpdateStringTable extends NetMessage {
    read(buf) {
        this.tableId = buf.readBits(5);
        this.numChangedEntries = buf.readBoolean() ? buf.readInt16() : 1;
        let length = buf.readBits(20);
        this.stringData = buf.readBits(length);
    }
}
class SvcVoiceInit extends NetMessage {
    read(buf) {
        this.codec = buf.readASCIIString();
        this.quality = buf.readInt8();
        if (this.quality === 255) this.unk = buf.readFloat32();
    }
}
class SvcVoiceData extends NetMessage {
    read(buf) {
        this.client = buf.readInt8();
        this.proximity = buf.readInt8();
        let length = buf.readInt16();
        this.voiceData = buf.readBits(length);
    }
}
class SvcPrint extends NetMessage {
    read(buf) {
        this.message = buf.readASCIIString();
    }
}
class SvcSounds extends NetMessage {
    read(buf, demo) {
        this.reliableSound = buf.readBoolean();
        let sounds = this.reliableSound ? 1 : buf.readBits(8);
        let length = this.reliableSound ? buf.readBits(8) : buf.readBits(16);
        let data = buf.readBitStream(length);

        if (demo.demoProtcol === 3) {
            this.sounds = [];
            while (sounds--) {
                let sound = new SoundInfo();
                sound.read(data, demo);
                this.sounds.push(sound);
            }
        }
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
        this.pos = buf.readVectorCoord(buf);
        this.decalTextureIndex = buf.readBits(9);
        let flag = buf.readBoolean();
        this.entityIndex = flag ? buf.readBits(11) : 0;
        this.modelIndex = flag ? buf.readBits(11) : 0;
        this.lowPriority = buf.readBoolean();
    }
}
class SvcSplitScreen extends NetMessage {
    read(buf) {
        this.unk = buf.readBits(1);
        let length = buf.readBits(11);
        this.data = buf.readBits(length);
    }
}
class SvcUserMessage extends NetMessage {
    read(buf, demo) {
        this.msgType = buf.readInt8();
        let length = buf.readBits(demo.isNewEngine() ? 12 : 11);
        this.msgData = buf.readBits(length);
    }
}
class SvcEntityMessage extends NetMessage {
    read(buf) {
        this.entityIndex = buf.readBits(11);
        this.classId = buf.readBits(9);
        let length = buf.readBits(11);
        buf.readBits(length);
    }
}
class SvcGameEvent extends NetMessage {
    read(buf, demo) {
        let length = buf.readBits(11);
        let data = buf.readBitStream(length);

        if (demo.gameEventManager) {
            this.event = demo.gameEventManager.unserializeEvent(data);
        } else {
            this.data = data;
        }
    }
}
class SvcPacketEntities extends NetMessage {
    read(buf) {
        this.maxEntries = buf.readBits(11);
        this.isDelta = buf.readBoolean();
        this.deltaFrom = this.isDelta ? buf.readInt32() : 0;
        this.baseLine = buf.readBoolean();
        this.updatedEntries = buf.readBits(11);
        let length = buf.readBits(20);
        this.updateBaseline = buf.readBoolean();
        this.data = buf.readBits(length);
    }
}
class SvcTempEntities extends NetMessage {
    read(buf) {
        this.numEntries = buf.readInt8();
        let length = buf.readBits(17);
        this.data = buf.readBitStream(length);
    }
}
class SvcPrefetch extends NetMessage {
    read(buf) {
        this.soundIndex = buf.readBits(13);
    }
}
class SvcMenu extends NetMessage {
    read(buf) {
        this.menuType = buf.readInt16();
        let length = buf.readInt32();
        this.data = buf.readBits(length);
    }
}
class SvcGameEventList extends NetMessage {
    read(buf, demo) {
        class GameEventDescriptor {
            read(buf) {
                this.eventId = buf.readBits(9);
                this.name = buf.readASCIIString();
                this.keys = {};

                let type = buf.readBits(3);
                while (type !== 0) {
                    this.keys[buf.readASCIIString()] = type;
                    type = buf.readBits(3);
                }
            }
        }

        let events = buf.readBits(9);
        let length = buf.readBits(20);
        let data = buf.readBitStream(length);

        let gameEvents = [];
        while (events--) {
            let descriptor = new GameEventDescriptor();
            descriptor.read(data);
            gameEvents.push(descriptor);
        }

        demo.gameEventManager = new GameEventManager(gameEvents);
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
        let length = buf.readInt32();
        this.buffer = buf.readArrayBuffer(length);
    }
}
class SvcPaintMapData extends NetMessage {
    read(buf) {
        let length = buf.readInt32();
        this.data = buf.readBitStream(length);
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
        NetNop, // 0
        NetDisconnect, // 1
        NetFile, // 2
        NetTick, // 3
        NetStringCmd, // 4
        NetSetConVar, // 5
        NetSignonState, // 6
        SvcPrint, // 7
        SvcServerInfo, // 8
        SvcSendTable, // 9
        SvcClassInfo, // 10
        SvcSetPause, // 11
        SvcCreateStringTable, // 12
        SvcUpdateStringTable, // 13
        SvcVoiceInit, // 14
        SvcVoiceData, // 15
        undefined,
        SvcSounds, // 17
        SvcSetView, // 18
        SvcFixAngle, // 19
        SvcCrosshairAngle, // 20
        SvcBspDecal, // 21
        undefined,
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
    ],
};
