import scanAndExecuteByChunk from "../redis/utils/scanAndExecuteByChunk";
import { GameState } from "../games/Coop";
import { gameManager } from "../index";
import { getCoopGamesPrefix } from "../redis/keys";
import redis from "../redis/loader";

async function restoreGameFromKey(key: string) {
    const id = key.split(":").pop();
    if (typeof id === "undefined") return;

    try {
        const data = await redis.hgetall(key);

        const game = {
            data: JSON.parse(data.data) as string[],
            layout: JSON.parse(data.layout) as string[],
            solution: JSON.parse(data.solution) as string[],
            difficulty: data.difficulty as string,
            state: data.state as GameState
        }

        gameManager.restoreGame(id, game);
    } catch(e) {
        console.error(e);
    }
}

const restoreGames = async () => {
    const query = getCoopGamesPrefix() + "*";
    try {
        await scanAndExecuteByChunk(query, restoreGameFromKey);
    } catch(e) {
        console.error("Could not restore all games", e);
    }
}

export default restoreGames;
