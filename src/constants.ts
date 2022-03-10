export const ___prod___ = process.env.NODE_ENV === "production";
export const PATH = ___prod___ ? "/sudoku/socket.io" : "/socket.io";
