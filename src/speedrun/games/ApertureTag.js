const ApertureTag = {
    directory: 'aperturetag',
    tickrate: 60,
    rules: [
        {
            map: 'gg_intro_wakeup',
            offset: 0,
            type: 'start',
            match: ({ pos }) => {
                if (pos != undefined) {
                    let startPos = { x: -723.0, y: -2481.0, z: 17.0 };
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
            map: 'gg_stage_theend',
            offset: 0,
            type: 'end',
            match: ({ cmds }) => {
                if (cmds != undefined) {
                    let outro = 'playvideo_exitcommand_nointerrupt at_credits end_movie credits_video';
                    return cmds.includes(outro);
                }
                return false;
            },
        },
        {
            map: undefined,
            offset: 0,
            type: 'start',
            match: ({ cmds }) => {
                if (cmds != undefined) {
                    return cmds.includes('dsp_player 0') && cmds.includes('ss_force_primary_fullscreen 0');
                }
                return false;
            },
        },
        {
            map: undefined,
            offset: 0,
            type: 'end',
            match: ({ cmds }) => {
                if (cmds != undefined) {
                    return cmds.find((cmd) => cmd.startsWith('playvideo_end_level_transition')) != undefined;
                }
                return false;
            },
        },
    ],
};

module.exports = ApertureTag;
