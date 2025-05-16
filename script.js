const board = document.getElementById('board');
const rollBtn = document.getElementById('rollBtn');
const diceResultEl = document.getElementById('diceResult');
const pos1El = document.getElementById('pos1');
const pos2El = document.getElementById('pos2');
const turnIndicator = document.getElementById('turnIndicator');
const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const optionsDiv = document.getElementById('options');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const restartBtn = document.getElementById('restartBtn');

const boardSize = 100;
const cols = 10;
const rows = 10;

let currentPlayer = 1;
let positions = {1: 1, 2: 1};
let isMoving = false;
let questionPoints = [7, 16, 23, 35, 48, 57, 64, 72, 85, 93]; // titik pertanyaan

// Ular dan Tangga dalam format {start: end}
const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

const snakes = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

// Pertanyaan Pilihan Ganda
const questions = [
  {
    question: "Ibukota Indonesia adalah?",
    options: ["Jakarta", "Surabaya", "Bandung", "Medan"],
    answer: 0
  },
  {
    question: "Pulau terbesar di Indonesia?",
    options: ["Sumatra", "Jawa", "Kalimantan", "Sulawesi"],
    answer: 2
  },
  {
    question: "Bahasa resmi negara Indonesia?",
    options: ["Sunda", "Indonesia", "Jawa", "Melayu"],
    answer: 1
  },
  {
    question: "Gunung tertinggi di Indonesia?",
    options: ["Rinjani", "Kerinci", "Semeru", "Puncak Jaya"],
    answer: 3
  },
  {
    question: "Presiden pertama Indonesia?",
    options: ["Soekarno", "Soeharto", "Habibie", "Gus Dur"],
    answer: 0
  },
  {
    question: "Lagu kebangsaan Indonesia?",
    options: ["Indonesia Raya", "Tanah Airku", "Bagimu Negeri", "Garuda Pancasila"],
    answer: 0
  },
  {
    question: "Batik berasal dari?",
    options: ["Jawa Tengah", "Sumatra", "Bali", "Sulawesi"],
    answer: 0
  },
  {
    question: "Komodo ditemukan di pulau?",
    options: ["Komodo", "Flores", "Sumba", "Bali"],
    answer: 0
  },
  {
    question: "Danau terbesar di Indonesia?",
    options: ["Toba", "Sentani", "Maninjau", "Rawa Pening"],
    answer: 0
  },
  {
    question: "Suku terbesar di Indonesia?",
    options: ["Jawa", "Batak", "Bugis", "Minangkabau"],
    answer: 0
  }
];

// Catat pertanyaan yang sudah dijawab pada titik tertentu oleh pemain agar tidak muncul terus
// Format: {point: {player1: true/false, player2: true/false}}
let answeredQuestions = {};

let currentQuestion = null;
let currentQuestionPoint = null;

const pawnSize = 24;
const boardOffset = 3; // border width

// Buat papan 10x10 dengan angka
function createBoard() {
  // Karena pola ular tangga zigzag, kita harus buat pola angka zigzag
  // Baris genap dari kiri ke kanan, ganjil dari kanan ke kiri (dari bawah ke atas)
  for (let row = rows - 1; row >= 0; row--) {
    let isEvenRow = (rows - 1 - row) % 2 === 0;
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      // Hitung nomor kotak
      let num = row * cols + (isEvenRow ? col + 1 : cols - col);
      cell.textContent = num;
      cell.dataset.cell = num;
      board.appendChild(cell);
    }
  }
}

// Posisi pion di pixel berdasarkan nomor kotak
function getCellPosition(cellNumber) {
  // Cari elemen cell dengan data-cell=cellNumber
  let cell = board.querySelector(`.cell[data-cell='${cellNumber}']`);
  if (!cell) return {x: 0, y: 0};
  let rect = cell.getBoundingClientRect();
  let boardRect = board.getBoundingClientRect();

  // Posisi relatif ke board
  return {
    x: cell.offsetLeft + cell.clientWidth / 2 - pawnSize / 2,
    y: cell.offsetTop + cell.clientHeight / 2 - pawnSize / 2
  };
}

// Buat pion pemain
const pawn1 = document.createElement('div');
pawn1.classList.add('player-pawn', 'player1');
pawn1.style.position = 'absolute';
board.appendChild(pawn1);

const pawn2 = document.createElement('div');
pawn2.classList.add('player-pawn', 'player2');
pawn2.style.position = 'absolute';
board.appendChild(pawn2);

// Update posisi pion di papan
function updatePawnsPosition() {
  const pos1 = positions[1];
  const pos2 = positions[2];
  let pos1Coord = getCellPosition(pos1);
  let pos2Coord = getCellPosition(pos2);

  // Offset kecil agar pion tidak menumpuk, player1 di kiri bawah, player2 di kanan atas kotak
  pawn1.style.left = (pos1Coord.x - 8) + 'px';
  pawn1.style.top = (pos1Coord.y + 8) + 'px';

  pawn2.style.left = (pos2Coord.x + 8) + 'px';
  pawn2.style.top = (pos2Coord.y - 8) + 'px';

  pos1El.textContent = pos1;
  pos2El.textContent = pos2;
}

// Animasi pindah pion secara bertahap
function movePawn(player, steps, callback) {
  if (steps <= 0) {
    if (callback) callback();
    return;
  }

  positions[player]++;
  if (positions[player] > boardSize) positions[player] = boardSize;

  updatePawnsPosition();

  setTimeout(() => {
    movePawn(player, steps - 1, callback);
  }, 300);
}

// Cek ular atau tangga dan pindahkan pion sesuai jika ada
function checkSnakeOrLadder(player) {
  let pos = positions[player];
  if (ladders[pos]) {
    positions[player] = ladders[pos];
    updatePawnsPosition();
    alert(`Yeay! Pemain ${player} naik tangga ke kotak ${positions[player]}`);
  } else if (snakes[pos]) {
    positions[player] = snakes[pos];
    updatePawnsPosition();
    alert(`Oh tidak! Pemain ${player} tergigit ular turun ke kotak ${positions[player]}`);
  }
}

// Acak pertanyaan yang belum dijawab di titik tertentu dan tampilkan
function showQuestion(point, player) {
  // Jika sudah dijawab di titik ini oleh pemain ini, langsung skip
  if (answeredQuestions[point] && answeredQuestions[point][`player${player}`]) {
    return false;
  }

  // Pilih pertanyaan acak
  currentQuestion = questions[Math.floor(Math.random() * questions.length)];
  currentQuestionPoint = point;

  questionText.textContent = currentQuestion.question;
  optionsDiv.innerHTML = '';

  currentQuestion.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="radio" name="option" value="${i}"> ${opt}
    `;
    optionsDiv.appendChild(label);
  });

  submitAnswerBtn.disabled = true;
  questionModal.classList.remove('hidden');

  return true;
}

// Tangani input pilihan jawaban
optionsDiv.addEventListener('change', (e) => {
  if (e.target.name === 'option') {
    submitAnswerBtn.disabled = false;
  }
});

// Tangani submit jawaban
submitAnswerBtn.addEventListener('click', () => {
  let selected = optionsDiv.querySelector('input[name="option"]:checked');
  if (!selected) return;

  let answerIdx = parseInt(selected.value);
  const player = currentPlayer;
  let point = currentQuestionPoint;

  if (!answeredQuestions[point]) answeredQuestions[point] = {};
  answeredQuestions[point][`player${player}`] = true;

  if (answerIdx === currentQuestion.answer) {
    // Benar
    alert("Jawaban benar! Kamu tetap di posisi ini.");
    questionModal.classList.add('hidden');
    submitAnswerBtn.disabled = true;
    nextTurn();
  } else {
    // Salah, mundur 3 langkah
    alert("Jawaban salah! Kamu mundur 3 langkah.");
    questionModal.classList.add('hidden');
    submitAnswerBtn.disabled = true;

    positions[player] -= 3;
    if (positions[player] < 1) positions[player] = 1;
    updatePawnsPosition();

    nextTurn();
  }
});

// Tombol lempar dadu
rollBtn.addEventListener('click', () => {
  if (isMoving) return;

  isMoving = true;
  let diceRoll = Math.floor(Math.random() * 6) + 1;
  animateDiceRoll(diceRoll, () => {
    diceResultEl.textContent = diceRoll;
    movePawn(currentPlayer, diceRoll, () => {
      checkSnakeOrLadder(currentPlayer);

      // Cek apakah pemain di titik pertanyaan
      let pos = positions[currentPlayer];
      if (questionPoints.includes(pos)) {
        let hasQuestion = showQuestion(pos, currentPlayer);
        if (!hasQuestion) {
          nextTurn();
          isMoving = false;
        }
      } else {
        // Cek menang
        if (pos === boardSize) {
          showWinner(currentPlayer);
          return;
        }
        nextTurn();
        isMoving = false;
      }
    });
  });
});

// Ganti giliran pemain
function nextTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  turnIndicator.textContent = `Giliran Pemain ${currentPlayer} (${currentPlayer === 1 ? 'Merah' : 'Kuning'})`;
