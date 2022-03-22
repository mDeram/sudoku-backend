import { nanoid } from "nanoid";
import { Socket } from "socket.io";
import Coop, { PersistedData } from "./games/Coop";

class GameManager {
    games: Map<string, Coop>;

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
        //TODO secure
        const gameId = nanoid();
        this.games.set(gameId, new Coop(gameId));
        return gameId;
    }

    restoreGame(id: string, data: PersistedData) {
        this.games.set(id, new Coop(id, data));
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
