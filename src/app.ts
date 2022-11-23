const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GAMER = 'GAMER';
const GLUE = 'GLUE';



const GAMER_IMG = '<img src="img/gamer.png">';
const BALL_IMG = '<img src="img/ball.png">';
const GLUE_IMG = '<img src="img/candy.png">';


// Model:
let gBoard: Board
let gGamerPos: CellLocation;
let gBallIntervalId: number | undefined;
let gGlueIntervalId: number | undefined;
let gTimerIntervalId: number | undefined;
let gTotalBallsOnBoard: number =0
let gMoveCount: number = 0;
let gCollected: number = 0;
let gIsGlued:boolean = false;
let gIsGameActive:boolean = false
let gTime:number;

let gElPlayAgain:ActionDiv  = document.querySelector('.play-again');
let gElGameOver:ActionDiv = document.querySelector('.game-over');


// Types
type CellLocation = { i: number, j: number };
type Board = {type:string, gameElement:string|null}[][];
type ActionDiv = HTMLDivElement | null;


const gameData ={

}



function initGame() {
	gIsGameActive = true;
	gIsGlued = false;
	gTotalBallsOnBoard = 2;
	gMoveCount = 0;
	gCollected = 0;
	gGamerPos = { i: 2, j: 9 };
	gBoard = buildBoard();
	startTimeCount(gTime = 0);
	renderBoard(gBoard);
	addMoreBalls();
	renderMoveCount();
	renderCollectedBalls();
	addGlueToBoard();
	// clearGlueInt();

    if (!gElPlayAgain ){
        throw new Error('gElPlayAgain is null')
    }

    if (!gElGameOver){
        throw new Error('gElGameOver is null')
    }

	gElPlayAgain.hidden = true;
	gElGameOver.hidden = true;
}


function buildBoard(): Board{
	// Create the Matrix 10 * 12 
	var board = createMat(10, 12);
	// Put FLOOR everywhere and WALL at edges
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

	// Place the gamer and two balls
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
	board[2][6].gameElement = BALL;
	board[3][3].gameElement = BALL;

	// console.table(board);
	return board;
}

// Render the board to an HTML table
function renderBoard(board: Board) {

	const elBoard = document.querySelector('.board')

	let strHTML = '';

	for (let i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (let j = 0; j < board[0].length; j++) {
			const currCell = board[i][j];

			let cellClass = getCellClassName({ i: i, j: j }); // cell-i-j

			if (currCell.type === FLOOR) cellClass += ' floor';
			else if (currCell.type === WALL) cellClass += ' wall';

			strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})" >\n`;

			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG;
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG;
			}

			strHTML += '\t</td>\n';
		}
		strHTML += '</tr>\n';
	}
	// console.log("board", board);
	// console.log('strHTML is:');
	// console.log(strHTML);
 
    if (!(elBoard instanceof HTMLTableSectionElement)){
        throw new Error('elBoard is not a HTMLTableSectionElement');
    }

	elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i:number, j:number) {
	if (!gIsGameActive) return;
	if (gIsGlued) return;

	const targetCell = gBoard[i][j];

	// { type:WALL, gameElement:null }
	if (targetCell.type === WALL) return;

	// Calculate distance to make sure we are moving to a neighbor cell
	const iAbsDiff = Math.abs(i - gGamerPos.i); // 1-2 = -1 === 1
	const jAbsDiff = Math.abs(j - gGamerPos.j);

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0)
		|| (gGamerPos.i === 5 && gGamerPos.j === 0) || (gGamerPos.i === 5 && gGamerPos.j === 11)
		|| (gGamerPos.i === 0 && gGamerPos.j === 5) || (gGamerPos.i === 9 && gGamerPos.j === 5)) {
		if (targetCell.gameElement === BALL) {
			// console.log('Collecting!');
			gCollected++;
			playCollectSound();
			renderCollectedBalls();

			if (gTotalBallsOnBoard === gCollected) playerWon();
		}

		if (targetCell.gameElement === GLUE) {
			gIsGlued = true
			setTimeout(() => {
				gIsGlued = false
			}, 3000);
		}


		// TODO: Move the gamer
		// MODEL
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;

		// DOM
		renderCell(gGamerPos, '');

		// update game pos and moves
		gGamerPos = { i: i, j: j };
		gMoveCount++;

		// MODEL
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

		// DOM
		renderCell(gGamerPos, GAMER_IMG);
		renderMoveCount()

	} else console.log('TOO FAR', iAbsDiff, jAbsDiff);

}


// Move the player by keyboard arrows
function handleKey(event: KeyboardEvent) {

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

// Show how many moves were made
function renderMoveCount() {
	const elMoves = document.querySelector('.moves span');

    if (!(elMoves instanceof HTMLSpanElement)){
        throw new Error('moves element is not an HTMLSPanElement')
    }

	elMoves.innerText = gMoveCount.toString();
}



// Convert a location object {i, j} to a selector and render a value in that element

// .cell-0-0
function renderCell(location: CellLocation, value: string) {
	const cellSelector = '.' + getCellClassName(location);
	const elCell = document.querySelector(cellSelector);
   
    if (!(elCell instanceof HTMLTableCellElement)){
    throw new Error('elCell is not a HTMLTableCellElement')
    }
    elCell.innerHTML = value;
}

// Returns the class name for a specific cell
function getCellClassName(location : CellLocation) {
	const cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}





// Add support for gameElement GLUE, when user steps on GLUE he cannot move for 3 seconds.
// GLUE is added to board every 5 seconds and gone after 3 seconds.


function addGlueToBoard() {
	gGlueIntervalId = setInterval(addGlueToRandCell, 5000);
}

function clearGlueInt() {
	clearInterval(gGlueIntervalId);
}

function addGlueToRandCell() {

	const currLocation = getEmptyCellLocation()

    if (!currLocation){
        throw new Error('no empty location available for adding glue')
    }

	const cell = gBoard[currLocation.i][currLocation.j]
	cell.gameElement = GLUE;

	renderCell({ i: currLocation.i, j: currLocation.j }, GLUE_IMG);

	setTimeout(() => {
		if (cell.gameElement === GLUE) {
			cell.gameElement = null;
			renderCell({ i: currLocation.i, j: currLocation.j }, '');
		}
	}, 2500);
}


// Player won the game when all balls are collected + play again button
function playerWon() {
	gIsGameActive = false;
	endTimeCount();
	stopAddingBalls();
	clearGlueInt();

    if (!(gElPlayAgain instanceof HTMLDivElement)){
        throw new Error('gElPlayAgain is not an HTMLDivElement')
    }

	gElPlayAgain.hidden = false;
}

function gameOver() {
	gIsGameActive = false;
	endTimeCount();
	stopAddingBalls();
	clearGlueInt();

    if (!(gElGameOver instanceof HTMLDivElement)){
        throw new Error('gElGameOver is not an HTMLDivElement')
    }

	gElGameOver.hidden = false;
}


//play a sound when gamer collects a ball
function playCollectSound() {
	const collect = new Audio('sounds/collect.wav');
	collect.play();
}

// Show how many balls were collected
function renderCollectedBalls() {
	const elBalls = document.querySelector('.balls span');
    if (!elBalls){
        throw new Error('no balls span')
    }

    if (!(elBalls instanceof HTMLSpanElement)){
        throw new Error('balls element is not an HTMLSPanElement')
    }
    
    elBalls.innerText = gCollected.toString();    
}

// Every few seconds a new ball is added in a random empty cell
function addMoreBalls() {
	gBallIntervalId = setInterval(newBall, 400);
}

function stopAddingBalls() {
	clearInterval(gBallIntervalId);
}

function newBall() {
	const currLocation = getEmptyCellLocation()

    if (!currLocation){
        throw new Error('no empty location available for new ball')
    }

	const cell = gBoard[currLocation.i][currLocation.j]
	cell.gameElement = BALL;
	gTotalBallsOnBoard++;

	// console.log("cell:", cell, "cellLoc:", currLocation);

	renderCell({ i: currLocation.i, j: currLocation.j }, BALL_IMG);
}


function getEmptyCellLocation() {
	const emptyCellLocs = getEmptyCellLocations()
	if (emptyCellLocs.length)  {
		const randIdx = getRandomInt(0, emptyCellLocs.length - 1)
		const randomEmptyCellLocation = emptyCellLocs[randIdx];
		// const cell = gBoard[cellLoc.i][cellLoc.j]
		return randomEmptyCellLocation 
	} else gameOver()
}


function getEmptyCellLocations() {
	const res = [] as CellLocation[]
	for (let i = 0; i < gBoard.length; i++) {
		for (let j = 0; j < gBoard[0].length; j++) {
			const loc = { i: i, j: j }
			const currCell = gBoard[i][j];
			if (currCell.type === FLOOR && !currCell.gameElement) res.push(loc);
		}
	}
	return res;
}


function startTimeCount(gTime:number) {
	if (gIsGameActive) {
		gTimerIntervalId = setInterval(() => {
			gTime++;
			renderTime(gTime);
		}, 1000);
	}
}

function endTimeCount() {
	clearInterval(gTimerIntervalId);
}

function renderTime(gTime:number) {
	const elTime = document.querySelector('.timer span');
    // if (!elTime){
    //     throw new Error('no time span')
    // }
    
    if (!(elTime instanceof HTMLSpanElement)){
        throw new Error('time element is not an HTMLSPanElement')
    }

    elTime.innerText = formatTime(gTime);
}
