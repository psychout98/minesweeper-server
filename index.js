const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');

const corsOptions = {
  methods: ["GET", "POST"],
  credentials: true,
  origin: "https://mines-84c898177d88.herokuapp.com/"
  // origin: "*"
}

const server = http.createServer(app, corsOptions);

const { Server } = require("socket.io");
const io = new Server(server,
  {
    cors: corsOptions,
    path: '/socket'
  }
);

const rooms = new Set();

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/randomId', (req, res) => {
  let randomId = Math.floor(Math.random() * 8999) + 1000;
  while (rooms.has(randomId)) {
    randomId = Math.floor(Math.random() * 8999) + 1000;
  }
  res.send(randomId.toString());
});

io.on('connection', (socket) => {

  socket.on("subscribe", (topics) => {
    socket.join(topics);
    rooms.add(topics[0]);
    io.to(topics).except(socket.id).emit("userJoined");
  });

  socket.on("disconnecting", () => {
    rooms.delete([...socket.rooms].filter(room => room !== socket.id)[0]);
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