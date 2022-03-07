import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";

const app = express();

const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });
const games = new Set();

function leaveAllGames(socket: Socket) {
    socket.rooms.forEach(room => {
        if (games.has(room)) {
            socket.leave(room)
        }
    });
}

function createGame() {
    const gameId = uuid();
    games.add(gameId);
    return gameId;
}

async function initGame(gameId: string) {
    const playersInGame = await io.in(gameId).fetchSockets();
    if (playersInGame.length >= 2)
        io.to(gameId).emit("game init")
}

function joinGame(socket: Socket, gameId: string) {
    if (!games.has(gameId)) return false;

    leaveAllGames(socket);
    socket.join(gameId);
    initGame(gameId);

    return true;
}

io.on("connection", socket => {
    console.log("new connection from: ", socket.id);

    socket.on("disconnect", () => {
        console.log("disconnection from: ", socket.id);
    });

    socket.on("game create", () => {
        const gameId = createGame();
        joinGame(socket, gameId);
        socket.emit("game id", gameId);
    });

    socket.on("game join", gameId => {
        if (!joinGame(socket, gameId))
            socket.emit("error", "game not found");
    });
});


const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
