import { getCoopGameKey } from "../redis/keys";
import redis from "../redis/loader";
import { PersistedData } from "../games/Coop";

const persistGame = async (id: string, data: PersistedData) => {
    const key = getCoopGameKey(id);
    await redis.hset(key,
        "data", JSON.stringify(data.data),
        "layout", JSON.stringify(data.layout),
        "state", data.state
    );
    // Every update make the game expire in 24h
    redis.expire(key, 3600 * 24);
}

export default persistGame;
