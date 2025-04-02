import { Server } from "socket.io";
import { Space, Event, getEmptyBoard, actionEvent } from "./gameUtil";

export default class Game {

    started: boolean;
    board: Space[][];
    players: string[];
    queue: Event[];
    processing: boolean;
    io: Server;
    gameId: string;

    constructor(io: Server, gameId: string, player: string) {
        this.io = io;
        this.gameId = gameId;
        this.started = false;
        this.board = getEmptyBoard(30, 16);
        this.queue = [];
        this.players = [player];
        this.processing = false;
    }

    deletePlayer(player: string) {
        const index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }

    handleEvent(event: Event) {
        this.queue.push(event);
        this.processQueue();
    }

    async processQueue() {
        if (!this.processing) {
            this.processing = true;
            while (this.queue.length > 0) {
                const top = this.queue[0];
                actionEvent(top, this.board, this.started);
                this.queue.splice(0, 1);
            }
            this.processing = false;
            this.io.to(this.gameId).emit('receiveBoard', this.board);
        }
    }
}