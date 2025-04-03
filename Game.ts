import { Event, actionEvent } from "./gameUtil";
import { Queue, Worker, Job } from 'bullmq';
import Redis from "ioredis";

// export const redis = new Redis('localhost:6379', {
//   maxRetriesPerRequest: null
// });

const redis = new Redis(process.env.REDIS_URL as string, {
  tls: {
      rejectUnauthorized: false
  },
  maxRetriesPerRequest: null
});

export async function cacheBoard(gameId: string, board: string) {
    return await redis.set(gameId, board);
}

export async function getBoard(gameId: string) {
    const board = await redis.get(gameId);
    if (board) {
        return JSON.parse(board);
    } else {
        throw new Error(`Game ${gameId} not found`);
    }
}

async function processor(job: Job) {
    const gameId = job.queueName;
    return await getBoard(gameId)
        .then((board) => {
            actionEvent(job.data, board);
            return cacheBoard(gameId, JSON.stringify(board));
        });
}

export class Game {

    gameId: string;
    players: number[];
    queue: Queue;
    emitUpdate: () => void;

    constructor(gameId: string, playerId: number, emitUpdate: () => void) {
        this.gameId = gameId;
        this.players = [playerId];
        this.queue = new Queue(gameId.toString(), { connection: redis });
        this.emitUpdate = emitUpdate;
        const worker = new Worker(gameId.toString(), processor, { connection: redis });
        worker.on('drained', emitUpdate);
    }

    addPlayer(player: number) {
        this.players.push(player);
    }

    deletePlayer(player: number) {
        const index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }

    async handleEvent(event: Event) {
        this.queue.add('event', event);
        // this.queue.count().then(count => console.log(this.gameId, count));
    }
}