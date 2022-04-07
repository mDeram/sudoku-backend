import { nanoid } from "nanoid";
import { Socket } from "socket.io";
import { io } from "./index";
import Coop, { PersistedData } from "./games/Coop";

type GameData = { playerCount: number, game: Coop};

class GameManager {
    gamesData: Map<string, GameData>;

    constructor() {
        this.gamesData = new Map()
    }

    exist(gameId: string): boolean {
        return this.gamesData.has(gameId);
    }

    getCurrentGames(socket: Socket) {
        const result: string[] = [];
        socket.rooms.forEach(room => {
            if (this.gamesData.has(room))
                result.push(room);
        })
        return result;
    }

    leaveAllGames(socket: Socket) {
        this.leaveGame(socket);
        this.getCurrentGames(socket).forEach(room => socket.leave(room));
    }

    createGame() {
        const gameId = nanoid();
        this.gamesData.set(gameId, { playerCount: 0, game: new Coop(gameId) });
        return gameId;
    }

    restoreGame(id: string, data: PersistedData) {
        this.gamesData.set(id, { playerCount: 0, game: new Coop(id, data) });
    }

    joinGame(gameId: string, socket: Socket) {
        const gameData = this.gamesData.get(gameId);
        if (!gameData) return false;

        this.leaveAllGames(socket);
        socket.join(gameId);
        gameData.game.join(socket);
        this.changePlayerCount(gameData, 1);

        return true;
    }

    leaveGame(socket: Socket) {
        this.getCurrentGames(socket).forEach(room => {
            const gameData = this.gamesData.get(room);
            if (!gameData) return;
            this.changePlayerCount(gameData, -1);
        });
    }

    update(gameId: string, data: string[], socket: Socket) {
        this.gamesData.get(gameId)?.game.update(data, socket);
    }

    changePlayerCount(gameData: GameData, value: number) {
        gameData.playerCount += value;

        io.in(gameData.game.id).emit("playerCount", gameData.playerCount);
    }
}

export default GameManager;
