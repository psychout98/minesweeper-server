const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  path: '/socket',
  cors: {
    origin: "https://mines-84c898177d88.herokuapp.com/"
  }
});

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/randomId', (req, res) => {

});

io.on('connection', (socket) => {

  socket.on("subscribe", (topics) => {
    socket.join(topics);
    io.to(topics).except(socket.id).emit("userJoined");
  });

  socket.on("disconnecting", () => {
    io.to([...socket.rooms]).emit("mouseLeave", socket.id);
  });

  socket.on("mouseMove", (mouseData, gameId) => {
    io.to(gameId).except(socket.id).emit("mouseMove", { ...mouseData, socketId: socket.id });
  });

  socket.on("uploadBoard", (board, gameId) => {
    io.to(gameId).except(socket.id).emit("receiveBoard", board);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});