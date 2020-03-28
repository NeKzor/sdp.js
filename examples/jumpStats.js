const fs = require('fs');
const {
    SourceDemoParser,
    DemoMessages: { ConsoleCmd, UserCmd },
} = require('../src/sdp');

const file = process.argv[2];

if (!file) {
    console.error('demo path argument not specified!');
    return;
}

const IN_JUMP = 1 << 1;

const demo = SourceDemoParser.default().setOptions({ userCmds: true }).parse(fs.readFileSync(file));

const registeredJumps = demo
    .findMessages(UserCmd)
    .filter(({ userCmd }) => userCmd.buttons && userCmd.buttons & IN_JUMP);

const actualJumpInputs = demo.findMessages(ConsoleCmd).filter(({ command }) => command.startsWith('+jump'));

let prevTick = 0;
let mouseJumps = 0;
let keyboardJumps = 0;

actualJumpInputs.forEach(({ tick, command }) => {
    const mouse = command.endsWith('112') || command.endsWith('113');
    if (tick !== prevTick) {
        console.log('-----------------');
    }
    console.log(`${tick} ${command.split(' ')[0]} (${mouse ? 'mouse' : 'keyboard'})`);

    if (mouse) {
        ++mouseJumps;
    } else {
        ++keyboardJumps;
    }
    prevTick = tick;
});

console.log('---- results ----');
console.log('registered jumps: ' + registeredJumps.length);
console.log('actual jump inputs: ' + actualJumpInputs.length);
console.log('jumps not registered: ' + (actualJumpInputs.length - registeredJumps.length));
console.log('jumps with mouse: ' + mouseJumps);
console.log('jumps with keyboard: ' + keyboardJumps);
