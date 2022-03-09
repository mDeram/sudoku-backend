import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import MultiplayerSudoku from "./games/MultiplayerSudoku";

const app = express();

const server = http.createServer(app);
const path = process.env.NODE_ENV === "production" ? "/sudoku/socket" : "/socket.io";
export const io = new Server(server, { transports: ["websocket"], path: path });
const games = new Map();

function leaveAllGames(socket: Socket) {
    getCurrentGames(socket).forEach(room => socket.leave(room));
}

function getCurrentGames(socket: Socket) {
    const result: string[] = [];
    socket.rooms.forEach(room => {
        if (games.has(room))
            result.push(room);
    })
    return result;
}

function createGame() {
    const gameId = nanoid();
    games.set(gameId, new MultiplayerSudoku(gameId));
    return gameId;
}

async function initGame(gameId: string) {
    if (games.get(gameId).state !== "create") return;

    const playersInGame = await io.in(gameId).fetchSockets();
    if (playersInGame.length >= 2) {
        games.get(gameId).init();
        setTimeout(() => {
            games.get(gameId).start();
        }, 2000);
    }
}

//TODO refactor
function joinGame(socket: Socket, gameId: string) {
    if (!games.has(gameId)) return false;

    leaveAllGames(socket);
    socket.join(gameId);
    const state = games.get(gameId).state;
    if (state === "create")
        initGame(gameId)
    else {
        const game = games.get(gameId);
        socket.emit("game init");
        socket.emit("game layout", game.layout);
        socket.emit("game update", game.data);
    }

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

    socket.on("game update", async (data) => {
        //TODO some checks in setData
        const [gameId] = getCurrentGames(socket);
        if (!gameId) {
            socket.emit("error", "game not found");
            return;
        }

        //await new Promise(resolve => setTimeout(resolve, 1000));
        const game = games.get(gameId)
        if (!game) {
            socket.emit("error", "game not found");
            return;
        }
        game.update(data);
    });
});


const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
