"use strict";
const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GAMER = 'GAMER';
const GLUE = 'GLUE';
const GAMER_IMG = '<img src="img/gamer.png">';
const BALL_IMG = '<img src="img/ball.png">';
const GLUE_IMG = '<img src="img/candy.png">';
let gBoard;
let gGamerPos;
let gBallIntervalId;
let gGlueIntervalId;
let gTimerIntervalId;
let gTotalBallsOnBoard = 0;
let gMoveCount = 0;
let gCollected = 0;
let gIsGlued = false;
let gIsGameActive = false;
let gTime;
let gElPlayAgain = document.querySelector('.play-again');
let gElGameOver = document.querySelector('.game-over');
const gameData = {};
function initGame() {
    gIsGameActive = true;
    startTimeCount(gTime = 0);
    gIsGlued = false;
    gTotalBallsOnBoard = 2;
    gMoveCount = 0;
    gCollected = 0;
    gGamerPos = { i: 2, j: 9 };
    gBoard = buildBoard();
    renderBoard(gBoard);
    addMoreBalls();
    renderMoveCount();
    renderCollectedBalls();
    addGlueToBoard();
    if (!gElPlayAgain) {
        throw new Error('gElPlayAgain is null');
    }
    if (!gElGameOver) {
        throw new Error('gElGameOver is null');
    }
    gElPlayAgain.hidden = true;
    gElGameOver.hidden = true;
}
function buildBoard() {
    var board = createMat(10, 12);
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = { type: FLOOR, gameElement: null };
            if (i === 0 || j === 0 || i === board.length - 1 || j === board[0].length - 1) {
                cell.type = WALL;
            }
            board[i][j] = cell;
        }
    }
    board[5][0] = board[5][11] = board[0][5] = board[9][5] = { type: FLOOR, gameElement: null };
    board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
    board[2][6].gameElement = BALL;
    board[3][3].gameElement = BALL;
    return board;
}
function renderBoard(board) {
    const elBoard = document.querySelector('.board');
    let strHTML = '';
    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (let j = 0; j < board[0].length; j++) {
            const currCell = board[i][j];
            let cellClass = getCellClassName({ i: i, j: j });
            if (currCell.type === FLOOR)
                cellClass += ' floor';
            else if (currCell.type === WALL)
                cellClass += ' wall';
            strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})" >\n`;
            if (currCell.gameElement === GAMER) {
                strHTML += GAMER_IMG;
            }
            else if (currCell.gameElement === BALL) {
                strHTML += BALL_IMG;
            }
            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }
    if (!(elBoard instanceof HTMLTableSectionElement)) {
        throw new Error('elBoard is not a HTMLTableSectionElement');
    }
    elBoard.innerHTML = strHTML;
}
function moveTo(i, j) {
    if (!gIsGameActive)
        return;
    if (gIsGlued)
        return;
    const targetCell = gBoard[i][j];
    if (targetCell.type === WALL)
        return;
    const iAbsDiff = Math.abs(i - gGamerPos.i);
    const jAbsDiff = Math.abs(j - gGamerPos.j);
    if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0)
        || (gGamerPos.i === 5 && gGamerPos.j === 0) || (gGamerPos.i === 5 && gGamerPos.j === 11)
        || (gGamerPos.i === 0 && gGamerPos.j === 5) || (gGamerPos.i === 9 && gGamerPos.j === 5)) {
        if (targetCell.gameElement === BALL) {
            gCollected++;
            playCollectSound();
            renderCollectedBalls();
            if (gTotalBallsOnBoard === gCollected)
                playerWon();
        }
        if (targetCell.gameElement === GLUE) {
            gIsGlued = true;
            setTimeout(() => {
                gIsGlued = false;
            }, 3000);
        }
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
        renderCell(gGamerPos, '');
        gGamerPos = { i: i, j: j };
        gMoveCount++;
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
        renderCell(gGamerPos, GAMER_IMG);
        renderMoveCount();
    }
    else
        console.log('TOO FAR', iAbsDiff, jAbsDiff);
}
function handleKey(event) {
    const i = gGamerPos.i;
    const j = gGamerPos.j;
    switch (event.key) {
        case 'ArrowLeft':
            (i === 5 && j === 0) ? moveTo(5, 11) : moveTo(i, j - 1);
            break;
        case 'ArrowRight':
            (i === 5 && j === 11) ? moveTo(5, 0) : moveTo(i, j + 1);
            break;
        case 'ArrowUp':
            (i === 0 && j === 5) ? moveTo(9, 5) : moveTo(i - 1, j);
            break;
        case 'ArrowDown':
            (i === 9 && j === 5) ? moveTo(0, 5) : moveTo(i + 1, j);
            break;
    }
}
function renderMoveCount() {
    const elMoves = document.querySelector('.moves span');
    if (!(elMoves instanceof HTMLSpanElement)) {
        throw new Error('moves element is not an HTMLSPanElement');
    }
    elMoves.innerText = gMoveCount.toString();
}
function renderCell(location, value) {
    const cellSelector = '.' + getCellClassName(location);
    const elCell = document.querySelector(cellSelector);
    if (!(elCell instanceof HTMLTableCellElement)) {
        throw new Error('elCell is not a HTMLTableCellElement');
    }
    elCell.innerHTML = value;
}
function getCellClassName(location) {
    const cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}
function addGlueToBoard() {
    gGlueIntervalId = setInterval(addGlueToRandCell, 5000);
}
function clearGlueInt() {
    clearInterval(gGlueIntervalId);
}
function addGlueToRandCell() {
    const currLocation = getEmptyCellLocation();
    if (!currLocation) {
        throw new Error('no empty location available for adding glue');
    }
    const cell = gBoard[currLocation.i][currLocation.j];
    cell.gameElement = GLUE;
    renderCell({ i: currLocation.i, j: currLocation.j }, GLUE_IMG);
    setTimeout(() => {
        if (cell.gameElement === GLUE) {
            cell.gameElement = null;
            renderCell({ i: currLocation.i, j: currLocation.j }, '');
        }
    }, 2500);
}
function playerWon() {
    gIsGameActive = false;
    endTimeCount();
    stopAddingBalls();
    clearGlueInt();
    if (!(gElPlayAgain instanceof HTMLDivElement)) {
        throw new Error('gElPlayAgain is not an HTMLDivElement');
    }
    gElPlayAgain.hidden = false;
}
function gameOver() {
    gIsGameActive = false;
    endTimeCount();
    stopAddingBalls();
    clearGlueInt();
    if (!(gElGameOver instanceof HTMLDivElement)) {
        throw new Error('gElGameOver is not an HTMLDivElement');
    }
    gElGameOver.hidden = false;
}
function playCollectSound() {
    const collect = new Audio('sounds/collect.wav');
    collect.play();
}
function renderCollectedBalls() {
    const elBalls = document.querySelector('.balls span');
    if (!elBalls) {
        throw new Error('no balls span');
    }
    if (!(elBalls instanceof HTMLSpanElement)) {
        throw new Error('balls element is not an HTMLSPanElement');
    }
    elBalls.innerText = gCollected.toString();
}
function addMoreBalls() {
    gBallIntervalId = setInterval(newBall, 400);
}
function stopAddingBalls() {
    clearInterval(gBallIntervalId);
}
function newBall() {
    const currLocation = getEmptyCellLocation();
    if (!currLocation) {
        throw new Error('no empty location available for new ball');
    }
    const cell = gBoard[currLocation.i][currLocation.j];
    cell.gameElement = BALL;
    gTotalBallsOnBoard++;
    renderCell({ i: currLocation.i, j: currLocation.j }, BALL_IMG);
}
function getEmptyCellLocation() {
    const emptyCellLocs = getEmptyCellLocations();
    if (emptyCellLocs.length) {
        const randIdx = getRandomInt(0, emptyCellLocs.length - 1);
        const randomEmptyCellLocation = emptyCellLocs[randIdx];
        return randomEmptyCellLocation;
    }
    else
        gameOver();
}
function getEmptyCellLocations() {
    const res = [];
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            const loc = { i: i, j: j };
            const currCell = gBoard[i][j];
            if (currCell.type === FLOOR && !currCell.gameElement)
                res.push(loc);
        }
    }
    return res;
}
function startTimeCount(gTime) {
    if (gIsGameActive) {
        renderTime(gTime);
        gTimerIntervalId = setInterval(() => {
            gTime++;
            renderTime(gTime);
        }, 1000);
    }
}
function endTimeCount() {
    clearInterval(gTimerIntervalId);
}
function renderTime(gTime) {
    const elTime = document.querySelector('.timer span');
    if (!(elTime instanceof HTMLSpanElement)) {
        throw new Error('time element is not an HTMLSPanElement');
    }
    elTime.innerText = formatTime(gTime);
}
