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
    with(option) {
        this.options[option] = true;
        return this;
    }
    without(option) {
        this.options[option] = false;
        return this;
    }
    parse(buffer, options = undefined) {
        options = {
            ...this.options,
            ...options,
        };

        let buf = new SourceDemoBuffer(Buffer.concat([buffer], buffer.length + 4 - (buffer.length % 4)));
        let demo = SourceDemo.default();

        if (options.header) demo.readHeader(buf);
        if (options.messages) demo.readMessages(buf);

        if (demo.messages.length > 0) {
            if (options.stringTables) demo.readStringTables();
            if (options.dataTables) demo.readDataTables();
            if (options.packets) demo.readPackets();
            if (options.userCmds) demo.readUserCmds();
        }

        return demo;
    }
}

module.exports = { SourceDemoParser };
