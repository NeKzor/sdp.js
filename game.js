// prettier-ignore
const SourceGames = [
    require('./games/portal'),
    require('./games/portal2'),
    require('./games/mel'),
    require('./games/tag')
];

class SourceGame {
    constructor() {
        this.gameList = SourceGames;
    }
    static default() {
        return new SourceGame();
    }
    withGameList(gameList) {
        this.gameList = gameList;
        return this;
    }
    adjustByRules(demo, splitScreenIndex = 0) {
        if (demo.game != undefined) {
            let getGameInfo = () => {
                let map = new Map();

                let packets = demo.messages.filter((msg) => msg.type === 0x02);
                let commands = demo.messages.filter((msg) => msg.type === 0x04);

                packets.forEach((p) => map.set(p.tick, {}));
                commands.forEach((p) => map.set(p.tick, {}));

                let oldPosition = { x: 0, y: 0, z: 0 };
                let oldCommands = [];

                for (let [tick, info] of map) {
                    if (tick === 0) {
                        continue;
                    }

                    let packet = packets.find((p) => p.tick === tick);
                    if (packet != undefined) {
                        let newPosition = packet.message.packetInfo[splitScreenIndex].viewOrigin[0];
                        if (newPosition != undefined) {
                            info.position = {
                                previous: oldPosition,
                                current: (oldPosition = newPosition),
                            };
                        }
                    }

                    let newCommands = commands.filter((c) => c.tick === tick).map((c) => c.message.command);
                    if (newCommands.length != 0) {
                        info.commands = {
                            previous: oldCommands,
                            current: (oldCommands = newCommands),
                        };
                    }
                }

                return map;
            };

            let checkRules = (rules) => {
                if (rules.length === 0) {
                    return undefined;
                }

                let gameInfo = getGameInfo();

                let matches = [];
                for (let [tick, info] of gameInfo) {
                    for (let rule of rules) {
                        if (rule.callback(info.position, info.commands) === true) {
                            matches.push({ rule: rule, tick: tick });
                        }
                    }
                }

                if (matches.length > 0) {
                    if (matches.length === 1) {
                        return matches[0].tick + matches[0].rule.offset;
                    }

                    let matchTick = matches.map((m) => m.tick).reduce((a, b) => Math.min(a, b));
                    matches = matches.filter((m) => m.tick === matchTick);
                    if (matches.length === 1) {
                        return matches[0].tick + matches[0].rule.offset;
                    }

                    let matchOffset =
                        matches[0].rule.type === 'start'
                            ? matches.map((m) => m.rule.offset).reduce((a, b) => Math.min(a, b))
                            : matches.map((m) => m.rule.offset).reduce((a, b) => Math.max(a, b));

                    matches = matches.filter((m) => m.rule.offset === matchOffset);
                    if (matches.length === 1) {
                        return matches[0].tick + matches[0].rule.offset;
                    }

                    throw new Error(`Multiple adjustment matches: ${JSON.stringify(matches)}`);
                }

                return undefined;
            };

            let getRules = (type) => {
                let candidates = demo.game.rules.filter((rule) => rule.type === type);

                let rules = candidates.filter((rule) => {
                    if (Array.isArray(rule.map)) {
                        return rule.map.includes(demo.header.mapName);
                    }
                    return rule.map === demo.header.mapName;
                });

                if (rules.length === 0) {
                    rules = candidates.filter((rule) => rule.map === undefined);
                }

                return rules;
            };

            let startTick = checkRules(getRules('start'));
            let endTick = checkRules(getRules('end'));

            if (startTick != undefined && endTick != undefined) {
                return demo.adjustRange(endTick, startTick);
            }
            if (startTick != undefined) {
                return demo.adjustRange(0, startTick);
            }
            if (endTick != undefined) {
                return demo.adjustRange(endTick, 0);
            }
        }

        return demo;
    }
}

module.exports = { SourceGames, SourceGame };
