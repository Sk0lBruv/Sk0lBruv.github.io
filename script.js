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

function joinGame() {
  const gamesRef = ref(database, 'games');
  
  // Fetch the list of games from Firebase
  get(gamesRef).then((snapshot) => {
    const games = snapshot.val();
    let found = false;

    // Check if there are any games with only one player (waiting for a second player)
    for (let id in games) {
      if (games[id].players && games[id].players.length === 1) {
        gameId = id;
        player = 'O';  // Join as 'O'
        
        // Add the second player to the game
        const playersRef = ref(database, `games/${gameId}/players`);
        push(playersRef, player).then(() => {
          statusDiv.innerText = "You're playing as O";
        });
        found = true;
        break;
      }
    }

    // If no game found, create a new one
    if (!found) {
      gameId = push(gamesRef, {
        players: ['X'],   // First player is 'X'
        board: Array(9).fill('')  // Empty game board
      }).key;
      player = 'X';  // Join as 'X'
      statusDiv.innerText = "Waiting for opponent...";
    }

    // Start syncing the game
    startGame();
  }).catch((error) => {
    console.error("Error joining/creating game:", error);
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
