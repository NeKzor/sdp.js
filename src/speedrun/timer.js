const { Vector } = require('../types/Vector');

class TimingResult {
    constructor({ playbackTicks, playbackTime }) {
        this.delta = 0;
        this.ticks = {
            before: playbackTicks,
            after: undefined,
        };
        this.time = {
            before: playbackTime,
            after: undefined,
        };
    }
    complete({ playbackTicks, playbackTime }) {
        this.ticks.after = playbackTicks;
        this.time.after = playbackTime;
        this.delta = Math.abs(this.ticks.before - this.ticks.after);
        return this;
    }
}

class SourceTimer {
    constructor(splitScreenIndex) {
        this.splitScreenIndex = splitScreenIndex;
    }
    static default() {
        return new SourceTimer(0);
    }
    time(demo) {
        if (demo.game === undefined) {
            demo.detectGame();
        }

        let result = new TimingResult(demo);

        // Find all rules that match the map name. Otherwise fall back to generic
        // rules which are used to detect coop spawn and loading screens

        let rules = demo.game.rules.filter((rule) => {
            if (Array.isArray(rule.map)) {
                return rule.map.includes(demo.mapName);
            }
            return rule.map === demo.mapName;
        });

        if (rules.length === 0) {
            rules = demo.game.rules.filter((rule) => rule.map === undefined);
        }

        if (rules.length > 0) {
            let gameInfo = this.generateGameInfo(demo);
            let matches = this.simulate(gameInfo, rules);
            let start = this.findMatch(matches, 'start');
            let end = this.findMatch(matches, 'end');
            const calcTick = (match) => match.tick + match.rule.offset;

            if (start !== undefined && end !== undefined) {
                demo.adjustRange(calcTick(end), calcTick(start));
            } else if (start !== undefined) {
                demo.adjustRange(0, calcTick(start));
            } else if (end !== undefined) {
                demo.adjustRange(calcTick(end), 0);
            }
        }

        return result.complete(demo);
    }
    generateGameInfo(demo) {
        // Generate data map which contains:
        //      - Position of current and previous tick
        //      - Commands of current tick

        let gameInfo = new Map();
        let prevPos = new Vector(0, 0, 0);

        demo.findMessages('Packet').forEach(({ tick, cmdInfo }) => {
            if (tick > 0) {
                gameInfo.set(tick, {
                    pos: {
                        previous: prevPos,
                        current: (prevPos = cmdInfo[this.splitScreenIndex].viewOrigin),
                    },
                });
            }
        });

        demo.findMessages('ConsoleCmd').forEach(({ tick, command }) => {
            // Ignore button inputs since they aren't really useful
            if (tick <= 0 || command.startsWith('+') || command.startsWith('-')) {
                return;
            }

            let value = gameInfo.get(tick);
            if (!value) {
                gameInfo.set(tick, {
                    cmds: [command],
                });
            } else {
                if (value.cmds) {
                    value.cmds = value.cmds.concat(command);
                } else {
                    value.cmds = [command];
                }
                gameInfo.set(tick, value);
            }
        });

        return gameInfo;
    }
    simulate(gameInfo, rules) {
        // Game simulation: Pass generated data for every tick to every rule's match function
        // Rules only return true if they detect an event

        let matches = [];
        for (let [tick, info] of gameInfo) {
            for (let rule of rules) {
                if (rule.match(info) === true) {
                    matches.push({ rule: rule, tick: tick });
                }
            }
        }

        return matches;
    }
    findMatch(allMatches, type) {
        let matches = allMatches.filter((m) => m.rule.type === type);
        console.log(matches);
        if (matches.length > 0) {
            if (matches.length === 1) {
                return matches[0];
            }

            // Match rules until we have a single match:
            //      1.) Favour rules that match the
            //              a.) latest tick if it is a start event
            //              b.) earliest tick if it is an end event
            //      2.) Favour rules that match the
            //              a.) lowest offset if it is a start event
            //              b.) or highest offset if it is an end event
            //      3.) Throw exception and fail because there might be timing issue

            let matchTick =
                type === 'start'
                    ? matches.map((m) => m.tick).reduce((a, b) => Math.max(a, b))
                    : matches.map((m) => m.tick).reduce((a, b) => Math.min(a, b));

            matches = matches.filter((m) => m.tick === matchTick);
            if (matches.length === 1) {
                return matches[0];
            }

            let matchOffset =
                type === 'start'
                    ? matches.map((m) => m.rule.offset).reduce((a, b) => Math.min(a, b))
                    : matches.map((m) => m.rule.offset).reduce((a, b) => Math.max(a, b));

            matches = matches.filter((m) => m.rule.offset === matchOffset);
            if (matches.length === 1) {
                return matches[0];
            }

            throw new Error(`Multiple adjustment matches: ${JSON.stringify(matches)}`);
        }

        return undefined;
    }
}

module.exports = { SourceTimer, TimingResult };
