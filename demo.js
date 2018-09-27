class SourceDemo {
    constructor() {
        this.header = undefined;
        this.messages = undefined;
        this.game = undefined;
    }
    detectGame(sourceGame) {
        this.game = sourceGame.gameList.find(game => game.directory == this.header.gameDirectory);
        if (this.game != undefined) {
            this.game.source = sourceGame;
        }
        return this.game;
    }
    intervalPerTick() {
        if (this.header.playbackTicks == 0) {
            if (this.game != undefined) {
                return 1 / this.game.tickrate;
            }
            throw new Error('Cannot find ipt of null tick demo.');
        }
        return this.header.playbackTime / this.header.playbackTicks;
    }
    tickrate() {
        if (this.header.playbackTime == 0) {
            if (this.game != undefined) {
                return this.game.tickrate;
            }
            throw new Error('Cannot find tickrate of null tick demo.');
        }
        return this.header.playbackTicks / this.header.playbackTime;
    }
    adjustTicks() {
        if (this.messages.length == 0) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }

        let synced = false;
        let last = 0;
        for (let message of this.messages) {
            if (message.type == 0x03) {
                synced = true;
            }

            if (!synced) {
                message.tick = 0;
            } else if (message.tick < 0) {
                message.tick = last;
            }
            last = message.tick;
        }

        return this;
    }
    adjustRange(endTick = 0, startTick = 0) {
        if (this.messages.length == 0) {
            throw new Error('Cannot adjust range without parsed messages.');
        }

        if (endTick < 1) {
            endTick = this.messages[this.messages.length - 1].tick;
        }

        let delta = endTick - startTick;
        if (delta < 0) {
            throw new Error('Start tick is greater than end tick.');
        }

        let ipt = this.intervalPerTick();
        this.header.playbackTicks = delta;
        this.header.playbackTime = ipt * delta;

        return this;
    }
    adjust() {
        this.adjustTicks();
        this.adjustRange();
        return (this.game != undefined)
            ? this.game.source.adjustByRules(this)
            : this;
    }
}

module.exports = { SourceDemo };
