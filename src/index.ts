import express from "express";
import http from "http";
import { Server } from "socket.io";
import GameManager from "./GameManager";
const gameManager = new GameManager();

const app = express();

const server = http.createServer(app);
const path = process.env.NODE_ENV === "production" ? "/sudoku/socket" : "/socket.io";
export const io = new Server(server, { transports: ["websocket"], path: path });

io.on("connection", socket => {
    console.log("connection from: ", socket.id);

    socket.on("disconnect", () => {
        console.log("disconnection from: ", socket.id);
    });

    socket.on("game create", () => {
        const gameId = gameManager.createGame();
        gameManager.joinGame(gameId, socket);
        socket.emit("game id", gameId);
    });

    socket.on("game join", gameId => {
        if (!gameManager.joinGame(gameId, socket))
            socket.emit("error", "game not found");
    });

    socket.on("game update", async (data) => {
        const [gameId] = gameManager.getCurrentGames(socket);
        if (!gameId || !gameManager.exist(gameId)) {
            socket.emit("error", "game not found");
            return;
        }

        //await new Promise(resolve => setTimeout(resolve, 1000));
        gameManager.update(gameId, data);
    });
});


const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
