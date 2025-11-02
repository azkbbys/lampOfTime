console.clear()

// 导入
import i18n from "@root/i18n";

// 变量等
var admin:string[] = []
var adminpro:string[] = ['阿兹卡班毕业生','奶油a','Lure惑','afan']
var logs:string[] = []
var lzxglist:string[] = []
var lastmsg:string = ''

//函数
async function dialog(title:string,content:string,entity:GamePlayerEntity){
    const result = await entity.player.dialog({
        type: GameDialogType.TEXT,
        title: title,
        content: content,
    });
}
async function dialog_with_button(entity:GamePlayerEntity,title:string,content:string,options:string[]){
    let ret = await entity.player.dialog({
        type: GameDialogType.SELECT,
        title: title,
        content: content,
        options: options,
    })
    return ret
}
function find(name:string){
    world.querySelectorAll('player').forEach((e)=>{
        if(e.player.name==name){
            return e
        }
    })
}

// 数据库
var Storage = storage.getGroupStorage('cundang'); // 获取数据库，名称为 cundang

const CorrespondingName = { // 在此添加排行榜对应的单位和名称（无名称 则表示不显示名称）
    'exp': [i18n.t('leaderboard.pump_unit'), '无名称'],
    'fastest_time': ['', '无名称'],
};

const unsavedData = { // 玩家初始无需保存的数据，可增添或删除
    victory: false,
    cankick: true,
};

const savedData = { // 玩家初始需要保存的数据，可增添或删除
    exp: 50,
    bag: [],
    greenlzxg: false,
    player_title: '玩家',
    adminlevel: 0,
    canplay: true,
    used_duihuanma: [],
    skins: ['原版皮肤'],
    usingskin: '原版',
    last_team: 0,
    jointime: {
        year: 2025,
        month: 7,
        day: 19,
        hour: 0,
        minute: -10086
    },
};

/**
 * 初始化玩家数据
 * 
 * @param {GameEntity} entity
 */
function initPlayer(entity:GamePlayerEntity) { // 初始化玩家数据
    Object.assign(entity, savedData);
    Object.assign(entity, unsavedData);
};

/**
 * 获取玩家数据
 * 
 * @param {GameEntity} entity
 */
/**
 * 获取玩家数据
 * 
 * @param {GamePlayerEntity} entity - 玩家实体
 * @returns {Object} 包含玩家数据的对象
 */
function getPlayerData(entity: GamePlayerEntity): Record<string, any> {
    const data: Record<string, any> = { 'name': entity.player.name };
    
    for (const key in savedData) {
        if (Object.prototype.hasOwnProperty.call(savedData, key)) {
            if (Object.prototype.hasOwnProperty.call(entity, key)) {
                data[key] = (entity as any)[key];
            }
        }
    }
    
    return data;
}

/**
 * 存档
 * 
 * @param {GameEntity} entity
 */
async function savePlayer(entity:GamePlayerEntity) { // 存档
    await Storage.update(entity.player.userId, () => {  // 更新玩家数据存档
        return getPlayerData(entity);
    });
};

/**
 * 删档
 * 
 * @param {GameEntity} entity
 */
async function deletePlayer(entity:GamePlayerEntity) { // 删档
    entity.save = false
    await Storage.remove(entity.player.userId); // 删除玩家数据存档
};
async function deletePlayerByUserid(userid:string) { // 通过userid删档
    await Storage.remove(userid); // 删除玩家数据存档
};

/**
 * 读档
 * 
 * @param {GameEntity} entity
 */
async function loadPlayer(entity:GamePlayerEntity) { // 读档
    initPlayer(entity);
    var data = await Storage.get(entity.player.userId); // 获取数据
    if (data) { // 如果数据存在
        Object.assign(entity, data.value);
        entity.player.directMessage(i18n.t('directmsgs.data_loaded', { lng: entity.lang }));
    } else { // 如果数据不存在
        await Storage.set(entity.player.userId, getPlayerData(entity));
        entity.player.directMessage(i18n.t('directmsgs.data_created', { lng: entity.lang }));
        const date = new Date(Date.now());
        const year = date.getFullYear()
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        entity.jointime={
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute
        }
        
        while(1){
            let res = await dialog_with_button(entity,i18n.t('dialogs.welcome',{lng:entity.lang}),i18n.t('dialogs.welcome_new_player', { lng: entity.lang }),['1','2','3'])
            if(res&&res.value=='2')break;
        }
    };
    /*if(entity.lang==undefined){
        let lang = await entity.player.dialog({
            type: GameDialogType.SELECT,
            title: i18n.t('language.select_title', { lng: 'zh-CN' }),
            content: i18n.t('language.select_content', { lng: 'zh-CN' }),
            options: [i18n.t('language.chinese', { lng: 'zh-CN' }), i18n.t('language.english', { lng: 'zh-CN' })]
        });
        if(!lang || lang.value === null){ 
            entity.lang = 'zh-CN'
            entity.player.directMessage(i18n.t('language.default_selected', { lng: 'zh-CN' }))
        }
        else if(lang.value==i18n.t('language.chinese', { lng: 'zh-CN' })){
            entity.lang = 'zh-CN'
            entity.player.directMessage(i18n.t('language.chinese_selected', { lng: 'zh-CN' }))
        }
        else if(lang.value==i18n.t('language.english', { lng: 'zh-CN' })){
            entity.lang = 'en'
            entity.player.directMessage(i18n.t('language.english_selected', { lng: 'en' }))
        }
    }*/
};

/**
 * 清档
 */
async function deleteAllData() { // 清档
    var sqlDataList = await Storage.list({ // 将数据库内的所有数据分页
        cursor: 0
    });
    world.querySelectorAll('player').forEach(x => x.save = false);
    try {
        while (true) {
            for (let sqlData of sqlDataList.getCurrentPage()) { // 遍历获取数据
                await Storage.remove(sqlData?.key as string)
            }
            if (sqlDataList.isLastPage) break; // 如果已经是最后一页，退出循环
            await sqlDataList.nextPage(); // 下一页
        };
    } catch (e) {}
};
interface PlayerData {
    name: string;
    [key: string]: any; // 允许其他动态属性
}
/**
 * 显示排行榜
 * 
 * @param {string} type
 */

async function leaderBoard(type:string) { // 排行榜
    var list: any[] = [];
    var sqlDataList = await Storage.list({ // 将数据库内的所有数据分页
        cursor: 0
    });
    while (true) {
        for (let sqlData of sqlDataList.getCurrentPage()) { // 遍历获取数据
            const playerData = sqlData?.value as PlayerData;
            if (!list.some(item => item[0] === playerData.name && item[1] === playerData[type])) {
                list.push([playerData.name, playerData[type]]);
            }
        }
        list = list.sort((a, b) => b[1] - a[1]).slice(0, 100);
        if (sqlDataList.isLastPage) break; // 如果已经是最后一页，退出循环
        await sqlDataList.nextPage(); // 下一页
    };
    const key = type as keyof typeof CorrespondingName;
    return list.filter(value => value[1] !== undefined).map((value, num) => // 将列表里的所有项依次替换成字符串
        i18n.t('leaderboard.rank_format', { 
            lng: 'zh-CN',
            rank: num + 1, 
            name: value[0], 
            value: value[1], 
            unit: CorrespondingName[key][0],
            name_display: CorrespondingName[key][1] !== '无名称' ? CorrespondingName[key][1] : ''
        })
).join('\n');
};

// 部分客户端与服务端交互
remoteChannel.onServerEvent(({entity, args, tick})=>{
    if(args.type=='zxcommand'){
        try {
            world.say('<~ ' + eval(args.cmd))
        }
        catch (err) {
            world.say('<~ ' + err)
        }
    }
    else if(args.type=='lang'){
        console.log('收到客户端语言：' + args.lang)
        entity.lang=args.lang
    }
})

world.onPlayerJoin(async ({entity}) => { 
    await loadPlayer(entity);
    entity.player.enableDoubleJump = false;
    entity.opened_pump=[];
    entity.timeleft=0
    dialog_with_button(entity,i18n.t('dialogs.welcome', { lng: entity.lang }),i18n.t('dialogs.joinwelcome', { lng: entity.lang, name: entity.player.name }),[i18n.t('dialogs.close', { lng: entity.lang })]);
    if(entity.canplay==false){
        entity.player.cancelDialogs()
        dialog(i18n.t('dialogs.ban', {lng:entity.lang}),i18n.t('dialogs.baninfo', {lng:entity.lang}),entity)
        await sleep(10000)
        entity.player.kick()
        return
    }
    if(entity.player_title=='玩家'&&entity.adminlevel==1){
        entity.player_title='管理员'
    }else if(entity.player_title=='玩家'&&entity.adminlevel==2){
        entity.player_title='高级管理员'
    }
    if(entity.player_title=='管理员'&&entity.adminlevel!=1&&!admin.includes(entity.player.name)){
        entity.player_title='玩家'
    }
    else if(entity.player_title=='高级管理员'&&entity.adminlevel<=2&&!adminpro.includes(entity.player.name)){
        entity.player_title='玩家'
    }
    if(entity.adminlevel>=2||adminpro.includes(entity.player.name)){
        remoteChannel.sendClientEvent(entity, {type:'command',args:'opencmd'})
    }
    world.say(i18n.t('chat.welcome_join', { 
        lng: entity.lang,
        title: entity.player_title=='玩家'?' ':i18n.t('chat.title_prefix', {lng: entity.lang, title: entity.player_title}),
        name: entity.player.name,
        online_count: world.querySelectorAll('player').length
    }))
    remoteChannel.sendClientEvent(entity, { type: 'basicinfo', args: [entity.player.name, entity.player_title, entity.player.avatar] });
});

// 添加检测玩家进入或离开区域
const gameArea = world.addZone({
    selector: "player",
    bounds: new GameBounds3(
        new GameVector3(0, 0, 12.5),
        new GameVector3(126, 30, 126)
    ),
});

// 有玩家进入区域
gameArea.onEnter(({ entity }) => {
    let e = entity as GamePlayerEntity
    e.playing = true;
    e.opened_pump = [];
    e.player.directMessage(i18n.t('directmsgs.enter_game_area', { lng: entity.lang }) );
    e.timeleft = 60;
    e.exp-=10
    if(e.exp<0){e.exp=0}
});

// 有玩家离开区域
gameArea.onLeave(({ entity }) => {
    entity.playing = false;
});

// 添加检测玩家进入或离开区域
const startGameArea = world.addZone({
    selector: "player",
    bounds: new GameBounds3(
        new GameVector3(101, 3, 9.8),
        new GameVector3(125, 10, 10)
    ),
});

// 有玩家进入区域
startGameArea.onEnter(({ entity }) => {
    let e = entity as GamePlayerEntity
    e.position.set(111, 10, 18)
});

// 添加检测玩家进入或离开区域
const endGameArea = world.addZone({
    selector: "player",
    bounds: new GameBounds3(
        new GameVector3(99, 8, 12),
        new GameVector3(123, 17, 13)
    ),
});

// 有玩家进入区域
endGameArea.onEnter(({ entity }) => {
    let e = entity as GamePlayerEntity
    if(e.timeleft<2)return;
    if(e.opened_pump.length<5){
        entity.player?.directMessage(i18n.t('directmsgs.exitfail', { lng: entity.lang }))
        e.position.set(111, 10, 18)
        return
    }
    entity.player?.directMessage(i18n.t('directmsgs.exitsuccess', { lng: entity.lang, pump_num: e.opened_pump.length }))
    e.position.set(119, 5, 5)
    e.exp+=e.opened_pump.length
    savePlayer(e)
});

world.onTick(({ tick }) => {
    if(tick%16==0){
        world.querySelectorAll('player').forEach(entity => { 
            remoteChannel.sendClientEvent(entity, { type: 'tick', args: [entity.playing?entity.opened_pump.length:'未开始',entity.playing?entity.timeleft:'未开始',lastmsg,entity.adminlevel,entity.exp] });
            // entity.player.canFly=true
            if(entity.playing){
                if(entity.timeleft>1){
                    entity.timeleft--;
                    // entity.player?.directMessage(i18n.t('directmsgs.time_left', { lng: entity.lang, time: entity.timeleft }));
                }
                else{
                    entity.position.set(119, 5, 5)
                    entity.player?.directMessage(i18n.t('directmsgs.time_up', { lng: entity.lang }));
                }
            }
        });
    }
});

// 右键菜单
world.onPress(async({button,entity})=>{
    if(button==='action1'){
        const result = await entity.player.dialog({
            type: GameDialogType.SELECT,
            title: i18n.t('dialogs.menu.menu', {lng: entity.lang}),
            content: i18n.t('dialogs.menu.basicinfo', {lng: entity.lang, exp:entity.exp, time:entity.timeleft, hp: entity.hp, maxhp: entity.maxHp, position: entity.position}),
            options:[/*i18n.t('menu_options.language', {lng: entity.lang}),*/
                i18n.t('dialogs.menu.tutorial', {lng: entity.lang}),
                i18n.t('dialogs.menu.redemption_code', {lng: entity.lang}),
                i18n.t('dialogs.menu.data', {lng: entity.lang}),
                i18n.t('dialogs.menu.leaderboard.pump', {lng: entity.lang}),
                i18n.t('dialogs.menu.gameui', {lng: entity.lang}),
                i18n.t('dialogs.menu.skin', {lng: entity.lang}),
                i18n.t('menu_options.shop', {lng: entity.lang}),
                i18n.t('menu_options.backpack', {lng: entity.lang}),
                i18n.t('menu_options.switch_view', {lng: entity.lang}),
                i18n.t('menu_options.bug_report', {lng: entity.lang}),
                i18n.t('menu_options.mute_chat', {lng: entity.lang}),
                i18n.t('menu_options.donate', {lng: entity.lang}),
                i18n.t('menu_options.admin_tools', {lng: entity.lang})]
        });
        if(!result || result.value === null){ 
            return; 
        }
        else if(result.value==i18n.t('menu_options.language', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('language.select_title', {lng: entity.lang}),
                content: i18n.t('language.select_content', {lng: entity.lang}),
                options: [i18n.t('language.chinese', {lng: entity.lang}), i18n.t('language.english', {lng: entity.lang})]
            });
            if(!result || result.value === null){ 
                return; 
            }
            else if(result.value==i18n.t('language.chinese', {lng: entity.lang})){
                entity.lang = 'zh-CN'
                entity.player.directMessage(i18n.t('language.chinese_selected', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('language.english', {lng: entity.lang})){
                entity.lang = 'en'
                entity.player.directMessage(i18n.t('language.english_selected', {lng: entity.lang}))
            }
        }
        else if(result.value==i18n.t('menu_options.donate', {lng: entity.lang})){
            entity.player.link(`https://afdian.com/a/azkbbys`, {isConfirm: false, isNewTab: true})
        }
        else if(result.value==i18n.t('dialogs.menu.tutorial', {lng: entity.lang})){
            dialog_with_button(entity,i18n.t('dialogs.menu.tutorial', {lng: entity.lang}),i18n.t('dialogs.tutorial', { lng: entity.lang, name: entity.player.name }),[i18n.t('dialogs.close', { lng: entity.lang })]);
        }
        // else if(result.value=='��音乐��'){
        //     const result = await entity.player.dialog({
        //         type: GameDialogType.SELECT,
        //         title: '��音乐选择��',
        //         content:`这里是有关sql的功能，请选择：`,
        //         options:['❌关闭所有声音','花之舞','夜、萤火虫和你']
        //     });
        //     if(!result || result.value === null){ 
        //         return;
        //     }
        //     else if(result.value=='❌关闭所有声音'){
        //         entity.player.sound
        //     }
        //     else if(result.value=='花之舞'){
        //         entity.player.sound('audio/夜、萤火虫和你.mp3')
        //     }
        //     else if(result.value=='夜、萤火虫和你'){
        //         entity.player.sound('audio/夜、萤火虫和你.mp3')
        //     }
        // }
        else if(result.value==i18n.t('dialogs.menu.gameui', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: 'gameUi',
                content:i18n.t('dialogs.gameui.content', {lng: entity.lang}),
                options:[i18n.t('dialogs.gameui.cancel', {lng: entity.lang}), i18n.t('dialogs.gameui.close', {lng: entity.lang}), i18n.t('dialogs.gameui.open', {lng: entity.lang}), i18n.t('dialogs.gameui.refresh', {lng: entity.lang})]
            });
            if(!result || result.value === null){ 
                return; 
            }
            else if(result.value==i18n.t('dialogs.gameui.close', {lng: entity.lang})){
                remoteChannel.sendClientEvent(entity, {type:'command',args:'close'})
                entity.player.directMessage(i18n.t('directmsgs.closed', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('dialogs.gameui.open', {lng: entity.lang})){
                remoteChannel.sendClientEvent(entity, {
                    type:'command',
                    args:'open'
                })
                remoteChannel.sendClientEvent(entity, {
                    type:'玩家信息1',
                    args:{
                        avatar:entity.player.avatar,
                        name:entity.player.name,
                        player_title:entity.player_title
                    }
                })
                entity.player.directMessage(i18n.t('directmsgs.opened', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('dialogs.gameui.refresh', {lng: entity.lang})){
                remoteChannel.sendClientEvent(entity, {
                    type: '刷新大小',
                    args: null
                })
                entity.player.directMessage(i18n.t('directmsgs.refresh_not_supported', {lng: entity.lang}))
            }
        }
        /*
        else if(result.value==i18n.t('dialogs.menu.redemption_code', {lng: entity.lang})){
            entity.duihuanma = await entity.player.dialog({
                type: GameDialogType.INPUT,
                title: i18n.t('dialogs.redemption.title', {lng: entity.lang}),
                content: i18n.t('dialogs.redemption.content', {lng: entity.lang}),
                confirmText: i18n.t('dialogs.confirm', {lng: entity.lang}),
            })as string;
            if(!entity.duihuanma || entity.duihuanma === null){ 
                entity.player.link(`http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=Atg_SCPUyp2d8yAAxjaozzjFH3eu198J&authKey=ohyqS%2FYbJ%2F3C%2BkzrFVQSS7wJoeifKFxeo8SNr4KsX7fey6sx%2Fy%2FX7JEF%2Bvtkryd1&noverify=0&group_code=763919859`, {isConfirm: false, isNewTab: true})
            }
            else{
                use_duihuanma(entity)
            }
        }
        */
        else if(result.value==i18n.t('dialogs.menu.data', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('dialogs.storage.title', {lng: entity.lang}),
                content:i18n.t('dialogs.storage.content', {lng: entity.lang}),
                options:[i18n.t('dialogs.storage.save', {lng: entity.lang}), i18n.t('dialogs.storage.delete', {lng: entity.lang})]
            });
            if(!result || result.value === null){ 
                return; 
            }
            else if(result.value==i18n.t('dialogs.storage.save', {lng: entity.lang})){
                savePlayer(entity);
                dialog(i18n.t('dialogs.system', {lng: entity.lang}),i18n.t('dialogs.storage.save_success', {lng: entity.lang}),entity)
            }
            else if(result.value==i18n.t('dialogs.storage.delete', {lng: entity.lang})){
                const result = await entity.player.dialog({
                    type: GameDialogType.SELECT,
                    title: i18n.t('dialogs.storage.delete_confirm_title', {lng: entity.lang}),
                    content:i18n.t('dialogs.storage.delete_confirm_content', {lng: entity.lang}),
                    options:[i18n.t('dialogs.storage.delete_cancel1', {lng: entity.lang}), i18n.t('dialogs.storage.delete_cancel2', {lng: entity.lang}), i18n.t('dialogs.storage.delete_cancel3', {lng: entity.lang}), i18n.t('dialogs.storage.delete_cancel4', {lng: entity.lang}), i18n.t('dialogs.storage.delete_confirm', {lng: entity.lang})]
                });
                if(result?.value==i18n.t('dialogs.storage.delete_confirm', {lng: entity.lang})){
                    Object.assign(entity, savedData);
                    savePlayer(entity);
                    entity.player.kick();
                }
            }
        }
        else if(result.value==i18n.t('dialogs.menu.leaderboard.pump', {lng: entity.lang})){
            await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('leaderboard.title', {lng: entity.lang}),
                content: await leaderBoard('exp'),
                options: [i18n.t('dialogs.confirm', {lng: entity.lang})]
            });
        }
        else if(result.value==i18n.t('dialogs.menu.skin', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('dialogs.skin.title', {lng: entity.lang}),
                content:i18n.t('dialogs.skin.content', {lng: entity.lang}),
                options:entity.skins
            });
            if(!result || result.value === null){ 
                entity.player.resetToDefaultSkin()
                entity.usingskin = '原版'
            }
            else if(result.value!='原版皮肤'){
                entity.usingskin = result.value;
                entity.player.setSkinByName(result.value)
            }
            else{
                entity.player.resetToDefaultSkin()
                entity.usingskin = '原版'
            }
            savePlayer(entity)
            entity.player.directMessage(i18n.t('directmsgs.switch_success', {lng: entity.lang}))
        }
        else if(result.value==i18n.t('menu_options.shop', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('dialogs.shop.title', {lng: entity.lang}),
                content:i18n.t('dialogs.shop.content', {lng: entity.lang, exp: entity.exp}),
                options:[i18n.t('dialogs.exit', {lng: entity.lang}),
                i18n.t('dialogs.shop.green_particle', {lng: entity.lang}),
                i18n.t('dialogs.shop.creeper_skin', {lng: entity.lang}),
                i18n.t('dialogs.shop.steve_skin', {lng: entity.lang}),
                i18n.t('dialogs.shop.fly_privilege', {lng: entity.lang}),
                i18n.t('dialogs.shop.fly_speed', {lng: entity.lang}),
                i18n.t('dialogs.shop.shrink_potion', {lng: entity.lang}),
                i18n.t('dialogs.shop.restore_potion', {lng: entity.lang}),
                i18n.t('dialogs.shop.enlarge_potion', {lng: entity.lang})]
            });
            if(!result || result.value === null){ 
                return; 
            }
            else if(result.value==i18n.t('dialogs.shop.green_particle', {lng: entity.lang})){
                if(entity.exp>=150){
                    entity.exp-=150;
                    entity.greenlzxg=true;
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_particle', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.creeper_skin', {lng: entity.lang})){
                if(entity.exp>=500&&entity.skins.includes('苦力怕')==false){
                    entity.exp-=500;
                    entity.skins.push('苦力怕')
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_skin', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp_or_owned', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.steve_skin', {lng: entity.lang})){
                if(entity.exp>=500&&entity.skins.includes('史蒂夫')==false){
                    entity.exp-=500;
                    entity.skins.push('史蒂夫')
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_skin', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp_or_owned', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.fly_privilege', {lng: entity.lang})){
                if(entity.exp>=70){
                    entity.exp-=70;
                    entity.bag.push(i18n.t('items.fly_privilege', {lng: entity.lang}))
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_backpack', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.fly_speed', {lng: entity.lang})){
                if(entity.exp>=5){
                    entity.exp-=5;
                    entity.bag.push(i18n.t('items.fly_speed', {lng: entity.lang}))
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_backpack', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.shrink_potion', {lng: entity.lang})){
                if(entity.exp>=70){
                    entity.exp-=70;
                    entity.bag.push(i18n.t('items.shrink_potion', {lng: entity.lang}))
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_backpack', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.restore_potion', {lng: entity.lang})){
                if(entity.exp>=1){
                    entity.exp-=1;
                    entity.bag.push(i18n.t('items.restore_potion', {lng: entity.lang}))
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_backpack', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
            else if(result.value==i18n.t('dialogs.shop.enlarge_potion', {lng: entity.lang})){
                if(entity.exp>=70){
                    entity.exp-=70;
                    entity.bag.push(i18n.t('items.enlarge_potion', {lng: entity.lang}))
                    savePlayer(entity);
                    entity.player.directMessage(i18n.t('directmsgs.purchase_success_backpack', {lng: entity.lang}))
                }
                else{
                    dialog(i18n.t('dialogs.error', {lng: entity.lang}),i18n.t('dialogs.shop.not_enough_exp', {lng: entity.lang}),entity)
                }
            }
        }
        else if(result.value==i18n.t('menu_options.backpack', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.SELECT,
                title: i18n.t('dialogs.backpack.title', {lng: entity.lang}),
                content:i18n.t('dialogs.backpack.content', {lng: entity.lang}),
                options:entity.bag
            });
            if(!result || result.value === null){ 
                return; 
            }
            else if(result.value==i18n.t('items.fly_privilege', {lng: entity.lang})){
                entity.player.canFly=true;
                let index = entity.bag.indexOf(i18n.t('items.fly_privilege', {lng: entity.lang}));
                if (index !== -1) {
                    entity.bag.splice(index, 1);
                }
                savePlayer(entity)
                entity.player.canFly=true;
                entity.player.directMessage(i18n.t('directmsgs.fly_privilege_used', {lng: entity.lang}));
                await sleep(2000);
                entity.player.canFly=false;
            }
            else if(result.value==i18n.t('items.fly_speed', {lng: entity.lang})){
                let index = entity.bag.indexOf(i18n.t('items.fly_speed', {lng: entity.lang}));
                if (index !== -1) {
                    entity.bag.splice(index, 1);
                }
                const flyspeed:string = await entity.player.dialog({
                    type: GameDialogType.INPUT,
                    title: i18n.t('dialogs.fly_speed.title', {lng: entity.lang}),
                    content: i18n.t('dialogs.fly_speed.content', {lng: entity.lang}),
                    confirmText: i18n.t('dialogs.confirm', {lng: entity.lang}),
                })as string;
                entity.player.flySpeed=parseInt(flyspeed)
                savePlayer(entity)
                entity.player.directMessage(i18n.t('directmsgs.fly_speed_used', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('items.shrink_potion', {lng: entity.lang})){
                let index = entity.bag.indexOf(i18n.t('items.shrink_potion', {lng: entity.lang}));
                if (index !== -1) {
                    entity.bag.splice(index, 1);
                }
                entity.player.scale=0.5
                savePlayer(entity)
                entity.player.directMessage(i18n.t('directmsgs.potion_used', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('items.restore_potion', {lng: entity.lang})){
                let index = entity.bag.indexOf(i18n.t('items.restore_potion', {lng: entity.lang}));
                if (index !== -1) {
                    entity.bag.splice(index, 1);
                }
                entity.player.scale=1
                savePlayer(entity)
                entity.player.directMessage(i18n.t('directmsgs.potion_used', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('items.enlarge_potion', {lng: entity.lang})){
                let index = entity.bag.indexOf(i18n.t('items.enlarge_potion', {lng: entity.lang}));
                if (index !== -1) {
                    entity.bag.splice(index, 1);
                }
                entity.player.scale=1.5
                savePlayer(entity)
                entity.player.directMessage(i18n.t('directmsgs.potion_used', {lng: entity.lang}))
            }
            else if(result.value==i18n.t('items.infinite_fly', {lng: entity.lang})){
                entity.player.canFly=true;
                entity.player.directMessage(i18n.t('directmsgs.infinite_fly_used', {lng: entity.lang}))
            }
        }
        // else if(result.value=='进入/离开挂机房'){
        //     if(entity.canplay==false){
        //         dialog(i18n.t('dialogs.system', {lng: entity.lang}),i18n.t('dialogs.restart_banned', {lng: entity.lang}),entity)
        //     }
        //     else{
        //         if(entity.ingjf==true){
        //             entity.player.forceRespawn();
        //             entity.ingjf=false;
        //         }
        //         else{
        //             entity.position.set(97,6,74);
        //             entity.ingjf=true;
        //         }
        //     }
        // }
        // else if(result.value=='进入/退出俯视全图'){
        //     if(entity.fsqting==false){
        //         const fsqt = world.querySelector('#俯视全图')
        //         entity.player.cameraEntity=fsqt
        //         entity.player.directMessage(i18n.t('directmsgs.fly_enabled', {lng: entity.lang}))
        //         entity.fsqting=true
        //     }
        //     else{
        //         entity.player.cameraEntity=entity
        //         entity.fsqting=false
        //     }
        // }
        else if(result.value==i18n.t('menu_options.switch_view', {lng: entity.lang})){
            if (entity.player.cameraMode === GameCameraMode.FOLLOW) {
                entity.player.cameraMode = GameCameraMode.FPS
                entity.player.directMessage(i18n.t('directmsgs.switch_success', {lng: entity.lang}))
            }
            else {
                entity.player.cameraMode = GameCameraMode.FOLLOW
                entity.player.directMessage(i18n.t('directmsgs.switch_success', {lng: entity.lang}))
            }
        }
        else if(result.value==i18n.t('menu_options.bug_report', {lng: entity.lang})){
            dialog(i18n.t('dialogs.author', {lng: entity.lang}),i18n.t('dialogs.bug_report', {lng: entity.lang}),entity)
        }
        else if(result.value==i18n.t('menu_options.mute_chat', {lng: entity.lang})){
            const result = await entity.player.dialog({
                type: GameDialogType.INPUT,
                title: i18n.t('dialogs.mute_chat.title', {lng: entity.lang}),
                content: i18n.t('dialogs.mute_chat.content', {lng: entity.lang}),
                confirmText: i18n.t('dialogs.mute_chat.warning', {lng: entity.lang}),
            });
            if(!result || result === null){
                return; 
            }
            else {
                world.say(entity.player.name+'：'+result)
            }
        }
        else if(result.value==i18n.t('menu_options.admin_tools', {lng: entity.lang})){
            if(admin.includes(entity.player.name)||entity.adminlevel>0||adminpro.includes(entity.player.name)){
                const result = await entity.player.dialog({
                    type: GameDialogType.SELECT,
                    title: i18n.t('dialogs.admin_tools.title', {lng: entity.lang}),
                    content: i18n.t('dialogs.admin_tools.content', {lng: entity.lang}),
                    options:[i18n.t('dialogs.admin_tools.doc', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.view_logs', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.create_chat', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.destroy_chat', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.fly', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.land', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.noclip', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.teleport_player', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.teleport_to_player', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.timer', {lng: entity.lang}),
                    i18n.t('dialogs.admin_tools.broadcast', {lng: entity.lang})]
                });
                if(!result || result.value === null){ 
                    return; 
                }
                else if(result.value==i18n.t('dialogs.admin_tools.doc', {lng: entity.lang})){
                    entity.player.link(`https://azkbbys.gitbook.io/azkbbys/docs/bysrunpro/bysrunpro-admin-code-tutorial`, {isConfirm: false, isNewTab: true})
                }
                else if(result.value==i18n.t('dialogs.admin_tools.view_logs', {lng: entity.lang})){
                    entity.player.dialog({
                        type: GameDialogType.SELECT,
                        title: i18n.t('dialogs.admin_tools.logs_title', {lng: entity.lang}),
                        content:i18n.t('dialogs.admin_tools.logs_content', {lng: entity.lang, logs: logs.join('\n')}),
                        options:[i18n.t('dialogs.close', {lng: entity.lang})]
                    })
                }
                else if(result.value==i18n.t('dialogs.admin_tools.create_chat', {lng: entity.lang})){
                    const result = await entity.player.dialog({
                        type: GameDialogType.INPUT,
                        title: i18n.t('dialogs.admin_tools.create_chat_title', {lng: entity.lang}),
                        content: i18n.t('dialogs.admin_tools.create_chat_content', {lng: entity.lang}),
                        confirmText: i18n.t('dialogs.confirm', {lng: entity.lang}),
                    });
                    if(!result || result === null){ 
                        return; 
                    }
                    else{
                        entity.player.directMessage(i18n.t('directmsgs.temp_chat_created', {lng: entity.lang, users: result.split(' '), id: await world.createTempChat(result.split(' '))}))
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.destroy_chat', {lng: entity.lang})){
                    const result = await entity.player.dialog({
                        type: GameDialogType.SELECT,
                        title: i18n.t('dialogs.admin_tools.destroy_chat_title', {lng: entity.lang}),
                        content:i18n.t('dialogs.admin_tools.destroy_chat_content', {lng: entity.lang}),
                        options:await world.getTempChats()
                    });
                    if(!result || result.value === null){ 
                        return; 
                    }
                    else{
                        world.destroyTempChat([result.value])
                        entity.player.directMessage(i18n.t('directmsgs.temp_chat_destroyed', {lng: entity.lang, id: result.value}))
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.fly', {lng: entity.lang})){
                    entity.player.canFly=true
                    entity.player.directMessage(i18n.t('directmsgs.fly_enabled', {lng: entity.lang}))
                }
                else if(result.value==i18n.t('dialogs.admin_tools.land', {lng: entity.lang})){
                    entity.player.canFly=false
                    entity.player.directMessage(i18n.t('directmsgs.fly_disabled', {lng: entity.lang}))
                    const allWearables = entity.player.wearables();
                }
                else if(result.value==i18n.t('dialogs.admin_tools.noclip', {lng: entity.lang})){
                    if(entity.player.spectator==false){
                        entity.player.spectator=true
                    }
                    else{
                        entity.player.spectator=false
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.teleport_player', {lng: entity.lang})){
                    const playernamelist : string[] = []
                    world.querySelectorAll('player').forEach((e)=>{
                        if(e.player.name!=entity.player.name)
                        playernamelist.push(e.player.name)
                    })
                    const result = await entity.player.dialog({
                        type: GameDialogType.SELECT,
                        title: i18n.t('dialogs.admin_tools.teleport_player_title', {lng: entity.lang}),
                        content: i18n.t('dialogs.admin_tools.teleport_player_content', {lng: entity.lang}),
                        options:playernamelist
                    });
                    if(!result || result.value === null){ 
                        return; 
                    }
                    else{
                        for (const e of world.querySelectorAll('player')){;
                            if(e.player.name==result.value){;
                                e.position.x=entity.position.x
                                e.position.y=entity.position.y
                                e.position.z=entity.position.z
                                entity.player.directMessage(i18n.t('directmsgs.teleport_success', {lng: entity.lang}))
                            };
                        };
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.teleport_to_player', {lng: entity.lang})){
                    const playernamelist : string[] = []
                    world.querySelectorAll('player').forEach((e)=>{
                        if(e.player.name!=entity.player.name)
                        playernamelist.push(e.player.name)
                    })
                    const result = await entity.player.dialog({
                        type: GameDialogType.SELECT,
                        title: i18n.t('dialogs.admin_tools.teleport_to_player_title', {lng: entity.lang}),
                        content: i18n.t('dialogs.admin_tools.teleport_to_player_content', {lng: entity.lang}),
                        options:playernamelist
                    });
                    if(!result || result.value === null){ 
                        return; 
                    }
                    else{
                        for (const e of world.querySelectorAll('player')){;
                            if(e.player.name==result.value){;
                                entity.position.x=e.position.x
                                entity.position.y=e.position.y
                                entity.position.z=e.position.z
                                entity.player.directMessage(i18n.t('directmsgs.teleport_success', {lng: entity.lang}))
                            };
                        };
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.timer', {lng: entity.lang})){
                    const result = await entity.player.dialog({
                        type: GameDialogType.INPUT,
                        title: i18n.t('dialogs.admin_tools.timer_title', {lng: entity.lang}),
                        content: i18n.t('dialogs.admin_tools.timer_content', {lng: entity.lang}),
                        confirmText: i18n.t('dialogs.confirm', {lng: entity.lang}),
                    });
                    console.log(entity.count)
                    if(entity.count=true){
                        let s = 0
                        let m = 0
                        let h = 0
                        while(entity.count==true){
                            s++
                            if(s>=60){;m++;s=0}
                            if(m>=60){;h++;m=0}
                            if(h>=3){;entity.player.directMessage(i18n.t('directmsgs.timer_max', {lng: entity.lang}));return;}
                            entity.player.directMessage(h+':'+m+':'+s)
                            await sleep(1000)
                        }
                    }
                    else{
                        entity.player.directMessage(i18n.t('directmsgs.timer_stopped', {lng: entity.lang}))
                    }
                }
                else if(result.value==i18n.t('dialogs.admin_tools.broadcast', {lng: entity.lang})){
                    const result = await entity.player.dialog({
                        type: GameDialogType.INPUT,
                        title: i18n.t('dialogs.admin_tools.broadcast_title', {lng: entity.lang}),
                        content: i18n.t('dialogs.admin_tools.broadcast_content', {lng: entity.lang}),
                        confirmText: i18n.t('dialogs.admin_tools.broadcast_confirm', {lng: entity.lang}),
                    }) as string;
                    world.say(result)
                }
            }
        }
    }
})

// 管理员代码
world.onChat(({ entity, message }) => {
    if(adminpro.includes(entity.player?.name??'undefined')||entity.adminlevel>1){
        if (message.startsWith('$')) {
            try {
                world.say('<~ ' + eval(message.slice(1)))
            }
            catch (err) {
                world.say('<~ ' + err)
            }
        }
    }
})

// 碰撞过滤
world.addCollisionFilter('player','player')

// 消息预览
world.onChat(({entity, message})=>{
    if(message.startsWith('$'))return
    world.say(`${entity.player_title=='玩家'?'':i18n.t('chat.title_prefix', {lng: entity.lang, title: entity.player_title})}${entity.player?.name??'undefined'}：` + message)
    lastmsg = `${entity.player_title=='玩家'?'':i18n.t('chat.title_prefix', {lng: entity.lang, title: entity.player_title})}${entity.player?.name??'undefined'}：` + message
})

// 实体交互
world.querySelectorAll('*').forEach((e)=>{
    if(e.id.startsWith('南瓜')){
        e.addTag('南瓜')
    }
})
world.querySelectorAll('*').forEach((e)=>{
    if(e.id.startsWith('大南瓜')){
        e.addTag('大南瓜')
    }
})
const pumpkin_mesh = world.querySelectorAll('.南瓜')
console.log(`找到${pumpkin_mesh.length}个南瓜实体`)
pumpkin_mesh.forEach((pe)=>{
    pe.enableInteract=true;
    pe.interactHint='拾取南瓜';
    pe.interactRadius=2;
    pe.onInteract(({entity})=>{
        if(!entity.player)return;
        const e = entity as GamePlayerEntity
        if(e.opened_pump.includes(pe)){entity.player.directMessage(i18n.t('directmsgs.already_picked_pumpkin', {lng: entity.lang}));return};
        e.player.directMessage(i18n.t('directmsgs.pickup_pumpkin', {lng: entity.lang, time: 5,n: 1}));
        e.opened_pump.push(pe)
        e.timeleft+=5
    })
})
const big_pumpkin_mesh = world.querySelectorAll('.大南瓜')
console.log(`找到${big_pumpkin_mesh.length}个大南瓜实体`)
big_pumpkin_mesh.forEach((pe)=>{
    pe.enableInteract=true;
    pe.interactHint='拾取南瓜';
    pe.interactRadius=3;
    pe.onInteract(({entity})=>{
        if(!entity.player)return;
        const e = entity as GamePlayerEntity
        if(e.opened_pump.includes(pe)){entity.player.directMessage(i18n.t('directmsgs.already_picked_pumpkin', {lng: entity.lang}));return};
        e.player.directMessage(i18n.t('directmsgs.pickup_big_pumpkin', {lng: entity.lang, time: 15, n: 3}));
        e.opened_pump.push(pe)
        e.opened_pump.push(pe)
        e.opened_pump.push(pe)
        e.timeleft+=15
    })
})

// 商城
world.onPlayerPurchaseSuccess(({tick, userId, productId, orderId})=>{
    console.log(tick,userId,productId,orderId)
    // if(productId==383036030006633){
    //     world.querySelectorAll('player').forEach((e)=>{
    //         if(e.player.userId==userId){
    //             world.say(i18n.t('chat.purchase_green_particle', {lng: e.lang, name: e.player.name}))
    //             log(i18n.t('logs.purchase_green_particle', {lng: e.lang}),e)
    //             Object.assign(e, particle_greenCrystal)
    //             dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
    //         }
    //     })
    // }
    // else if(productId==383030300586724){
    //     world.querySelectorAll('player').forEach((e)=>{
    //         if(e.player.userId==userId){
    //             world.say(i18n.t('chat.purchase_permanent_green_particle', {lng: e.lang, name: e.player.name}))
    //             log(i18n.t('logs.purchase_permanent_green_particle', {lng: e.lang}),e)
    //             e.greenlzxg=true;
    //             dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_permanent_success', {lng: e.lang}),e)
    //         }
    //     })
    // }
    if(productId==383043785274227){// 少量南瓜
        world.querySelectorAll('player').forEach((e)=>{
            if(e.player.userId==userId){
                world.say(i18n.t('chat.purchase_exp', {lng: e.lang, name: e.player.name, exp: 15}))
                e.exp+=15;
                dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
            }
        })
    }
    else if(productId==383043785274232){// 一箱南瓜
        world.querySelectorAll('player').forEach((e)=>{
            if(e.player.userId==userId){
                world.say(i18n.t('chat.purchase_exp', {lng: e.lang, name: e.player.name, exp: 100}))
                e.exp+=100;
                dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
            }
        })
    }
    else if(productId==383043785273976){// 一瓶南瓜灯油
        world.querySelectorAll('player').forEach((e)=>{
            if(e.player.userId==userId){
                e.timeleft+=10;
                dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
            }
        })
    }
    else if(productId==383043785273979){// 一罐南瓜灯油
        world.querySelectorAll('player').forEach((e)=>{
            if(e.player.userId==userId){
                e.timeleft+=100;
                dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
            }
        })
    }
    else if(productId==383049581802779){// 一桶南瓜灯油
        world.querySelectorAll('player').forEach((e)=>{
            if(e.player.userId==userId){
                e.timeleft+=1000;
                dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.purchase_success', {lng: e.lang}),e)
            }
        })
    }
    // world.querySelectorAll('player').forEach((e)=>{
    //     if(e.player.userId==userId){
    //         dialog(i18n.t('dialogs.system', {lng: e.lang}),i18n.t('dialogs.save_reminder', {lng: e.lang}),e)
    //     }
    // })
})