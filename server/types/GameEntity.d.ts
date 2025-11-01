/**
 * 扩展[游戏实体]的接口
 * 该接口继承自GameEntity，可以为[游戏实体]添加额外的属性或方法。
 */
declare interface GameEntity extends GameEntity {
	save: boolean;
	exp: number,
    bag: string[],
    greenlzxg: boolean,
    player_title: string,
    adminlevel: number,
    canplay: boolean,
    used_duihuanma: string[],
    skins: string[],
    usingskin: string,
    last_team: number,
    jointime: {
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number
    },
    lang: string,
    playing: boolean,
    timeleft: number,
    count: boolean,
    opened_pump: GameEntity[],
};
