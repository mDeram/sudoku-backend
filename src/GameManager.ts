import { nanoid } from "nanoid";
import { Socket } from "socket.io";
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

    joinGame(gameId: string, socket: Socket) {
        const game = this.games.get(gameId);
        if (!game) return false;

        this.leaveAllGames(socket);
        socket.join(gameId);
        game.join(socket);

        return true;
    }

    update(gameId: string, data: string[], socket: Socket) {
        this.games.get(gameId)?.update(data, socket);
    }
}

export default GameManager;
