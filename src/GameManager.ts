import { nanoid } from "nanoid";
import { Socket } from "socket.io";
import { io } from "./index";
import MultiplayerSudoku from "./games/MultiplayerSudoku";

class GameManager {
    games: Map<string, MultiplayerSudoku>;

    constructor() {
        this.games = new Map()
    }

    exist(gameId: string): boolean {
        return this.games.has(gameId);
    }

    getCurrentGames(socket: Socket) {
        const result: string[] = [];
        socket.rooms.forEach(room => {
            if (this.games.has(room))
                result.push(room);
        })
        return result;
    }

    leaveAllGames(socket: Socket) {
        this.getCurrentGames(socket).forEach(room => socket.leave(room));
    }

    createGame() {
        const gameId = nanoid();
        this.games.set(gameId, new MultiplayerSudoku(gameId));
        return gameId;
    }

    async initGame(gameId: string) {
        const game = this.games.get(gameId);
        if (game?.state !== "create") return;

        const playersInGame = await io.in(gameId).fetchSockets();
        if (playersInGame.length >= 2) {
            game.init();
            setTimeout(() => {
                game.start();
            }, 2000);
        }
    }

    joinGame(gameId: string, socket: Socket) {
        const game = this.games.get(gameId);
        if (!game) return false;

        this.leaveAllGames(socket);
        socket.join(gameId);
        if (game.state === "create")
            this.initGame(gameId)
        else {
            socket.emit("game init");
            socket.emit("game layout", game.layout);
            socket.emit("game update", game.data);
        }

        return true;
    }

    update(gameId: string, data: any) {
        this.games.get(gameId)?.update(data);
    }
}

export default GameManager;
