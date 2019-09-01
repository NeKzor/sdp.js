const { Parser } = require('binary-parser');
const { BitStream } = require('bit-buffer');
const { SourceDemo } = require('./demo.js');
const { SendPropFlags, SendPropType } = require('./extensions/DataTables');
const StringTables = require('./extensions/StringTables');
const NetMessages = require('./extensions/NetMessages');

const dataParser = new Parser()
    .endianess('little')
    .int32('size')
    .array('data', { type: 'int8', lengthInBytes: 'size' });

// Vector
const vectorParser = new Parser()
    .endianess('little')
    .float('x') // vec_t 0-4
    .float('y') // vec_t 5-8
    .float('z'); // vec_t 9-12

// QAngle
const qAngleParser = vectorParser;

// democmdinfo_t
const cmdInfoParser = new Parser()
    .endianess('little')
    .int32('flags')
    .array('viewOrigin', { length: 1, type: vectorParser })
    .array('viewAngles', { length: 1, type: qAngleParser })
    .array('localViewAngles', { length: 1, type: qAngleParser })
    .array('viewOrigin2', { length: 1, type: vectorParser })
    .array('viewAngles2', { length: 1, type: qAngleParser })
    .array('localViewAngles2', { length: 1, type: qAngleParser });

// 0x1 & 0x02
const defaultPacketParser = new Parser()
    .endianess('little')
    .array('packetInfo', { length: 2, type: cmdInfoParser })
    .int32('inSequence')
    .int32('outSequence')
    .array('data', { length: 1, type: dataParser });

const oldPacketParser = new Parser()
    .endianess('little')
    .array('packetInfo', { length: 1, type: cmdInfoParser })
    .int32('inSequence')
    .int32('outSequence')
    .array('data', { length: 1, type: dataParser });

// 0x03
const syncTickParser = new Parser();

// 0x04
const consoleCmdParser = new Parser()
    .endianess('little')
    .int32('size')
    .string('command', { encoding: 'utf8', length: 'size', stripNull: true });

// 0x05
const userCmdParser = new Parser()
    .endianess('little')
    .int32('cmd')
    .array('data', { length: 1, type: dataParser });

// 0x06
const dataTableParser = new Parser().endianess('little').array('data', { length: 1, type: dataParser });

// 0x07
const stopParser = new Parser().endianess('little').array('rest', { readUntil: 'eof', type: 'int8' });

// 0x08
const customDataParser = new Parser()
    .endianess('little')
    .int32('unk')
    .array('data', { length: 1, type: dataParser });

// 0x09 (0x08)
const stringTablesParser = new Parser().endianess('little').array('data', { length: 1, type: dataParser });

// Protocol 4
const defaultMessageParser = new Parser()
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
            0x09: stringTablesParser,
        },
    });

// Protocol 2 & 3
const oldMessageParser = new Parser()
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
            0x08: stringTablesParser,
        },
    });

const headerParser = new Parser()
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
        this.messageParser = new Parser().endianess('little').skip(0x430);

        if (this.autoConfigure) {
            switch (demo.header.demoProtocol) {
                case 2:
                case 3:
                    this.messageParser.array('messages', {
                        readUntil: 'eof',
                        type: oldMessageParser,
                    });
                    break;
                case 4:
                    this.messageParser.array('messages', {
                        readUntil: 'eof',
                        type: defaultMessageParser,
                    });
                    break;
                default:
                    throw new Error(`Invalid demo protocol: ${demo.header.demoProtocol}`);
            }
        }

        // Oof
        let rest = 4 - (buffer.length % 4);
        let alignedBuffer = Buffer.concat([buffer], buffer.length + rest);

        demo.messages = this.messageParser.parse(alignedBuffer).messages;

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
    encodeUserCmdMessages(demo) {
        let result = [];
        for (let message of demo.messages) {
            if (message.type === 0x05 && message.message.data[0].size > 0) {
                let buf = new BitStream(Buffer.from(message.message.data[0].data));

                let cmd = { source: message };
                if (buf.readBoolean()) cmd.commandNumber = buf.readInt32();
                if (buf.readBoolean()) cmd.tickCount = buf.readInt32();
                if (buf.readBoolean()) cmd.viewAngleX = buf.readFloat32();
                if (buf.readBoolean()) cmd.viewAngleY = buf.readFloat32();
                if (buf.readBoolean()) cmd.viewAngleZ = buf.readFloat32();
                if (buf.readBoolean()) cmd.forwardMove = buf.readFloat32();
                if (buf.readBoolean()) cmd.sideMove = buf.readFloat32();
                if (buf.readBoolean()) cmd.upMove = buf.readFloat32();
                if (buf.readBoolean()) cmd.buttons = buf.readInt32();
                if (buf.readBoolean()) cmd.impulse = buf.readInt8();
                if (buf.readBoolean()) {
                    cmd.weaponSelect = buf.readBits(11);
                    if (buf.readBoolean()) cmd.weaponSubtype = buf.readBits(6);
                }
                if (buf.readBoolean()) cmd.mouseDx = buf.readInt16();
                if (buf.readBoolean()) cmd.mouseDy = buf.readInt16();
                result.push(cmd);
            }
        }
        return result;
    }
    encodeStringTables(demo, stringTableEncoder = StringTables) {
        let stringTableFlag = demo.header.demoProtocol === 4 ? 0x09 : 0x08;

        let frames = [];
        for (let message of demo.messages) {
            if (message.type === stringTableFlag && message.message.data[0].size > 0) {
                let buf = new BitStream(Buffer.from(message.message.data[0].data));

                let tables = buf.readInt8();
                while (tables--) {
                    let name = buf.readASCIIString();
                    let entries = buf.readInt16();
                    while (entries--) {
                        let entry = buf.readASCIIString();
                        if (buf.readBoolean()) {
                            let length = buf.readInt16();
                            let data = buf.readArrayBuffer(length);
                            let encoder = stringTableEncoder[name];
                            if (encoder) {
                                let stringTable = encoder.create();
                                stringTable.encode(data, demo);
                                frames.push({
                                    [name]: stringTable,
                                });
                            }
                        }
                    }

                    if (buf.readBoolean()) {
                        let entries = buf.readInt16();
                        while (entries--) {
                            let entry = buf.readASCIIString();
                            if (buf.readBoolean()) {
                                let length = buf.readInt16();
                                let data = buf.readArrayBuffer(length);
                            }
                        }
                    }
                }
            }
        }
        return frames;
    }
    encodeDataTables(demo) {
        let infoBitFlags = demo.header.demoProtocol === 2 ? 11 : 16;
        let isPortal2 = demo.header.gameDirectory === 'portal2';

        let frames = [];
        for (let message of demo.messages) {
            if (message.type === 0x06 && message.message.data[0].size > 0) {
                let buf = new BitStream(Buffer.from(message.message.data[0].data));

                let frame = {
                    source: message,
                    tables: [],
                    classes: [],
                };

                while (buf.readBoolean()) {
                    let needsDecoder = buf.readBoolean();
                    let netTableName = buf.readASCIIString();
                    let table = {
                        needsDecoder,
                        netTableName,
                        props: [],
                    };

                    let props = buf.readBits(10, false);
                    while (props--) {
                        let type = buf.readBits(5, false);
                        let varName = buf.readASCIIString();
                        let flags = buf.readBits(infoBitFlags, false);
                        let prop = {
                            type,
                            varName,
                            flags,
                            isExcludeProp: function() {
                                return (this.flags & SendPropFlags.Exclude) !== 0;
                            },
                        };

                        if (isPortal2) {
                            prop.unk = buf.readBits(11, false);
                        }

                        if (prop.type === SendPropType.DataTable || prop.isExcludeProp()) {
                            prop.excludeDtName = buf.readASCIIString();
                        } else if (
                            prop.type === SendPropType.String ||
                            prop.type === SendPropType.Int ||
                            prop.type === SendPropType.Float ||
                            prop.type === SendPropType.Vector ||
                            prop.type === SendPropType.VectorXy
                        ) {
                            if (isPortal2) {
                                prop.unk2 = buf.readBits(71, false);
                            } else {
                                prop.lowValue = buf.readFloat32();
                                prop.highValue = buf.readFloat32();
                                prop.bits = buf.readBits(7, false);
                            }
                        } else if (prop.type === SendPropType.Array) {
                            prop.elements = buf.readBits(10, false);
                        } else {
                            throw new Error('Invalid prop type: ' + prop.type);
                        }

                        table.props.push(prop);
                    }

                    frame.tables.push(table);
                }

                let classes = buf.readInt16();
                while (classes--) {
                    frame.classes.push({
                        classId: buf.readInt16(),
                        className: buf.readASCIIString(),
                        dataTableName: buf.readASCIIString(),
                    });
                }

                frames.push(frame);
            }
        }
        return frames;
    }
    encodePackets(demo, netMessages = undefined) {
        netMessages = netMessages || (demo.header.demoProtocol === 4 ? NetMessages.Portal2Engine : NetMessages.HalfLife2Engine);

        let frames = [];
        for (let message of demo.messages) {
            if ((message.type === 0x01 || message.type === 0x02) && message.message.data[0].size > 0) {
                let packets = [];
                let buf = new BitStream(Buffer.from(message.message.data[0].data));

                while (buf.bitsLeft > 6) {
                    let type = buf.readBits(6);

                    let message = netMessages[type];
                    if (message) {
                        message = netMessage.create();
                        message.encode(buf, demo);
                        //console.log(message);
                    } else {
                        throw new Error('Unknown type: ' + type);
                    }

                    packets.push({ type, message });
                }

                frames.push({ source: message, packets });
            }
        }
        return frames;
    }
}

module.exports = { SourceDemoParser };
