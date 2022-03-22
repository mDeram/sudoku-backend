import { GameState } from "../games/Coop";
import { gameManager } from "../index";
import { getCoopGamesPrefix } from "../redis/keys";
import redis from "../redis/loader";

const restoreGames = async () => {
    const query = getCoopGamesPrefix() + "*";
    const result = await redis.keys(query);

    await Promise.all(result.map(async (key) => {
        const id = key.split(":").pop();
        const data = await redis.hgetall(key);

        if (typeof id === "undefined") return;

        gameManager.restoreGame(id, {
            data: JSON.parse(data.data) as string[],
            layout: JSON.parse(data.layout) as string[],
            state: data.state as GameState
        });
    }));
}

export default restoreGames;
