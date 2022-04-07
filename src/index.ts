import express from "express";
import http from "http";
import { Server } from "socket.io";
import GameManager from "./GameManager";
import { PATH } from "./constants";
import gameFunctions from "./utils/gameFunctions";
import restoreGames from "./redis/restoreGames";

export const gameManager = new GameManager();

const app = express();

const server = http.createServer(app);
export const io = new Server(server, { transports: ["websocket"], path: PATH });

io.on("connection", socket => {
    socket.on("disconnecting", () => {
        gameManager.leaveGame(socket);
    });

    socket.on("gameFunction", message => {
        if (message.name in gameFunctions)
            gameFunctions[message.name as keyof typeof gameFunctions](socket, message);
    });

    socket.on("gameUpdate", data => {
        const [gameId] = gameManager.getCurrentGames(socket);
        if (!gameId || !gameManager.exist(gameId)) {
            socket.emit("error", "game not found");
            return;
        }

        gameManager.update(gameId, data, socket);
    });
});

const main = async () => {
    await restoreGames();

    const PORT = 5001;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

main();
