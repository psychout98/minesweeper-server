const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');

const corsOptions = {
  credentials: true,
  origin: "https://mines-84c898177d88.herokuapp.com"
  // origin: "*"
}

const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server,
  {
    cors: corsOptions,
    path: '/socket'
  }
);

const Game = require('./Game')

const games = new Map();
const players = new Map();

app.use(cors(corsOptions));

app.get('/randomId', (req, res) => {
  let randomId = Math.floor(Math.random() * 8999) + 1000;
  while (games.has(randomId.toString())) {
    randomId = Math.floor(Math.random() * 8999) + 1000;
  }
  res.send(randomId.toString());
});

io.on('connection', (socket) => {

  socket.on("subscribe", (gameId) => {
    socket.join(gameId);
    players.set(socket.id, gameId);
    if (!games.has(gameId)) {
      games.set(gameId, new Game(io, gameId, socket.id));
    }
    io.to(gameId).except(socket.id).emit("userJoined");
  });

  socket.on("disconnecting", () => {
    const gameId = players.get(socket.id);
    if (gameId) {
      players.delete(socket.id);
      const game = games.get(gameId);
      if (game) {
        game.deletePlayer(socket.id);
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit("mouseLeave", socket.id);
        }
      }
    }
  });

  socket.on("mouseMove", (mouseData, gameId) => {
    io.to(gameId).except(socket.id).emit("mouseMove", { ...mouseData, socketId: socket.id });
  });

  socket.on("uploadEvent", (event) => {
    const gameId = players.get(socket.id);
    if (gameId) {
      games.get(gameId)?.handleEvent(event);
    }
  });

  socket.on("newGame", () => {
    const gameId = players.get(socket.id);
    if (gameId) {
      games.get(gameId)?.reset();
    }
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`listening on ${port}`);
});