import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
const sudokuTools = require("sudokutoolcollection");

const app = express();

const server = http.createServer(app);
const path = process.env.NODE_ENV === "production" ? "/sudoku/socket" : "/socket.io";
const io = new Server(server, { transports: ["websocket"], path: path });
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

//use a proxy with function to handle game updates
//or just functions
class MultiplayerSudoku {
    data: string[];
    layout: string[];
    state: "create" | "init" | "run" | "done";
    id: string;

    constructor(id: string) {
        this.id = id;
        this.state = "create";
    }

    init() {
        this.state = "init";
        io.to(this.id).emit("game init")
    }

    start() {
        this.state = "run";
        this.data = initData();
        this.layout = sudokuTools().generator.generate("hard").replace(/\./g, " ").split("");
        io.to(this.id).emit("game layout", this.layout)
        io.to(this.id).emit("game start", this.data)
    }

    update(data: string[]) {
        //TODO check data validity
        this.data = data;
        io.in(this.id).emit("game update", data);

        if (this.checkSolved()) {
            this.state = "done"
            io.in(this.id).emit("game success");
        }
    }

    checkSolved() {
        const layoutAndData = [...this.layout];
        for (let i = 0; i < 81; i++) {
            if (layoutAndData[i] === " ") {
                if (this.data[i] === " ") return false;
                layoutAndData[i] = this.data[i];
            }
        }
        const formatedData = layoutAndData.join("").replace(/\ /g, ".");
        console.log(formatedData);
        return sudokuTools().solver.solve(formatedData);
    }
}

function createGame() {
    const gameId = uuid();
    games.set(gameId, new MultiplayerSudoku(gameId));
    return gameId;
}

function initData() {
    const newData: string[] = [];
    for (let i = 0; i < 81; i++) {
        newData[i] = " ";
    }
    return newData;
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
