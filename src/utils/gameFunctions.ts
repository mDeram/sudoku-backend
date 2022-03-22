import { Socket } from "socket.io";
import { gameManager } from "../index";

type GameFunction = (socket: Socket, message: any) => void;
const gameFunctions: {
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
        socket.emit("gameId", message.id);
    }
}

export default gameFunctions;
