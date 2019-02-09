const { SourceDemo, SourceGames, SourceGame, SourceDemoParser } = require('../sdp.js');
const assert = require('assert');
var fs = require('fs');

describe('SourceDemoParser', () => {
    describe('#Portal', () => {
        it('parse header correctly', () => {
            let demo = new SourceDemo();
            let buffer = fs.readFileSync('./demos/public/portal.dem');

            SourceDemoParser.default()
                .withHeaderOnly(true)
                .parseDemoHeader(demo, buffer);

            assert.equal(demo.header.demoFileStamp, 'HL2DEMO');
            assert.equal(demo.header.demoProtocol, 3);
            assert.equal(demo.header.networkProtocol, 15);
            assert.equal(demo.header.serverName, 'localhost:0');
            assert.equal(demo.header.clientName, 'Can\'t Even');
            assert.equal(demo.header.mapName, 'testchmb_a_00');
            assert.equal(demo.header.gameDirectory, 'portal');
            assert.equal(demo.header.playbackTime, 3.944999933242798);
            assert.equal(demo.header.playbackTicks, 263);
            assert.equal(demo.header.playbackFrames, 253);
            assert.equal(demo.header.signOnLength, 80641);
        });
    });
    describe('#Portal 2', () => {
        it('parse header correctly', () => {
            let demo = new SourceDemo();
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            SourceDemoParser.default()
                .withHeaderOnly(true)
                .parseDemoHeader(demo, buffer);

            assert.equal(demo.header.demoFileStamp, 'HL2DEMO');
            assert.equal(demo.header.demoProtocol, 4);
            assert.equal(demo.header.networkProtocol, 2001);
            assert.equal(demo.header.serverName, 'localhost:27015');
            assert.equal(demo.header.clientName, 'PerOculos');
            assert.equal(demo.header.mapName, 'sp_a1_intro1');
            assert.equal(demo.header.gameDirectory, 'portal2');
            assert.equal(demo.header.playbackTime, -1.6666667461395264);
            assert.equal(demo.header.playbackTicks, -100);
            assert.equal(demo.header.playbackFrames, 10405);
            assert.equal(demo.header.signOnLength, 116002);
        });
    });
});
describe('SourceDemo', () => {
    describe('#Portal 2', () => {
        it('adjust demo correctly', () => {
            let buffer = fs.readFileSync('./demos/public/portal2.dem');

            let demo = SourceDemoParser.default()
                .withAutoAdjustment(true)
                .parseDemo(buffer);

            assert.equal(demo.header.playbackTime, 346.93334987640384);
            assert.equal(demo.header.playbackTicks, 20816);

            demo.detectGame(new SourceGame());
            demo.adjust();

            assert.equal(demo.header.playbackTime, 334.6833492922783);
            assert.equal(demo.header.playbackTicks, 20081);
        });
    });
});
