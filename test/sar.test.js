const { SourceAutoRecord } = require('../extensions/sar');
const { SourceDemo, SourceGames, SourceGame, SourceDemoParser } = require('../sdp.js');
const fs = require('fs');

let buffer = fs.readFileSync('./demos/public/portal2_cm.dem');

let demo = SourceDemoParser.default().parseDemo(buffer);
let replay = SourceAutoRecord.convertToReplay([demo]);

fs.writeFileSync('test.str', replay);
