import { Server } from "socket.io";
import { Action, Space, buildMinefield, cascadeReveal, Event, getEmptyBoard, revealAll } from "./gameUtil";

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
                this.actionEvent(top);
                this.queue.splice(0, 1);
            }
            this.processing = false;
            this.io.to(this.gameId).emit('receiveBoard', this.board);
        }
    }

    actionEvent(event: Event) {
        const space = event.space;
        const row = space.y;
        const col = space.x;
        const currentSpace = this.board[row][col];
        if (space.hidden === currentSpace.hidden && space.flagged === currentSpace.flagged) {
            if (event.action === Action.REVEAL && currentSpace.hidden) {
                if (this.started) {
                    if (currentSpace.value === -1) {
                        revealAll(this.board);
                    } else if (currentSpace.value === 0) {
                        cascadeReveal(this.board, row, col);
                    } else {
                        currentSpace.hidden = false;
                    }
                } else {
                    buildMinefield(this.board, 99, currentSpace);
                }
            }
            if (event.action === Action.FLAG) {
                currentSpace.flagged = !currentSpace.flagged;
            }
        }
    }
}