import { Socket } from "socket.io";
import persistGame from "../redis/persistGame";
import { io } from "../index";
const sudokuTools = require("sudokutoolcollection");

const possibleCell = ["1", "2", "3", "4", "5", "6", "7", "8", "9", " "];

function initData() {
    const newData: string[] = [];
    for (let i = 0; i < 81; i++) {
        newData[i] = " ";
    }
    return newData;
}

function formatGeneratedSudoku(generated: string): string[] {
    return generated.replace(/\./g, " ").split("");
}

function formatSudokuToCheck(sudoku: string[]): string {
    return sudoku.join("").replace(/\ /g, ".");
}

function generateSudoku(difficulty: "easy" | "medium" | "hard" | number) {
    const sudoku = sudokuTools().generator.generate(difficulty);
    return formatGeneratedSudoku(sudoku);
}

export type GameState = "create" | "init" | "run" | "done";

export interface PersistedData {
    data: string[];
    layout: string[];
    state: GameState
}

class Coop {
    data: string[];
    layout: string[];
    state: GameState;
    id: string;

    constructor(id: string, restoreData?: PersistedData) {
        this.id = id;

        if (restoreData) {
            this.data = restoreData.data;
            this.layout = restoreData.layout;
            this.state = "create";
            return;
        }

        this.data = initData();
        this.layout = generateSudoku("easy");
        this.state = "create";

        this.persist();
    }

    async persist() {
        // Do we care about this being async?
        await persistGame(this.id, { data: this.data, layout: this.layout, state: this.state });
    }

    init() {
        this.setState("init");
        setTimeout(() => {
            this.start();
        }, 1000);
    }

    start() {
        this.setState("run");
        io.to(this.id).emit("gameUpdate", { layout: this.layout, data: this.data });
    }

    update(data: string[], socket: Socket) {
        //TODO when the user send incorrect data multiple times, he get kicked
        if (this.state !== "run")
            socket.emit("error", "game is not running");

        const isDataValid = this.setData(data);
        if (!isDataValid) {
            socket.emit("gameUpdate", { layout: this.layout, data: this.data });
            return;
        }

        io.in(this.id).emit("gameUpdate", { data });

        if (this.isSolved())
            this.end();
    }

    end() {
        this.setState("done");
    }

    async join(socket: Socket) {
        if (await this.canInit())
            this.init();
        else
            this.catchUp(socket);
    }

    async canInit() {
        if (this.state !== "create") return false;
        const playersInGame = await io.in(this.id).fetchSockets();
        const enoughPlayerInGame = playersInGame.length >= 2;
        return enoughPlayerInGame;
    }

    catchUp(socket: Socket) {
        if (this.state === "create") {
            socket.emit("gameState", "create");
            return;
        }

        socket.emit("gameState", "init");
        if (this.state !== "init") {
            socket.emit("gameState", this.state);
            socket.emit("gameUpdate", { layout: this.layout, data: this.data });
        }
    }

    setState(state: Coop["state"]) {
        this.state = state;
        io.to(this.id).emit("gameState", state);
        this.persist();
    }

    setData(data: string[]): boolean {
        if (!this.checkDataValidity(data)) return false

        this.data = data;

        this.persist();
        return true;
    }

    checkDataValidity(data: string[]) {
        if (!Array.isArray(data)) return false;
        if (data.length !== 81) return false;

        for (let i = 0; i < 81; i++) {
            const cell = data[i];
            if (!possibleCell.includes(cell)) return false;
            if (this.layout[i] !== " " && cell !== " ") return false;
        }
        return true;
    }

    isSolved() {
        const layoutAndData = [...this.layout];
        for (let i = 0; i < 81; i++) {
            if (layoutAndData[i] === " ") {
                if (this.data[i] === " ") return false;
                layoutAndData[i] = this.data[i];
            }
        }
        const formatedData = formatSudokuToCheck(layoutAndData);
        return sudokuTools().solver.solve(formatedData);
    }
}

export default Coop;
