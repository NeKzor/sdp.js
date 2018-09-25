var Parser = require('binary-parser').Parser;

var dataParser = new Parser()
    .endianess('little')
    .int32('size')
    .array('data', { type: 'int8', lengthInBytes: 'size' });

// Vector
var vectorParser = new Parser()
    .endianess('little')
    .float('x') // vec_t 0-4
    .float('y') // vec_t 5-8
    .float('z'); // vec_t 9-12

// QAngle
var qAngleParser = vectorParser;

// democmdinfo_t
var cmdInfoParser = new Parser()
    .endianess('little')
    .int32('flags')
    .array('viewOrigin', { length: 1, type: vectorParser })
    .array('viewAngles', { length: 1, type: qAngleParser })
    .array('localViewAngles', { length: 1, type: qAngleParser })
    .array('viewOrigin2', { length: 1, type: vectorParser })
    .array('viewAngles2', { length: 1, type: qAngleParser })
    .array('localViewAngles2', { length: 1, type: qAngleParser });

// 0x1 & 0x02
var defaultPacketParser = new Parser()
    .endianess('little')
    .array('packetInfo', { length: 2, type: cmdInfoParser })
    .int32('inSequence')
    .int32('outSequence')
    .array('data', { length: 1, type: dataParser });

var oldPacketParser = new Parser()
    .endianess('little')
    .array('packetInfo', { length: 1, type: cmdInfoParser })
    .int32('inSequence')
    .int32('outSequence')
    .array('data', { length: 1, type: dataParser });

// 0x03
var syncTickParser = new Parser();

// 0x04
var consoleCmdParser = new Parser()
    .endianess('little')
    .int32('size')
    .string('command', { encoding: 'ascii', length: 'size', stripNull: true });

// 0x05
var userCmdParser = new Parser()
    .endianess('little')
    .int32('cmd')
    .array('data', { length: 1, type: dataParser });

// 0x06
var dataTableParser = new Parser()
    .endianess('little')
    .array('data', { length: 1, type: dataParser });

// 0x07
var stopParser = new Parser()
    .endianess('little')
    .array('rest', { readUntil: 'eof', type: 'int8' });

// 0x08
var customDataParser = new Parser()
    .endianess('little')
    .int32('unk')
    .array('data', { length: 1, type: dataParser });

// 0x09 (0x08)
var stringTablesParser = new Parser()
    .endianess('little')
    .array('data', { length: 1, type: dataParser });

// Protocol 4
var defaultMessageParser = new Parser()
    .endianess('little')
    .bit8('type')
    .int32('tick')
    .bit8('alignment')
    .choice('message', {
        tag: 'type',
        choices: {
            0x01: defaultPacketParser,
            0x02: defaultPacketParser,
            0x03: syncTickParser,
            0x04: consoleCmdParser,
            0x05: userCmdParser,
            0x06: dataTableParser,
            0x07: stopParser,
            0x08: customDataParser,
            0x09: stringTablesParser
        }
    });

// Protocol 2 & 3
var oldMessageParser = new Parser()
    .endianess('little')
    .bit8('type')
    .int32('tick')
    .choice('message', {
        tag: 'type',
        choices: {
            0x01: oldPacketParser,
            0x02: oldPacketParser,
            0x03: syncTickParser,
            0x04: consoleCmdParser,
            0x05: userCmdParser,
            0x06: dataTableParser,
            0x07: stopParser,
            0x08: stringTablesParser
        }
    });

var headerParser = new Parser()
    .endianess('little')
    .string('demoFileStamp', { encoding: 'ascii', length: 8, stripNull: true })
    .int32('demoProtocol')
    .int32('networkProtocol')
    .string('serverName', { encoding: 'ascii', length: 260, stripNull: true })
    .string('clientName', { encoding: 'ascii', length: 260, stripNull: true })
    .string('mapName', { encoding: 'ascii', length: 260, stripNull: true })
    .string('gameDirectory', { encoding: 'ascii', length: 260, stripNull: true })
    .float('playbackTime')
    .int32('playbackTicks')
    .int32('playbackFrames')
    .int32('signOnLength');

class SourceDemo {
    constructor() {
        this.header = undefined;
        this.messages = undefined;
    }
    intervalPerTick() {
        return this.header.playbackTime / this.header.playbackTicks;
    }
    tickrate() {
        return Math.ceil(this.header.playbackTicks / this.header.playbackTime);
    }
    adjust(endTick = 0, startTick = 0, sourceGame = undefined) {
        if (this.messages.length == 0) {
            throw new Error('Cannot adjust demo without parsed messages.');
        }

        let synced = false;
        let last = 0;
        for (let message of this.messages) {
            if (message.type == 0x03) {
                synced = true;
            }

            if (!synced) {
                message.tick = 0;
            } else if (message.tick < 0) {
                message.tick = last;
            }
            last = message.tick;
        }

        if (endTick < 1) {
            endTick = this.messages[this.messages.length - 1].tick;
        }

        let delta = endTick - startTick;
        if (delta < 0) {
            throw new Error('Start tick is greater than end tick.');
        }

        let ipt = this.intervalPerTick();
        this.header.playbackTicks = delta;
        this.header.playbackTime = ipt * delta;

        if (sourceGame != undefined) {
            return sourceGame.adjustByRules(this);
        }

        return this;
    }
}

class SourceDemoParser {
    constructor() {
        this.headerParser = headerParser;
        this.messageParser = undefined;
        this.autoConfigure = true;
        this.autoAdjust = false;
        this.headerOnly = false;
    }
    parseDemoHeader(demo, buffer) {
        demo.header = this.headerParser.parse(buffer);

        if (demo.header.demoFileStamp != 'HL2DEMO') {
            throw new Error(`Invalid demo file stamp: ${demo.header.demoFileStamp}`);
        }

        return this;
    }
    parseDemoMessages(demo, buffer) {
        this.messageParser = new Parser()
            .endianess('little')
            .skip(8 + 4 + 4 + 4 * 260 + 4 + 4 + 4 + 4);

        if (this.autoConfigure) {
            switch (demo.header.demoProtocol) {
                case 2:
                case 3:
                    this.messageParser.array('messages', { readUntil: 'eof', type: oldMessageParser });
                    break;
                case 4:
                    this.messageParser.array('messages', { readUntil: 'eof', type: defaultMessageParser });
                    break;
                default:
                    throw new Error(`Invalid demo protocol: ${demo.header.demoProtocol}`);
            }
        }

        // Oof
        let rest = 4 - (buffer.length % 4);
        while (rest--) {
            buffer = Buffer.concat([buffer], buffer.length + 1);
        }

        demo.messages = this.messageParser.parse(buffer).messages;

        if (this.autoAdjust) {
            demo.adjust();
        }

        return this;
    }
    parseDemo(buffer) {
        let demo = new SourceDemo();

        this.parseDemoHeader(demo, buffer);

        if (!this.headerOnly) {
            this.parseDemoMessages(demo, buffer);
        }

        return demo;
    }
}

var { SourceGames, SourceGame } = require('./game.js');

module.exports = { SourceDemo, SourceDemoParser, SourceGames, SourceGame };
