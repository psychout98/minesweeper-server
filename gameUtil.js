"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionEvent = exports.cascadeReveal = exports.getFlags = exports.revealAll = exports.getEmptyBoard = exports.buildMinefield = exports.Action = void 0;
var Action;
(function (Action) {
    Action[Action["REVEAL"] = 0] = "REVEAL";
    Action[Action["FLAG"] = 1] = "FLAG";
})(Action || (exports.Action = Action = {}));
const buildMinefield = (spaces, bombs, firstSpace) => {
    fillBoardWithBombs(spaces, bombs, firstSpace);
    numberBoard(spaces);
    (0, exports.cascadeReveal)(spaces, firstSpace.y, firstSpace.x);
};
exports.buildMinefield = buildMinefield;
const getEmptyBoard = (width, height) => {
    const board = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            row.push({ y: i, x: j, value: 0, hidden: true, flagged: false });
        }
        board.push(row);
    }
    return board;
};
exports.getEmptyBoard = getEmptyBoard;
const revealAll = (spaces) => {
    spaces.forEach(row => row.forEach(space => {
        space.hidden = false;
    }));
};
exports.revealAll = revealAll;
const fillBoardWithBombs = (board, bombs, firstSpace) => {
    for (let i = 0; i < bombs; i++) {
        let foundSpot = false;
        while (!foundSpot) {
            const row = Math.floor(Math.random() * board.length);
            const col = Math.floor(Math.random() * board[0].length);
            if (board[row][col].value === 0 && !nearFirstSpace(row, col, firstSpace)) {
                board[row][col].value = -1;
                foundSpot = true;
            }
        }
    }
};
const BOX = [-1, 0, 1];
const nearFirstSpace = (row, col, firstSpace) => {
    for (const y of BOX) {
        for (const x of BOX) {
            if (row === firstSpace.y + y && col === firstSpace.x + x) {
                return true;
            }
        }
    }
    return false;
};
const numberBoard = (board) => {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            if (board[i][j].value === 0) {
                board[i][j].value = getNearbyBombs(board, i, j);
            }
        }
    }
};
const getNearbyBombs = (board, row, col) => {
    return BOX.map(y => {
        return BOX.map(x => {
            if (row + y >= 0 && row + y < board.length
                && col + x >= 0 && col + x < board[0].length) {
                return board[row + y][col + x].value;
            }
            return 0;
        }).reduce((partialSum, a) => partialSum + (a === -1 ? 1 : 0), 0);
    }).reduce((partialSum, a) => partialSum + a, 0);
};
const getFlags = (board) => {
    return board.map(row => row.map(space => ((space.value === -1 ? 1 : 0) + (space.flagged ? -1 : 0)))
        .reduce((partialSum, a) => partialSum + a, 0))
        .reduce((partialSum, a) => partialSum + a, 0);
};
exports.getFlags = getFlags;
const cascadeReveal = (board, row, col) => {
    board[row][col].hidden = false;
    if (board[row][col].value === 0) {
        BOX.forEach(y => {
            BOX.forEach(x => {
                if (row + y >= 0 && row + y < board.length
                    && col + x >= 0 && col + x < board[0].length
                    && board[row + y][col + x].hidden) {
                    (0, exports.cascadeReveal)(board, row + y, col + x);
                }
            });
        });
    }
};
exports.cascadeReveal = cascadeReveal;
const actionEvent = (event, board) => {
    const space = event.space;
    const row = space.y;
    const col = space.x;
    const currentSpace = board.spaces[row][col];
    if (space.hidden === currentSpace.hidden && space.flagged === currentSpace.flagged) {
        if (event.action === Action.REVEAL && currentSpace.hidden) {
            if (board.started) {
                if (currentSpace.value === -1) {
                    (0, exports.revealAll)(board.spaces);
                }
                else if (currentSpace.value === 0) {
                    (0, exports.cascadeReveal)(board.spaces, row, col);
                }
                else {
                    currentSpace.hidden = false;
                }
            }
            else {
                (0, exports.buildMinefield)(board.spaces, 99, currentSpace);
                board.started = true;
            }
        }
        if (event.action === Action.FLAG) {
            currentSpace.flagged = !currentSpace.flagged;
        }
    }
};
exports.actionEvent = actionEvent;
