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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const gameUtil_1 = require("./gameUtil");
class Game {
    constructor(io, gameId, player) {
        this.io = io;
        this.gameId = gameId;
        this.board = {
            started: false,
            spaces: (0, gameUtil_1.getEmptyBoard)(30, 16)
        };
        this.queue = [];
        this.players = [player];
        this.processing = false;
        this.emitBoard();
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
            this.queue.push(event);
            this.processQueue();
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.processing) {
                this.processing = true;
                while (this.queue.length > 0) {
                    const top = this.queue[0];
                    (0, gameUtil_1.actionEvent)(top, this.board);
                    this.queue.splice(0, 1);
                }
                this.processing = false;
                this.emitBoard();
            }
        });
    }
    reset() {
        this.board = {
            started: false,
            spaces: (0, gameUtil_1.getEmptyBoard)(30, 16)
        };
        this.emitBoard();
    }
    emitBoard() {
        this.io.to(this.gameId).emit('receiveBoard', this.board);
    }
}
exports.Game = Game;
