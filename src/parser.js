const { SourceDemoBuffer } = require('./buffer');
const { SourceDemo } = require('./demo');

const DefaultParsingOptions = {
    header: true,
    messages: true,
    stringTables: false,
    dataTables: false,
    packets: false,
    userCmds: false,
};

class SourceDemoParser {
    constructor(options = DefaultParsingOptions) {
        this.options = options;
    }
    static default() {
        return new this(DefaultParsingOptions);
    }
    setOptions(options) {
        this.options = {
            ...this.options,
            ...options,
        };
        return this;
    }
    parse(buffer) {
        const buf = new SourceDemoBuffer(Buffer.concat([buffer], buffer.length + 4 - (buffer.length % 4)));
        const demo = SourceDemo.default();

        if (this.options.header) demo.readHeader(buf);
        if (this.options.messages) demo.readMessages(buf);

        if (demo.messages.length > 0) {
            if (this.options.stringTables) demo.readStringTables();
            if (this.options.dataTables) demo.readDataTables();
            if (this.options.packets) demo.readPackets();
            if (this.options.userCmds) demo.readUserCmds();
        }

        return demo;
    }
}

module.exports = { SourceDemoParser };
