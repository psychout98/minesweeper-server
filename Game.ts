import { Server } from "socket.io";
import { Board, Event, getEmptyBoard, actionEvent } from "./gameUtil";
import { Queue, Worker } from 'bullmq';
import Redis from "ioredis";

export class Game {

    board: Board;
    players: string[];
    processing: boolean;
    io: Server;
    gameId: string;
    queue: Queue;
    worker: Worker;

    constructor(io: Server, gameId: string, playerId: string, connection: Redis) {
        this.io = io;
        this.gameId = gameId;
        this.board = {
            started: false,
            spaces: getEmptyBoard(30, 16)
        };
        this.players = [playerId];
        this.processing = false;
        this.queue = new Queue(gameId.toString(), { connection });
        this.worker = new Worker(gameId.toString(), async job => actionEvent(job.data, this.board), { connection });
        this.worker.on('drained', this.emitBoard)
    }

    addPlayer(player: string) {
        this.players.push(player);
    }

    deletePlayer(player: string) {
        const index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }

    async handleEvent(event: Event) {
        this.queue.add('event', event);
    }

    reset() {
        this.board = {
            started: false,
            spaces: getEmptyBoard(30, 16)
        };
        this.emitBoard();
    }

    async emitBoard() {
        this.io.to(this.gameId).emit('receiveBoard');
    }
}