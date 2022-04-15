import { FormatGenerated, GenerateSudoku, CheckSudoku } from "../generators/types";
import { getSudoku } from "sudoku-gen";
import { Difficulty } from "sudoku-gen/dist/types/difficulty.type";

const formatGenerated: FormatGenerated = (generated: string) => {
    return generated.replace(/-/g, " ").split("");
}

const generateSudoku: GenerateSudoku = (difficulty: Difficulty) => {
    const sudoku = getSudoku(difficulty);
    console.log(sudoku.solution);
    return {
        layout: formatGenerated(sudoku.puzzle),
        solution: formatGenerated(sudoku.solution),
    }
}

const checkSudoku: CheckSudoku = (data, solution) => {
    return data.join("") === solution.join("");
}

export { generateSudoku, checkSudoku };
