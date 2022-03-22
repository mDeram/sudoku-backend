import scanAndExecuteByChunk from "../redis/utils/scanAndExecuteByChunk";
import { GameState } from "../games/Coop";
import { gameManager } from "../index";
import { getCoopGamesPrefix } from "../redis/keys";
import redis from "../redis/loader";

async function restoreGameFromKey(key: string) {
    const id = key.split(":").pop();
    if (typeof id === "undefined") return;

    const data = await redis.hgetall(key);

    gameManager.restoreGame(id, {
        data: JSON.parse(data.data) as string[],
        layout: JSON.parse(data.layout) as string[],
        state: data.state as GameState
    });
}

const restoreGames = async () => {
    const query = getCoopGamesPrefix() + "*";
    await scanAndExecuteByChunk(query, restoreGameFromKey);
}

export default restoreGames;
