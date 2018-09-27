var Portal = {
    directory: 'portal',
    tickrate: 1 / 0.015,
    rules: [
        {
            map: 'testchmb_a_00',
            offset: 1,
            type: 'start',
            callback: (pos, _) => {
                if (pos != undefined) {
                    let startPos = { x: -544, y: -368.75, z: 160 };
                    return pos.current.x == startPos.x
                        && pos.current.y == startPos.y
                        && pos.current.z == startPos.z;
                }
                return false;
            }
        },
        {
            map: 'escape_02',
            offset: 1,
            type: 'end',
            callback: (_, cmds) => {
                if (cmds != undefined) {
                    return cmds.current.includes('startneurotoxins 99999');
                }
                return false;
            }
        }
    ]
};

module.exports = Portal;
