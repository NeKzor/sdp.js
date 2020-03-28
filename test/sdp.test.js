const {
    SourceDemoParser,
    DemoMessages,
    Speedrun: { SourceTimer },
} = require('../src/sdp');
const assert = require('assert');
const fs = require('fs');

describe('SourceDemoParser', () => {
    describe('#Portal', () => {
        it('parse header correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ messages: false })
                .parse(buffer);

            assert.equal(demo.demoFileStamp, 'HL2DEMO');
            assert.equal(demo.demoProtocol, 3);
            assert.equal(demo.networkProtocol, 15);
            assert.equal(demo.serverName, 'localhost:0');
            assert.equal(demo.clientName, "Can't Even");
            assert.equal(demo.mapName, 'testchmb_a_00');
            assert.equal(demo.gameDirectory, 'portal');
            assert.equal(demo.playbackTime, 3.944999933242798);
            assert.equal(demo.playbackTicks, 263);
            assert.equal(demo.playbackFrames, 253);
            assert.equal(demo.signOnLength, 80641);
        });
    });
    describe('#Portal 2', () => {
        it('parse header correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ messages: false })
                .parse(buffer);

            assert.equal(demo.demoFileStamp, 'HL2DEMO');
            assert.equal(demo.demoProtocol, 4);
            assert.equal(demo.networkProtocol, 2001);
            assert.equal(demo.serverName, 'localhost:27015');
            assert.equal(demo.clientName, 'PerOculos');
            assert.equal(demo.mapName, 'sp_a1_intro1');
            assert.equal(demo.gameDirectory, 'portal2');
            assert.equal(demo.playbackTime, -1.6666667461395264);
            assert.equal(demo.playbackTicks, -100);
            assert.equal(demo.playbackFrames, 10405);
            assert.equal(demo.signOnLength, 116002);
        });
    });
});
describe('SourceDemo', () => {
    describe('#Portal 2', () => {
        it('time speedrun correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2.dem');

            const demo = SourceDemoParser.default()
                .parse(buffer)
                .adjustTicks()
                .adjustRange()
                .detectGame();

            assert.equal(demo.playbackTime, 346.93334987640384);
            assert.equal(demo.playbackTicks, 20816);

            const result = SourceTimer.default().time(demo);

            assert.equal(demo.playbackTime, 334.6833492922783);
            assert.equal(demo.playbackTicks, 20081);

            assert.equal(result.delta, 735);
        });
    });
});
describe('readUserCmds', () => {
    describe('#Portal 2', () => {
        it('read CUserCmd correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ userCmds: true })
                .parse(buffer);

            const { userCmd } = demo.findMessage(DemoMessages.UserCmd);

            assert.equal(userCmd.commandNumber, 3299);
            assert.equal(userCmd.tickCount, 100);
            assert.equal(userCmd.viewAngleX, undefined);
            assert.equal(userCmd.viewAngleY, 9.99755859375);
            assert.equal(userCmd.viewAngleZ, undefined);
            assert.equal(userCmd.forwardMove, undefined);
            assert.equal(userCmd.sideMove, undefined);
            assert.equal(userCmd.upMove, undefined);
            assert.equal(userCmd.buttons, undefined);
            assert.equal(userCmd.impulse, undefined);
            assert.equal(userCmd.weaponSelect, undefined);
            assert.equal(userCmd.weaponSubtype, undefined);
            assert.equal(userCmd.mouseDx, undefined);
            assert.equal(userCmd.mouseDy, undefined);
        });
    });
    describe('#Portal', () => {
        it('read CUserCmd correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ userCmds: true })
                .parse(buffer);

            const { userCmd } = demo.findMessage(DemoMessages.UserCmd);

            assert.equal(userCmd.commandNumber, 16);
            assert.equal(userCmd.tickCount, 4262);
            assert.equal(userCmd.viewAngleX, -0.13199999928474426);
            assert.equal(userCmd.viewAngleY, -171.32244873046875);
            assert.equal(userCmd.viewAngleZ, undefined);
            assert.equal(userCmd.forwardMove, undefined);
            assert.equal(userCmd.sideMove, undefined);
            assert.equal(userCmd.upMove, undefined);
            assert.equal(userCmd.buttons, undefined);
            assert.equal(userCmd.impulse, undefined);
            assert.equal(userCmd.weaponSelect, undefined);
            assert.equal(userCmd.weaponSubtype, undefined);
            assert.equal(userCmd.mouseDx, undefined);
            assert.equal(userCmd.mouseDy, undefined);
        });
    });
});
describe('readStringTables', () => {
    describe('#Portal 2', () => {
        it('read string tables correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ stringTables: true })
                .parse(buffer);

            const { stringTables } = demo.findMessage(DemoMessages.StringTable);

            assert.equal(stringTables.length, 18);
        });
    });
    describe('#Portal', () => {
        it('read string tables correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ stringTables: true })
                .parse(buffer);

            const { stringTables } = demo.findMessage(DemoMessages.StringTable);

            assert.equal(stringTables.length, 16);
        });
    });
});

describe('readDataTables', () => {
    describe('#Portal 2', () => {
        it('read data tables correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ dataTables: true })
                .parse(buffer);

            const { dataTable } = demo.findMessage(DemoMessages.DataTable);

            assert.equal(dataTable.tables.length, 307);
            assert.equal(dataTable.serverClasses.length, 236);
        });
    });
    describe('#Portal', () => {
        it('read data tables correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ dataTables: true })
                .parse(buffer);

            const { dataTable } = demo.findMessage(DemoMessages.DataTable);

            assert.equal(dataTable.tables.length, 269);
            assert.equal(dataTable.serverClasses.length, 222);
        });
    });
});
describe('readPackets', function() {
    describe('#Portal 2', () => {
        it('read packets correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal2_solo.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ packets: true })
                .parse(buffer);

            const { packets } = demo.findMessage(DemoMessages.Packet);

            assert.equal(packets.length, 22);
        });
    });
    describe('#Portal', () => {
        it('read packets correctly', () => {
            const buffer = fs.readFileSync('./demos/public/portal.dem');

            const demo = SourceDemoParser.default()
                .setOptions({ packets: true })
                .parse(buffer);

            const { packets } = demo.findMessage(DemoMessages.Packet);

            assert.equal(packets.length, 19);
        });
    });
});
/* describe('readPackets', function() {
    this.timeout(0);

    describe('#Portal 2', () => {
        it('read packets correctly', () => {
            const dir = './demos/private/coop/';
            const files = fs.readdirSync(dir);

            const result = [];
            for (const file of files) {
                const buffer = fs.readFileSync(dir + file);

                const demo = SourceDemoParser.default()
                    .setOptions({ packets: true })
                    .parse(buffer);

                const { serverCount } = demo.findMessage(DemoMessages.Packet).findPacket(NetMessages.SvcServerInfo);

                result.push({ file, serverCount });
            }

            result
                .sort((a, b) => a.serverCount - b.serverCount)
                .forEach(({ file, serverCount }) => console.log(`${file} -> ${serverCount}`));
        });
    });
});
 */
