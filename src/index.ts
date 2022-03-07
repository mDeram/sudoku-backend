import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });

io.on("connection", socket => {
    console.log("new connection from: ", socket.handshake.url);
    socket.emit("hello", "hello there");
    socket.on("disconnect", () => {
        console.log("disconnection from: ", socket.handshake.url);
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
