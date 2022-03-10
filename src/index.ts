import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import GameManager from "./GameManager";
const gameManager = new GameManager();
import { PATH } from "./constants";

const app = express();

const server = http.createServer(app);
export const io = new Server(server, { transports: ["websocket"], path: PATH });

type GameFunction = (socket: Socket, message: any) => void;
const gameFunction: {
    create: GameFunction
    join: GameFunction
} = {
    create: (socket: Socket) => {
        const gameId = gameManager.createGame();
        gameManager.joinGame(gameId, socket);
        socket.emit("gameId", gameId);
    },
    join: (socket: Socket, message: any) => {
        if (!gameManager.joinGame(message.id, socket))
            socket.emit("error", "game not found");
    }
}

io.on("connection", socket => {
    console.log("connection from: ", socket.id);

    socket.on("disconnect", () => {
        console.log("disconnection from: ", socket.id);
    });

    socket.on("gameFunction", message => {
        if (message.name in gameFunction)
            gameFunction[message.name as keyof typeof gameFunction](socket, message);
    });

    socket.on("gameUpdate", async (data) => {
        const [gameId] = gameManager.getCurrentGames(socket);
        if (!gameId || !gameManager.exist(gameId)) {
            socket.emit("error", "game not found");
            return;
        }

        gameManager.update(gameId, data);
    });
});


const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
