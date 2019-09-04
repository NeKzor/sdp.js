const { SourceDemoParser } = require('../src/sdp');
const assert = require('assert');
const fs = require('fs');

describe('SourceDemoParser', () => {
    describe('#Portal', () => {
        it('parse header correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            let demo = SourceDemoParser.default().parse(buffer, { messages: false });

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
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            let demo = SourceDemoParser.default().parse(buffer, { messages: false });

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
/*
describe('SourceDemo', () => {
    describe('#Portal 2', () => {
        it('adjust demo correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal2.dem');
            
            let demo = SourceDemoParser.default()
            .withAutoAdjustment(true)
            .parseDemo(buffer);
            
            assert.equal(demo.playbackTime, 346.93334987640384);
            assert.equal(demo.playbackTicks, 20816);
            
            demo.detectGame(new SourceGame());
            demo.adjust();
            
            assert.equal(demo.playbackTime, 334.6833492922783);
            assert.equal(demo.playbackTicks, 20081);
        });
    });
});
*/
describe('readUserCmds', () => {
    describe('#Portal 2', () => {
        it('read CUserCmd correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            let demo = SourceDemoParser.default()
                .with('userCmds')
                .parse(buffer);

            let { userCmd } = demo.findMessage('UserCmd');

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
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            let demo = SourceDemoParser.default()
                .with('userCmds')
                .parse(buffer);

            let { userCmd } = demo.findMessage('UserCmd');

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
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            let demo = SourceDemoParser.default()
                .with('stringTables')
                .parse(buffer);

            let { stringTables } = demo.findMessage('StringTable');

            assert.equal(stringTables.length, 18);
        });
    });
    describe('#Portal', () => {
        it('read string tables correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            let demo = SourceDemoParser.default()
                .with('stringTables')
                .parse(buffer);

            let { stringTables } = demo.findMessage('StringTable');

            assert.equal(stringTables.length, 16);
        });
    });
});

describe('readDataTables', () => {
    describe('#Portal 2', () => {
        it('read data tables correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            let demo = SourceDemoParser.default()
                .with('dataTables')
                .parse(buffer);

            let { dataTable } = demo.findMessage('DataTable');

            assert.equal(dataTable.tables.length, 307);
            assert.equal(dataTable.serverClasses.length, 236);
        });
    });
    describe('#Portal', () => {
        it('read data tables correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            let demo = SourceDemoParser.default()
                .with('dataTables')
                .parse(buffer);

            let { dataTable } = demo.findMessage('DataTable');

            assert.equal(dataTable.tables.length, 269);
            assert.equal(dataTable.serverClasses.length, 222);
        });
    });
});
describe('readPackets', function() {
    describe('#Portal 2', () => {
        it('read packets correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal2_solo.dem');

            let demo = SourceDemoParser.default()
                .with('packets')
                .parse(buffer);

            let { packets } = demo.findMessage('Packet');

            assert.equal(packets.length, 22);
        });
    });
    describe('#Portal', () => {
        it('read packets correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            let demo = SourceDemoParser.default()
                .with('packets')
                .parse(buffer);

            let { packets } = demo.findMessage('Packet');

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

            let result = [];
            for (let file of files) {
                let buffer = fs.readFileSync(dir + file);

                let demo = SourceDemoParser.default()
                    .with('packets')
                    .parse(buffer);

                let { serverCount } = demo.findMessage('Packet').findPacket('SvcServerInfo');

                result.push({ file, serverCount });
            }

            result
                .sort((a, b) => a.serverCount - b.serverCount)
                .forEach(({ file, serverCount }) => console.log(`${file} -> ${serverCount}`));
        });
    });
});
 */