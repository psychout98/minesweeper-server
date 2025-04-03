const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');

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

const { Game } = require('./Game')

const games = new Map();
const players = new Map();

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/board/:gameId', (req, res) => {
  const board = games.get(Number.parseInt(req.params.gameId).board);
  res.status(200).send(board);
});

app.get('/newGame/:playerId?', (req, res) => {
  let playerIdParam = req.params.playerId;
  let playerId;
  if (playerIdParam) {
    playerId = Number.parseInt(playerIdParam);
    let gameId = players.get(playerId);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        game.reset(playerId);
        res.status(200).send({ gameId, playerId, board: game.board });
        return;
      }
    }
  } else {
    playerId = Math.floor(Math.random() * 8999) + 1000;
    while (players.has(playerId)) {
      playerId = Math.floor(Math.random() * 8999) + 1000;
    }
  }
  let gameId = Math.floor(Math.random() * 8999) + 1000;
  while (games.has(gameId)) {
    gameId = Math.floor(Math.random() * 8999) + 1000;
  }
  players.set(playerId, gameId);
  const game = games.get(gameId);
  if (game) {
    game.addPlayer(playerId);
  } else {
    games.set(gameId, new Game(io, gameId, playerId));
  }
  res.status(200).send({ gameId, playerId, board: games.get(gameId).board });
});

app.get('/joinGame/:gameId', (req, res) => {
  let playerId = Math.floor(Math.random() * 8999) + 1000;
  while (players.has(playerId)) {
    playerId = Math.floor(Math.random() * 8999) + 1000;
  }
  let gameId = Number.parseInt(req.params.gameId);
  const game = games.get(gameId);
  if (game) {
    game.addPlayer(playerId);
  } else {
    games.set(gameId, new Game(io, gameId, playerId));
  }
  res.status(200).send({ gameId, playerId, board: games.get(gameId).board });
});

app.post('/event', async (req, res) => {
  const event = req.body.event;
  const playerId = event.playerId;
  const gameId = players.get(playerId);
  if (gameId) {
    const game = games.get(gameId);
    if (game) {
      const event = {
        ...req.body.event,
        callback: (board) => res.status(200).send({ gameId, playerId, board })
      };
      game.handleEvent(event);
    } else {
      res.status(404).send();
    }
  } else {
    res.status(404).send();
  }
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on("subscribe", (gameId, playerId) => {
    socket.join(gameId);
    socket.join(playerId);

    socket.on("disconnecting", () => {
      if (players.delete(playerId)) {
        const game = games.get(gameId);
        if (game) {
          game.deletePlayer(playerId);
          if (game.players.length === 0) {
            games.delete(gameId);
          } else {
            io.to(gameId).emit("mouseLeave", playerId);
          }
        }
      }
    });

    socket.on("mouseMove", async (x, y) => {
      io.to(gameId).except(playerId).emit("mouseMove", x, y, playerId);
    });
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`listening on ${port}`);
});