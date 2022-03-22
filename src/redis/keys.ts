export const PREFIX = "msudoku";
export const getKey = (key: string) => `${PREFIX}:${key}`;
export const getPrefix = (key: string) => getKey(`${key}:`);

export const getGamesPrefix = (gameType: "coop") => getPrefix(`games:${gameType}`);
export const getCoopGamesPrefix = () => getGamesPrefix("coop");

export const getCoopGameKey = (id: string) => getGamesPrefix("coop") + id;
