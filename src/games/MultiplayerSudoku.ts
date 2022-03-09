import { io } from "../index";
const sudokuTools = require("sudokutoolcollection");

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
        this.state = "create";
        this.data = initData();
        this.layout = generateSudoku("easy");
    }

    init() {
        this.state = "init";
        io.to(this.id).emit("game init")
    }

    start() {
        this.state = "run";
        io.to(this.id).emit("game layout", this.layout)
        io.to(this.id).emit("game start", this.data)
    }

    update(data: string[]) {
        //TODO check data validity
        this.data = data;
        io.in(this.id).emit("game update", data);

        if (this.isSolved()) {
            this.end();
        }
    }

    end() {
        this.state = "done";
        io.in(this.id).emit("game success");
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
