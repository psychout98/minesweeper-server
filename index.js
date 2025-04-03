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

const { Game, cacheBoard, getBoard } = require('./Game');
const { newGameString, newGameBoard } = require('./gameUtil');

const games = new Map();
const players = new Map();

function getNewGameId() {
  const gameId = Math.floor(Math.random() * 8999) + 1000;
  while (games.has(gameId)) {
    gameId = Math.floor(Math.random() * 8999) + 1000;
  }
  return gameId;
}

function getNewPlayerId() {
  const playerId = Math.floor(Math.random() * 8999) + 1000;
  while (players.has(playerId)) {
    playerId = Math.floor(Math.random() * 8999) + 1000;
  }
  return playerId;
}

async function startGame(gameId, playerId) {
  const game = new Game(gameId.toString(), playerId, () => getBoard(gameId).then(board => io.to(gameId).emit('receiveBoard', board)));
  games.set(gameId, game);
  return await cacheBoard(gameId, newGameString)
}

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/board/:gameId', (req, res) => {
  getBoard(req.params.gameId).then(board => {
    res.status(200).send(board);
  }).catch(e => res.status(404).send(e));
});

app.get('/newGame/:playerId?', (req, res) => {
  let playerIdParam = req.params.playerId;
  let playerId, gameId;
  if (playerIdParam) {
    playerId = Number.parseInt(playerIdParam);
    gameId = players.get(playerId);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        cacheBoard(gameId.toString(), newGameString).then(() => {
          res.status(200).send({ gameId, playerId, board: newGameBoard });
        });
      }
    } else {
      gameId = getNewGameId();
    }
  } else {
    playerId = getNewPlayerId();
    gameId = getNewGameId();
  }
  players.set(playerId, gameId);
  startGame(gameId, playerId)
    .then(() => {
      res.status(200).send({ gameId, playerId, board: newGameBoard });
    });
});

app.get('/joinGame/:gameId', (req, res) => {
  const playerId = getNewPlayerId();
  let gameId = Number.parseInt(req.params.gameId);
  players.set(playerId, gameId);
  const game = games.get(gameId);
  if (game) {
    game.addPlayer(playerId);
    getBoard(req.params.gameId).then(board => {
      res.status(200).send({ gameId, playerId, board: JSON.parse(board)});
    });
  } else {
    startGame(gameId.toString(), playerId)
    .then(() => {
      res.status(200).send({ gameId, playerId, board: newGameBoard });
    });
  }
});

app.post('/event', (req, res) => {
  const event = req.body.event;
  const playerId = event.playerId;
  const gameId = players.get(playerId);
  if (gameId) {
    const game = games.get(gameId);
    if (game) {
      game.handleEvent(event);
      res.status(200).send();
    } else {
      res.status(404).send('No active game');
    }
  } else {
    res.status(404).send('GameId not found for player');
  }
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on("subscribe", (gameId, playerId) => {
    socket.join(gameId);
    socket.join(playerId);

    socket.on("disconnecting", () => {
      socket.leave(gameId);
      socket.leave(playerId);
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