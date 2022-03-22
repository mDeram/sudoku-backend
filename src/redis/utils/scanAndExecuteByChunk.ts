import redis from "../loader";

async function scanAndExecuteByChunk(query: string, cb: (key: string) => any) {
    let cursor = "0";
    let result: string[];
    do {
        [cursor, result] = await redis.scan(cursor, "MATCH", query);
        // Call the callback for each result and wait for their execution
        await Promise.all(result.map(async (key) => await cb(key)));
    } while (cursor !== "0");
}

export default scanAndExecuteByChunk;
