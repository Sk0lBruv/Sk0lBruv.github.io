// Import the Firebase SDK modules you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, push, update } from "firebase/database";

// Firebase configuration (as you already have it)
const firebaseConfig = {
  apiKey: "AIzaSyDh3qC7snYmSaeAsZguZwm-7aydApaSJkQ",
  authDomain: "noughtsandcrossesmultiplayer.firebaseapp.com",
  databaseURL: "https://noughtsandcrossesmultiplayer-default-rtdb.firebaseio.com",  // Database URL
  projectId: "noughtsandcrossesmultiplayer",
  storageBucket: "noughtsandcrossesmultiplayer.appspot.com",
  messagingSenderId: "55215740647",
  appId: "1:55215740647:web:01dff1479dce0078703442",
  measurementId: "G-J57P0Q6KVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let player = null;
let gameId = null;
let currentPlayer = 'X';
const cells = document.querySelectorAll('.cell');
const statusDiv = document.getElementById('status');

// Join or create a game session
function joinGame() {
  const gamesRef = ref(database, 'games');
  
  get(gamesRef).then((snapshot) => {
    const games = snapshot.val();
    let found = false;

    // Check for an available game to join
    for (let id in games) {
      if (games[id].players.length === 1) {
        gameId = id;
        player = 'O';
        const playersRef = ref(database, `games/${id}/players`);
        push(playersRef, player);
        statusDiv.innerText = "You're playing as O";
        found = true;
        break;
      }
    }

    // If no available game, create a new one
    if (!found) {
      gameId = push(gamesRef, { players: ['X'], board: Array(9).fill('') }).key;
      player = 'X';
      statusDiv.innerText = "Waiting for opponent...";
    }

    startGame();
  });
}

// Game logic
function startGame() {
  const gameRef = ref(database, `games/${gameId}`);

  // Sync moves in real-time
  onValue(gameRef, (snapshot) => {
    const gameData = snapshot.val();
    const board = gameData.board;

    // Update the game board in the UI
    cells.forEach((cell, index) => {
      cell.innerText = board[index];
    });

    // Check if we have a winner
    if (checkWinner(board)) {
      statusDiv.innerText = `Player ${currentPlayer} wins!`;
    } else if (board.every(cell => cell)) {
      statusDiv.innerText = "It's a draw!";
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      statusDiv.innerText = `Player ${currentPlayer}'s turn`;
    }
  });

  // Handle clicking on a cell
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      if (!cell.innerText && currentPlayer === player) {
        const index = cell.getAttribute('data-index');
        makeMove(index);
      }
    });
  });
}

// Making a move
function makeMove(index) {
  const gameRef = ref(database, `games/${gameId}`);
  
  get(gameRef).then((snapshot) => {
    const gameData = snapshot.val();
    const board = gameData.board;

    // If the cell is empty, make the move
    if (!board[index]) {
      board[index] = player;
      update(gameRef, { board });
    }
  });
}

// Check for a winner
function checkWinner(board) {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  return winningCombinations.some(combination => {
    return combination.every(index => board[index] === currentPlayer);
  });
}

// Initialize the game
joinGame();
