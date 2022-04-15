export type Sudoku = string[];

export type FormatGenerated = (generated: any) => Sudoku;

export type GenerateSudoku = (difficulty: any) => { layout: Sudoku, solution: Sudoku, difficulty: any};
export type CheckSudoku = (sudoku: Sudoku, solution: Sudoku) => boolean;
