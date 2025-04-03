"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const gameUtil_1 = require("./gameUtil");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
// export const redis = new Redis('localhost:6379', {
//   maxRetriesPerRequest: null
// });
const redis = new ioredis_1.default(process.env.REDIS_URL, {
    tls: {
        rejectUnauthorized: false
    },
    maxRetriesPerRequest: null
});
function processor(job) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameId = job.queueName;
        if (gameId) {
            redis.get(gameId)
                .then((result) => {
                if (result) {
                    const board = JSON.parse(result);
                    (0, gameUtil_1.actionEvent)(job.data, board);
                    redis.set(gameId, JSON.stringify(board));
                }
            });
        }
    });
}
class Game {
    constructor(gameId, playerId, emitUpdate) {
        this.gameId = gameId;
        this.players = [playerId];
        this.queue = new bullmq_1.Queue(gameId.toString(), { connection: redis });
        this.emitUpdate = emitUpdate;
        const worker = new bullmq_1.Worker(gameId.toString(), processor, { connection: redis });
        worker.on('drained', emitUpdate);
    }
    addPlayer(player) {
        this.players.push(player);
    }
    deletePlayer(player) {
        const index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }
    handleEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queue.add('event', event);
            // this.queue.count().then(count => console.log(this.gameId, count));
        });
    }
}
exports.Game = Game;
