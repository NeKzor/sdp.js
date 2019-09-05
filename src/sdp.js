const { SourceDemo } = require('./demo');
const DemoMessages = require('./messages');
const { SourceDemoParser } = require('./parser');
const DataTables = require('./types/DataTables');
const { GameEventManager } = require('./types/GameEventManager');
const NetMessages = require('./types/NetMessages');
const SoundInfo = require('./types/SoundInfo');
const StringTables = require('./types/StringTables');
const { UserCmd } = require('./types/UserCmd');
const SourceGames = require('./speedrun/games');
const { SarTimer, SarReplay } = require('./speedrun/sar');
const { SourceTimer, TimingResult } = require('./speedrun/timer');

module.exports = {
    SourceDemo,
    SourceDemoParser,
    DemoMessages,
    DataTables,
    StringTables,
    NetMessages,
    UserCmd,
    GameEventManager,
    SoundInfo,
    Speedrun: {
        SourceTimer,
        SourceGames,
        TimingResult,
        SarTimer,
        SarReplay,
    },
};
