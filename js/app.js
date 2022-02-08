const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GAMER = 'GAMER';
const GLUE = 'GLUE';



const GAMER_IMG = '<img src="img/gamer.png">';
const BALL_IMG = '<img src="img/ball.png">';
const GLUE_IMG = '<img src="img/candy.png">';


// Model:
var gBoard;
var gGamerPos;
var gBallInterval;
var gSecIntervalId;
var gTotalBallsOnBoard;
var gCollected;
var gIsGlued;

var gElGameOver = document.querySelector('.game-over');

function initGame() {
	gIsGlued = false;
	gTotalBallsOnBoard = 2;
	gCollected = 0;
	gGamerPos = { i: 2, j: 9 };
	gBoard = buildBoard();
	renderBoard(gBoard);
	addMoreBalls();
	collectedBalls();
	addGlueToBoard();
	// clearGlueInt();
	gElGameOver.hidden = true;
}

function buildBoard() {
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

	console.table(board);
	return board;
}

// Render the board to an HTML table
function renderBoard(board) {

	var elBoard = document.querySelector('.board');
	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];

			var cellClass = getClassName({ i: i, j: j }); // cell-i-j

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
	// console.log('strHTML is:');
	// console.log(strHTML);
	elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
	if (gIsGlued) return;

	var targetCell = gBoard[i][j];

	// { type:WALL, gameElement:null }
	if (targetCell.type === WALL) return;

	// Calculate distance to make sure we are moving to a neighbor cell
	var iAbsDiff = Math.abs(i - gGamerPos.i); // 1-2 = -1 === 1
	var jAbsDiff = Math.abs(j - gGamerPos.j);

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0)
		|| (gGamerPos.i === 5 && gGamerPos.j === 0) || (gGamerPos.i === 5 && gGamerPos.j === 11)
		|| (gGamerPos.i === 0 && gGamerPos.j === 5) || (gGamerPos.i === 9 && gGamerPos.j === 5)) {
		if (targetCell.gameElement === BALL) {
			console.log('Collecting!');
			gCollected++;
			collectSound();
			collectedBalls();

			if (gTotalBallsOnBoard === gCollected) gameOver();
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

		// update game pos
		gGamerPos = { i: i, j: j };

		// MODEL
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

		// DOM
		renderCell(gGamerPos, GAMER_IMG);

	} else console.log('TOO FAR', iAbsDiff, jAbsDiff);

}

// Convert a location object {i, j} to a selector and render a value in that element

// .cell-0-0
function renderCell(location, value) {
	var cellSelector = '.' + getClassName(location);
	var elCell = document.querySelector(cellSelector);
	elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function handleKey(event) {

	var i = gGamerPos.i;
	var j = gGamerPos.j;

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

// Returns the class name for a specific cell
function getClassName(location) {
	var cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}





// Add support for gameElement GLUE, when user steps on GLUE he cannot move for 3 seconds.
// GLUE is added to board every 5 seconds and gone after 3 seconds.


function addGlueToBoard() {
	gSecIntervalId = setInterval(addGlueToRandCell, 5000);
}

function clearGlueInt() {
	clearInterval(gSecIntervalId);
	gSecIntervalId = null
}

function addGlueToRandCell() {

	var emptyCells = getEmptyCells()
	if (!emptyCells.length) return

	var randIdx = getRandomInt(0, emptyCells.length - 1)
	var cellLoc = emptyCells[randIdx];
	var cell = gBoard[cellLoc.i][cellLoc.j]
	cell.gameElement = GLUE;

	renderCell({ i: cellLoc.i, j: cellLoc.j }, GLUE_IMG);

	setTimeout(() => {
		if (cell.gameElement === GLUE) {
			cell.gameElement = null;
			renderCell({ i: cellLoc.i, j: cellLoc.j }, '');
		}
	}, 3000);
}



// Game over when all are balls collected + restart button
function gameOver() {
	stopAddingBalls();
	clearGlueInt();

	gElGameOver.hidden = false;
}


// Show how many balls were collected
function collectedBalls() {
	var elBalls = document.querySelector('.balls span');
	elBalls.innerText = gCollected;
}


//play a sound when gamer collects a ball
function collectSound() {
	var collect = new Audio('sounds/collect.wav');
	collect.play();
}


// Every few seconds a new ball is added in a random empty cell
function addMoreBalls() {
	gBallInterval = setInterval(newBall, 1200);
}

function stopAddingBalls() {
	clearInterval(gBallInterval);
	gBallInterval = null;
}

function newBall() {
	var emptyCells = getEmptyCells()
	if (!emptyCells.length) return

	var randIdx = getRandomInt(0, emptyCells.length - 1)
	var cellLoc = emptyCells[randIdx];
	var cell = gBoard[cellLoc.i][cellLoc.j]
	cell.gameElement = BALL;
	gTotalBallsOnBoard++;

	renderCell({ i: cellLoc.i, j: cellLoc.j }, BALL_IMG);
}

function getEmptyCells() {
	var res = [];
	for (var i = 0; i < gBoard.length; i++) {
		for (var j = 0; j < gBoard[0].length; j++) {
			var loc = { i: i, j: j }
			var currCell = gBoard[i][j];
			if (currCell.type === FLOOR && !currCell.gameElement) res.push(loc);
		}
	}
	return res;
}