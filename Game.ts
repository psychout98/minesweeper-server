import { Server } from "socket.io";
import { Board, Event, getEmptyBoard, actionEvent } from "./gameUtil";

export class Game {

    board: Board;
    players: string[];
    queue: Event[];
    processing: boolean;
    io: Server;
    gameId: string;

    constructor(io: Server, gameId: string, playerId: string) {
        this.io = io;
        this.gameId = gameId;
        this.board = {
            started: false,
            spaces: getEmptyBoard(30, 16)
        };
        this.queue = [];
        this.players = [playerId];
        this.processing = false;
    }

    addPlayer(player: string) {
        this.players.push(player);
    }

    deletePlayer(player: string) {
        const index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }

    async handleEvent(event: Event) {
        this.queue.push(event);
        this.processQueue();
    }

    async processQueue() {
        if (!this.processing) {
            const callbacks: Function[] = [];
            const playerIds: string[] = [];
            this.processing = true;
            while (this.queue.length > 0) {
                const top = this.queue[0];
                callbacks.push(top.callback);
                playerIds.push(top.playerId.toString());
                actionEvent(top, this.board);
                this.queue.splice(0, 1);
            }
            this.processing = false;
            callbacks.forEach(f => f(this.board));
            this.emitBoard(playerIds);
        }
    }

    reset(playerId: number) {
        this.board = {
            started: false,
            spaces: getEmptyBoard(30, 16)
        };
        this.emitBoard([playerId.toString()]);
    }

    async emitBoard(playerIds: string[] = []) {
        this.io.to(this.gameId).except(playerIds).emit('receiveBoard', this.board);
    }
}