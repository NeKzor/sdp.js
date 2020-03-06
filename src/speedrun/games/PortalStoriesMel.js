const PortalStoriesMel = {
    directory: 'portal_stories',
    tickrate: 60,
    rules: [
        {
            map: ['sp_a1_tramride', 'st_a1_tramride'],
            offset: 0,
            type: 'start',
            match: ({ pos }) => {
                if (pos != undefined) {
                    let startPos = { x: -4592.0, y: -4475.4052734375, z: 108.683975219727 };
                    return (
                        pos.previous.x === startPos.x &&
                        pos.previous.y === startPos.y &&
                        pos.previous.z === startPos.z &&
                        pos.current.x != startPos.x &&
                        pos.current.y != startPos.y &&
                        pos.current.z != startPos.z
                    );
                }
                return false;
            },
        },
        {
            map: ['sp_a4_finale', 'st_a4_finale'],
            offset: 0,
            type: 'end',
            match: ({ cmds }) => {
                if (cmds != undefined) {
                    let outro = 'playvideo_exitcommand_nointerrupt aegis_interior.bik end_movie movie_aegis_interior';
                    return cmds.includes(outro);
                }
                return false;
            },
        },
    ],
};

module.exports = PortalStoriesMel;
