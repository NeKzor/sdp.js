const DemoMessages = require('./messages');
const { SendTable, ServerClassInfo } = require('./types/DataTables');
const NetMessages = require('./types/NetMessages');
const { StringTable } = require('./types/StringTables');
const { UserCmd } = require('./types/UserCmd');

class SourceDemo {
    static default() {
        return new this();
    }
    isNewEngine() {
        return this.demoProtocol === 4;
    }
    findMessage(type) {
        return this.messages.find((msg) => msg.isType(type));
    }
    findMessages(type) {
        return this.messages.filter((msg) => msg.isType(type));
    }
    readHeader(buf) {
        this.demoFileStamp = buf.readASCIIString(8);
        if (this.demoFileStamp !== 'HL2DEMO') {
            throw new Error(`Invalid demo file stamp: ${this.demoFileStamp}`);
        }
        this.demoProtocol = buf.readInt32();
        this.networkProtocol = buf.readInt32();
        this.serverName = buf.readASCIIString(260);
        this.clientName = buf.readASCIIString(260);
        this.mapName = buf.readASCIIString(260);
        this.gameDirectory = buf.readASCIIString(260);
        this.playbackTime = buf.readFloat32();
        this.playbackTicks = buf.readInt32();
        this.playbackFrames = buf.readInt32();
        this.signOnLength = buf.readInt32();
        this.messages = [];

        return this;
    }
    readMessages(buf) {
        let readSlot = this.isNewEngine();
        let demoMessages = readSlot ? DemoMessages.NewEngine : DemoMessages.OldEngine;

        while (buf.bitsLeft > 8) {
            let type = buf.readInt8();
            let messageType = demoMessages[type];
            if (messageType) {
                let message = messageType
                    .default(type)
                    .setTick(buf.readInt32())
                    .setSlot(readSlot ? buf.readInt8() : undefined)
                    .read(buf, this);
                this.messages.push(message);
            } else {
                throw new Error(`Unknown demo message type: ${type}`);
            }
        }

        return this;
    }
    readUserCmds() {
        for (let message of this.messages) {
            if (message.isType('UserCmd')) {
                let cmd = new UserCmd();
                cmd.read(message.data);
                message.userCmd = cmd;
            }
        }

        return this;
    }
    readStringTables() {
        for (let message of this.messages) {
            if (message.isType('StringTable')) {
                let stringTables = [];

                let tables = message.data.readInt8();
                while (tables--) {
                    let table = new StringTable();
                    table.read(message.data, this);
                    stringTables.push(table);
                }

                message.stringTables = stringTables;
            }
        }

        return this;
    }
    readDataTables() {
        for (let message of this.messages) {
            if (message.isType('DataTable')) {
                let dataTable = {
                    tables: [],
                    serverClasses: [],
                };

                while (message.data.readBoolean()) {
                    let dt = new SendTable();
                    dt.read(message.data, this);
                    dataTable.tables.push(dt);
                }

                let classes = message.data.readInt16();
                while (classes--) {
                    let sc = new ServerClassInfo();
                    sc.read(message.data, this);
                    dataTable.serverClasses.push(sc);
                }

                
                message.dataTable = dataTable;
            }
        }

        return this;
    }
    readPackets(netMessages = undefined) {
        netMessages = netMessages || (this.demoProtocol === 4 ? NetMessages.Portal2Engine : NetMessages.HalfLife2Engine);

        for (let message of this.messages) {
            if (message.isType('Packet')) {
                //console.log('-------- DEMO MESSAGE TICK ' + message.tick + ' --------');
                let packets = [];
                while (message.data.bitsLeft > 6) {
                    let type = message.data.readBits(6);

                    const NetMessage = netMessages[type];
                    if (NetMessage) {
                        let packet = new NetMessage(type);
                        //console.log(packet.getName());
                        packet.read(message.data, this);
                        //console.log({ ...packet });
                        packets.push(packet);
                    } else {
                        throw new Error(`Net message type ${type} unknown!`);
                    }
                }

                message.packets = packets;
            }
        }
    }
    detectGame(sourceGame) {
        this.game = sourceGame.gameList.find((game) => game.directory === this.gameDirectory);
        if (this.game != undefined) {
            this.game.source = sourceGame;
        }
        return this;
    }
    intervalPerTick() {
        if (this.playbackTicks === 0) {
            if (this.game != undefined) {
                return 1 / this.game.tickrate;
            }
            throw new Error('Cannot find ipt of null tick demo.');
        }
        return this.playbackTime / this.playbackTicks;
    }
    tickrate() {
        if (this.playbackTime === 0) {
            if (this.game != undefined) {
                return this.game.tickrate;
            }
            throw new Error('Cannot find tickrate of null tick demo.');
        }
        return this.playbackTicks / this.playbackTime;
    }
    adjustTicks() {
        if (this.messages.length === 0) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }

        let synced = false;
        let last = 0;
        for (let message of this.messages) {
            if (message.isType('SyncTick')) {
                synced = true;
            }

            if (!synced) {
                message.tick = 0;
            } else if (message.tick < 0) {
                message.tick = last;
            }
            last = message.tick;
        }

        return this;
    }
    adjustRange(endTick = 0, startTick = 0) {
        if (this.messages.length === 0) {
            throw new Error('Cannot adjust range without parsed messages.');
        }

        if (endTick < 1) {
            endTick = this.messages[this.messages.length - 1].tick;
        }

        let delta = endTick - startTick;
        if (delta < 0) {
            throw new Error('Start tick is greater than end tick.');
        }

        let ipt = this.intervalPerTick();
        this.playbackTicks = delta;
        this.playbackTime = ipt * delta;

        return this;
    }
    adjust(splitScreenIndex = 0) {
        this.adjustTicks();
        this.adjustRange();
        return this.game != undefined ? this.game.source.adjustByRules(this, splitScreenIndex) : this;
    }
}

module.exports = {
    SourceDemo,
};
