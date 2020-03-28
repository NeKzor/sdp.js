![ci-status](https://github.com/NeKzor/sdp.js/workflows/Node%20CI/badge.svg)

## Examples

### Header Only

```js
const buffer = fs.readFileSync('demo.dem');

const demo = SourceDemoParser.default()
    .setOptions({ messages: false })
    .parse(buffer);

console.log(demo);

/*
    SourceDemo {
    demoFileStamp: 'HL2DEMO',
    demoProtocol: 3,
    networkProtocol: 15,
    serverName: 'localhost:0',
    clientName: 'Can\'t Even',
    mapName: 'testchmb_a_00',
    gameDirectory: 'portal',
    playbackTime: 3.944999933242798,
    playbackTicks: 263,
    playbackFrames: 253,
    signOnLength: 80641,
    messages: [] }
*/
```

### Jump Stats

```js
const IN_JUMP = 1 << 1;

const demo = SourceDemoParser.default()
    .setOptions({ userCmds: true })
    .parse(fs.readFileSync(file));

const registeredJumps = demo.findMessages(UserCmd)
    .filter(({ userCmd }) => userCmd.buttons && userCmd.buttons & IN_JUMP);

console.log('registered jumps: ' + registeredJumps.length);

/*
    registered jumps: 270
*/
```

### View Origin

[![showcase.gif](showcase.gif)](https://nekzor.github.io/parser)
