import { Socket } from "socket.io";
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

class MultiplayerSudoku {
    data: string[];
    layout: string[];
    state: "create" | "init" | "run" | "done";
    id: string;

    constructor(id: string) {
        this.id = id;
        this.data = initData();
        this.layout = generateSudoku("easy");
        this.setState("create");
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

    setState(state: MultiplayerSudoku["state"]) {
        this.state = state;
        io.to(this.id).emit("gameState", state);
    }

    setData(data: string[]): boolean {
        if (!this.checkDataValidity(data)) return false

        this.data = data;
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
        console.log(formatedData);
        return sudokuTools().solver.solve(formatedData);
    }
}

export default MultiplayerSudoku;
