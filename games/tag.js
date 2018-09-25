var ApertureTag = {
    directory: 'aperturetag',
    tickrate: 60,
    rules: [
        {
            map: 'gg_intro_wakeup',
            offset: 0,
            type: 'start',
            callback: (pos, _) => {
                if (pos != undefined) {
                    let startPos = { x: -723.00, y: -2481.00, z: 17.00 };
                    return pos.previous.x == startPos.x
                        && pos.previous.y == startPos.y
                        && pos.previous.z == startPos.z
                        && pos.current.x != startPos.x
                        && pos.current.y != startPos.y
                        && pos.current.z != startPos.z;
                }
                return false;
            }
        },
        {
            map: 'gg_stage_theend',
            offset: 0,
            type: 'end',
            callback: (_, cmd) => {
                if (cmds != undefined) {
                    let outro = 'playvideo_exitcommand_nointerrupt at_credits end_movie credits_video';
                    return cmds.current.includes(outro);
                }
                return false;
            }
        },
        {
            map: undefined,
            offset: 0,
            type: 'start',
            callback: (_, cmds) => {
                if (cmds != undefined) {
                    return cmds.previous.find(cmd => cmd.startsWith('dsp_player')) != undefined
                        && cmds.current.includes('ss_force_primary_fullscreen 0');
                }
                return false;
            }
        },
        {
            map: undefined,
            offset: 0,
            type: 'end',
            callback: (_, cmds) => {
                if (cmds != undefined) {
                    let outroBlue = 'playvideo_end_level_transition coop_bluebot_load 2';
                    let outroOrange = 'playvideo_end_level_transition coop_orangebot_load 2';
                    return cmds.current.find(cmd => cmd.startsWith(outroBlue) || cmd.startsWith(outroOrange))
                        != undefined;
                }
                return false;
            }
        }
    ]
};

module.exports = ApertureTag;
