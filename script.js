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

  // Fetch all games
  get(gamesRef).then((snapshot) => {
    const games = snapshot.val();
    let found = false;

    // Iterate over all games to find an open one
    for (let id in games) {
      if (games[id].players && games[id].players.length === 1) {
        gameId = id;
        player = 'O';  // Join as player 'O'
        const playersRef = ref(database, `games/${gameId}/players`);
        
        // Add the second player to the game
        push(playersRef, player).then(() => {
          statusDiv.innerText = "You're playing as O";
          console.log("Joined game as O, Game ID:", gameId);
          startGame();
        });

        found = true;
        break;
      }
    }

    // If no open game found, create a new one
    if (!found) {
      gameId = push(gamesRef, {
        players: ['X'],  // Start game as player 'X'
        board: Array(9).fill('')  // Initialize empty board
      }).key;

      player = 'X';  // You're the first player, so you're 'X'
      statusDiv.innerText = "Waiting for opponent...";
      console.log("Created new game as X, Game ID:", gameId);
      startGame();
    }
  }).catch((error) => {
    console.error("Error joining/creating game:", error);
  });
}



function startGame() {
  const gameRef = ref(database, `games/${gameId}`);

  // Listen for real-time changes to the game state
  onValue(gameRef, (snapshot) => {
    const gameData = snapshot.val();
    const board = gameData.board;
    const players = gameData.players;

    console.log("Current game data:", gameData);

    // Update the game board in the UI
    cells.forEach((cell, index) => {
      cell.innerText = board[index];
    });

    // If both players are in the game, start
    if (players.length === 2) {
      if (currentPlayer === 'X') {
        statusDiv.innerText = "Player X's turn";
      } else {
        statusDiv.innerText = "Player O's turn";
      }
    } else {
      statusDiv.innerText = "Waiting for another player...";
    }

    // Check if there’s a winner
    if (checkWinner(board)) {
      statusDiv.innerText = `Player ${currentPlayer} wins!`;
    } else if (board.every(cell => cell)) {
      statusDiv.innerText = "It's a draw!";
    }
  });
}


// Making a move
function makeMove(index) {
  const gameRef = ref(database, `games/${gameId}`);

  get(gameRef).then((snapshot) => {
    const gameData = snapshot.val();
    const board = gameData.board;

    // Make sure the selected cell is empty and it's the current player's turn
    if (!board[index] && currentPlayer === player) {
      board[index] = player;
      
      // Update the board in Firebase
      update(gameRef, { board }).then(() => {
        // Switch turn to the next player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      });
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
