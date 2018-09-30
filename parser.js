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
    .string('command', { encoding: 'utf8', length: 'size', stripNull: true });

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
    .string('demoFileStamp', { encoding: 'utf8', length: 8, stripNull: true })
    .int32('demoProtocol')
    .int32('networkProtocol')
    .string('serverName', { encoding: 'utf8', length: 260, stripNull: true })
    .string('clientName', { encoding: 'utf8', length: 260, stripNull: true })
    .string('mapName', { encoding: 'utf8', length: 260, stripNull: true })
    .string('gameDirectory', { encoding: 'utf8', length: 260, stripNull: true })
    .float('playbackTime')
    .int32('playbackTicks')
    .int32('playbackFrames')
    .int32('signOnLength');

var { SourceDemo } = require('./demo.js');

class SourceDemoParser {
    constructor() {
        this.headerOnly = false;
        this.headerParser = headerParser;
        this.messageParser = undefined;
        this.autoConfigure = true;
        this.autoAdjust = false;
        this.defaultGame = undefined;
    }
    static default() {
        return new SourceDemoParser();
    }
    withHeaderOnly(headerOnly) {
        this.headerOnly = headerOnly;
        return this;
    }
    withHeaderParser(headerParser) {
        this.headerParser = headerParser;
        return this;
    }
    withMessageParser(messageParser) {
        this.messageParser = messageParser;
        return this;
    }
    withAutoConfiguration(autoConfigure) {
        this.autoConfigure = autoConfigure;
        return this;
    }
    withAutoAdjustment(autoAdjust) {
        this.autoAdjust = autoAdjust;
        return this;
    }
    withDefaultGame(defaultGame) {
        this.defaultGame = defaultGame;
        return this;
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
            if (this.defaultGame != undefined) {
                demo.detectGame(this.defaultGame);
            }
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

module.exports = { SourceDemoParser };
