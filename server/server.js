/**
 * エアホッケーゲームサーバー (簡略版)
 * 認証・ホワイトリスト・バン機能なし
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { RigidBody, CollisionDetector, PhysicsEngine } = require('./physics');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 静的ファイル提供（オプション）
app.use(express.static('../client'));

app.get('/', (req, res) => {
  res.send('Air Hockey Server is running!');
});

// ゲーム定数
const PADDLE_MASS = 2.5;
const PUCK_MASS = 1.0;
const PADDLE_ACCELERATION = 7500.0;
const PADDLE_DRAG = 2.0;
const PADDLE_FRICTION = 0.9;
const PUCK_FRICTION = 0.998;
const WIN_SCORE = 5;
const ANGULAR_ACCELERATION = 48.0;
const MAX_SPIN_SPEED = 8.0 * Math.PI;
const PUCK_SPIN_DRAG = 0.03;
const PUCK_SPIN_FRICTION = 0.995;
const PADDLE_SPIN_DRAG = 0.12;
const PADDLE_SPIN_FRICTION = 0.97;
const MAGNUS_FORCE_COEF = 0.13;

const physics = new PhysicsEngine();

// ゲーム状態
let gameState = createInitialState();
let players = [null, null]; // Socket IDs
let playerNames = ['', ''];
let waitingQueue = [];
let allClients = {};

// フェーズタイマー
let readyPhaseStart = null;
let gameoverPhaseStart = null;
const READY_TIMEOUT = 20;
const GAMEOVER_TIMEOUT = 20;

function createInitialState() {
  return {
    puck: {
      x: 400, y: 300, vx: 0, vy: 0, radius: 15,
      spin: 0.0, spinAngle: 0.0
    },
    paddle1: {
      x: 100, y: 300, vx: 0, vy: 0,
      targetX: 100, targetY: 300, radius: 30,
      spin: 0.0, spinAngle: 0.0, spinDirection: 0
    },
    paddle2: {
      x: 700, y: 300, vx: 0, vy: 0,
      targetX: 700, targetY: 300, radius: 30,
      spin: 0.0, spinAngle: Math.PI, spinDirection: 0
    },
    score1: 0,
    score2: 0,
    phase: 'waiting_players',
    countdown: -1,
    readyCountdown: -1,
    gameoverCountdown: -1,
    ready1: false,
    ready2: false,
    goalScorer: 0,
    winner: 0,
    player1Name: '',
    player2Name: '',
    isDeuce: false,
    player1Reach: false,
    player2Reach: false
  };
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  allClients[socket.id] = {
    socket: socket,
    seat: 'spectator',
    nickname: ''
  };

  // ニックネーム受信
  socket.on('nickname', (data) => {
    const nickname = data.nickname.substring(0, 12);
    allClients[socket.id].nickname = nickname;

    // 座席割り当て
    let seat = 'spectator';
    if (players[0] === null) {
      players[0] = socket.id;
      playerNames[0] = nickname;
      seat = 1;
    } else if (players[1] === null) {
      players[1] = socket.id;
      playerNames[1] = nickname;
      seat = 2;
    } else {
      waitingQueue.push(socket.id);
    }

    allClients[socket.id].seat = seat;
    socket.emit('seat', { seat, nickname });

    console.log(`${nickname} joined as ${seat === 'spectator' ? 'spectator' : `Player${seat}`}`);

    // 2人揃ったらゲーム開始準備
    if (players[0] && players[1] && gameState.phase === 'waiting_players') {
      gameState.phase = 'ready';
      gameState.ready1 = false;
      gameState.ready2 = false;
      readyPhaseStart = Date.now();
      gameState.readyCountdown = READY_TIMEOUT;
    }
  });

  // 移動
  socket.on('move', (data) => {
    const clientInfo = allClients[socket.id];
    if (!clientInfo || clientInfo.seat === 'spectator') return;

    const seat = clientInfo.seat;
    const paddleKey = `paddle${seat}`;
    const paddle = gameState[paddleKey];

    paddle.targetX = Math.max(0, Math.min(800, data.pos.x));
    paddle.targetY = Math.max(0, Math.min(600, data.pos.y));
    paddle.spinDirection = data.spinDirection || 0;
  });

  // 準備完了
  socket.on('ready', () => {
    const clientInfo = allClients[socket.id];
    if (!clientInfo || clientInfo.seat === 'spectator') return;

    const seat = clientInfo.seat;

    if (gameState.phase === 'ready') {
      gameState[`ready${seat}`] = true;
      console.log(`${clientInfo.nickname} is ready`);

      if (gameState.ready1 && gameState.ready2) {
        gameState.player1Name = playerNames[0];
        gameState.player2Name = playerNames[1];
        placePuckAndPaddlesInitial();
        gameState.phase = 'countdown';
        gameState.countdown = 3;
        readyPhaseStart = null;
      }
    } else if (gameState.phase === 'gameover') {
      gameState[`ready${seat}`] = true;
      console.log(`${clientInfo.nickname} ready for rematch`);

      if (gameState.ready1 && gameState.ready2) {
        console.log('=== New Game Starting ===');
        gameState = createInitialState();
        gameState.phase = 'ready';
        gameState.player1Name = playerNames[0];
        gameState.player2Name = playerNames[1];
        readyPhaseStart = Date.now();
        gameState.readyCountdown = READY_TIMEOUT;
        gameoverPhaseStart = null;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const clientInfo = allClients[socket.id];
    if (!clientInfo) return;

    // プレイヤーだった場合
    if (clientInfo.seat !== 'spectator') {
      const seat = clientInfo.seat;
      players[seat - 1] = null;
      playerNames[seat - 1] = '';

      // 待機列から補充
      if (waitingQueue.length > 0) {
        const newPlayerId = waitingQueue.shift();
        players[seat - 1] = newPlayerId;
        allClients[newPlayerId].seat = seat;
        playerNames[seat - 1] = allClients[newPlayerId].nickname;

        allClients[newPlayerId].socket.emit('seat', {
          seat,
          nickname: allClients[newPlayerId].nickname
        });
      } else {
        // プレイヤーが抜けたのでゲームリセット
        gameState = createInitialState();
        readyPhaseStart = null;
        gameoverPhaseStart = null;
      }
    } else {
      // 観戦者の場合
      const index = waitingQueue.indexOf(socket.id);
      if (index > -1) waitingQueue.splice(index, 1);
    }

    delete allClients[socket.id];
  });
});

// パック・パドル初期配置
function placePuckAndPaddlesInitial() {
  const side = Math.random() < 0.5 ? 1 : 2;
  let puckX, puckY, paddle1X, paddle1Y, paddle2X, paddle2Y;

  if (side === 1) {
    puckX = 200; puckY = 300;
    paddle1X = 200; paddle1Y = 450;
    paddle2X = 700; paddle2Y = 300;
  } else {
    puckX = 600; puckY = 300;
    paddle2X = 600; paddle2Y = 450;
    paddle1X = 100; paddle1Y = 300;
  }

  gameState.puck = { x: puckX, y: puckY, vx: 0, vy: 0, radius: 15, spin: 0, spinAngle: 0 };
  gameState.paddle1 = { x: paddle1X, y: paddle1Y, vx: 0, vy: 0, targetX: paddle1X, targetY: paddle1Y, radius: 30, spin: 0, spinAngle: 0, spinDirection: 0 };
  gameState.paddle2 = { x: paddle2X, y: paddle2Y, vx: 0, vy: 0, targetX: paddle2X, targetY: paddle2Y, radius: 30, spin: 0, spinAngle: Math.PI, spinDirection: 0 };
}

function placePuckAndPaddlesAfterGoal() {
  const scorer = gameState.goalScorer;
  let puckX, puckY, paddle1X, paddle1Y, paddle2X, paddle2Y;

  if (scorer === 1) {
    puckX = 600; puckY = 300;
    paddle2X = 600; paddle2Y = 450;
    paddle1X = 100; paddle1Y = 300;
  } else {
    puckX = 200; puckY = 300;
    paddle1X = 200; paddle1Y = 450;
    paddle2X = 700; paddle2Y = 300;
  }

  gameState.puck = { x: puckX, y: puckY, vx: 0, vy: 0, radius: 15, spin: 0, spinAngle: 0 };
  gameState.paddle1 = { x: paddle1X, y: paddle1Y, vx: 0, vy: 0, targetX: paddle1X, targetY: paddle1Y, radius: 30, spin: 0, spinAngle: 0, spinDirection: 0 };
  gameState.paddle2 = { x: paddle2X, y: paddle2Y, vx: 0, vy: 0, targetX: paddle2X, targetY: paddle2Y, radius: 30, spin: 0, spinAngle: Math.PI, spinDirection: 0 };
  gameState.goalScorer = 0;
}

// 物理演算更新
function updatePhysics(dt) {
  updatePaddlePhysics(gameState.paddle1, 'player1', dt);
  updatePaddlePhysics(gameState.paddle2, 'player2', dt);
  updatePuckPhysics(dt);

  // パドル同士の衝突
  const collision = CollisionDetector.detectCircleCircle(
    new RigidBody(gameState.paddle1.x, gameState.paddle1.y, gameState.paddle1.vx, gameState.paddle1.vy, PADDLE_MASS, gameState.paddle1.radius),
    new RigidBody(gameState.paddle2.x, gameState.paddle2.y, gameState.paddle2.vx, gameState.paddle2.vy, PADDLE_MASS, gameState.paddle2.radius)
  );
  if (collision.collided) {
    const body1 = new RigidBody(gameState.paddle1.x, gameState.paddle1.y, gameState.paddle1.vx, gameState.paddle1.vy, PADDLE_MASS, gameState.paddle1.radius);
    const body2 = new RigidBody(gameState.paddle2.x, gameState.paddle2.y, gameState.paddle2.vx, gameState.paddle2.vy, PADDLE_MASS, gameState.paddle2.radius);
    body1.spin = gameState.paddle1.spin;
    body2.spin = gameState.paddle2.spin;
    CollisionDetector.resolveCollision(body1, body2, collision.normalX, collision.normalY, collision.overlap, collision.contactX, collision.contactY);
    gameState.paddle1.x = body1.x; gameState.paddle1.y = body1.y; gameState.paddle1.vx = body1.vx; gameState.paddle1.vy = body1.vy; gameState.paddle1.spin = body1.spin;
    gameState.paddle2.x = body2.x; gameState.paddle2.y = body2.y; gameState.paddle2.vx = body2.vx; gameState.paddle2.vy = body2.vy; gameState.paddle2.spin = body2.spin;
  }

  // パックとパドルの衝突
  checkPuckPaddleCollision(gameState.puck, gameState.paddle1);
  checkPuckPaddleCollision(gameState.puck, gameState.paddle2);

  // ゴールチェック
  const puckBody = new RigidBody(gameState.puck.x, gameState.puck.y, gameState.puck.vx, gameState.puck.vy, PUCK_MASS, gameState.puck.radius);
  const goalScorer = physics.checkGoal(puckBody);
  if (goalScorer > 0) {
    gameState.goalScorer = goalScorer;
    if (goalScorer === 1) {
      gameState.score1++;
    } else {
      gameState.score2++;
    }
    gameState.phase = 'goal';
    setTimeout(() => {
      checkWinCondition();
    }, 3000);
  }
}

function updatePaddlePhysics(paddle, player, dt) {
  const dx = paddle.targetX - paddle.x;
  const dy = paddle.targetY - paddle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    const nx = dx / dist;
    const ny = dy / dist;
    const accelX = nx * PADDLE_ACCELERATION * dt;
    const accelY = ny * PADDLE_ACCELERATION * dt;
    paddle.vx += accelX;
    paddle.vy += accelY;
  }

  // 回転制御
  if (paddle.spinDirection !== 0) {
    const angularAccel = ANGULAR_ACCELERATION * paddle.spinDirection;
    paddle.spin += angularAccel * dt;
  }

  const spinDrag = -paddle.spin * PADDLE_SPIN_DRAG;
  paddle.spin += spinDrag * dt;
  paddle.spin *= PADDLE_SPIN_FRICTION;

  if (Math.abs(paddle.spin) > MAX_SPIN_SPEED) {
    paddle.spin = Math.sign(paddle.spin) * MAX_SPIN_SPEED;
  }

  paddle.spinAngle += paddle.spin * dt;
  paddle.spinAngle = paddle.spinAngle % (2 * Math.PI);

  const speed = Math.sqrt(paddle.vx * paddle.vx + paddle.vy * paddle.vy);
  if (speed > 0) {
    const dragForce = PADDLE_DRAG * speed;
    paddle.vx -= (paddle.vx / speed) * dragForce * dt;
    paddle.vy -= (paddle.vy / speed) * dragForce * dt;
  }

  paddle.vx *= PADDLE_FRICTION;
  paddle.vy *= PADDLE_FRICTION;
  paddle.x += paddle.vx * dt;
  paddle.y += paddle.vy * dt;

  const paddleBody = new RigidBody(paddle.x, paddle.y, paddle.vx, paddle.vy, PADDLE_MASS, paddle.radius);
  paddleBody.spin = paddle.spin;
  physics.checkWallCollisions(paddleBody, player);
  paddle.x = paddleBody.x;
  paddle.y = paddleBody.y;
  paddle.vx = paddleBody.vx;
  paddle.vy = paddleBody.vy;
  paddle.spin = paddleBody.spin;
}

function updatePuckPhysics(dt) {
  const puck = gameState.puck;

  // マグヌス効果
  const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
  if (speed > 0.1 && Math.abs(puck.spin) > 0.1) {
    const vxNorm = puck.vx / speed;
    const vyNorm = puck.vy / speed;
    const perpX = -vyNorm;
    const perpY = vxNorm;
    const magnusForce = MAGNUS_FORCE_COEF * puck.spin * speed;
    puck.vx += perpX * magnusForce * dt;
    puck.vy += perpY * magnusForce * dt;
  }

  const spinDrag = -puck.spin * PUCK_SPIN_DRAG;
  puck.spin += spinDrag * dt;
  puck.spin *= PUCK_SPIN_FRICTION;

  puck.x += puck.vx * dt;
  puck.y += puck.vy * dt;
  puck.spinAngle += puck.spin * dt;
  puck.spinAngle = puck.spinAngle % (2 * Math.PI);

  puck.vx *= PUCK_FRICTION;
  puck.vy *= PUCK_FRICTION;

  const puckBody = new RigidBody(puck.x, puck.y, puck.vx, puck.vy, PUCK_MASS, puck.radius);
  puckBody.spin = puck.spin;
  physics.checkWallCollisions(puckBody);
  puck.x = puckBody.x;
  puck.y = puckBody.y;
  puck.vx = puckBody.vx;
  puck.vy = puckBody.vy;
  puck.spin = puckBody.spin;
}

function checkPuckPaddleCollision(puck, paddle) {
  const puckBody = new RigidBody(puck.x, puck.y, puck.vx, puck.vy, PUCK_MASS, puck.radius);
  const paddleBody = new RigidBody(paddle.x, paddle.y, paddle.vx, paddle.vy, PADDLE_MASS, paddle.radius);
  puckBody.spin = puck.spin;
  paddleBody.spin = paddle.spin;

  const collision = CollisionDetector.detectCircleCircle(puckBody, paddleBody);
  if (collision.collided) {
    CollisionDetector.resolveCollision(puckBody, paddleBody, collision.normalX, collision.normalY, collision.overlap, collision.contactX, collision.contactY);
    puck.x = puckBody.x; puck.y = puckBody.y; puck.vx = puckBody.vx; puck.vy = puckBody.vy; puck.spin = puckBody.spin;
    paddle.x = paddleBody.x; paddle.y = paddleBody.y; paddle.vx = paddleBody.vx; paddle.vy = paddleBody.vy; paddle.spin = paddleBody.spin;
  }
}

function checkWinCondition() {
  const prevReach1 = gameState.player1Reach;
  const prevReach2 = gameState.player2Reach;

  gameState.player1Reach = gameState.score1 >= WIN_SCORE - 1 && gameState.score1 >= gameState.score2;
  gameState.player2Reach = gameState.score2 >= WIN_SCORE - 1 && gameState.score2 >= gameState.score1;
  gameState.isDeuce = gameState.score1 >= WIN_SCORE - 1 && gameState.score2 >= WIN_SCORE - 1;

  if ((gameState.player1Reach && !prevReach1) || (gameState.player2Reach && !prevReach2)) {
    gameState.phase = 'reach';
    setTimeout(() => {
      placePuckAndPaddlesAfterGoal();
      gameState.phase = 'countdown';
      gameState.countdown = 3;
    }, 3000);
    return;
  }

  if (gameState.isDeuce) {
    if (gameState.score1 - gameState.score2 >= 2) {
      gameState.winner = 1;
      gameState.phase = 'gameover';
      gameoverPhaseStart = Date.now();
      gameState.gameoverCountdown = GAMEOVER_TIMEOUT;
    } else if (gameState.score2 - gameState.score1 >= 2) {
      gameState.winner = 2;
      gameState.phase = 'gameover';
      gameoverPhaseStart = Date.now();
      gameState.gameoverCountdown = GAMEOVER_TIMEOUT;
    } else {
      placePuckAndPaddlesAfterGoal();
      gameState.phase = 'countdown';
      gameState.countdown = 3;
    }
  } else {
    if (gameState.score1 >= WIN_SCORE) {
      gameState.winner = 1;
      gameState.phase = 'gameover';
      gameoverPhaseStart = Date.now();
      gameState.gameoverCountdown = GAMEOVER_TIMEOUT;
    } else if (gameState.score2 >= WIN_SCORE) {
      gameState.winner = 2;
      gameState.phase = 'gameover';
      gameoverPhaseStart = Date.now();
      gameState.gameoverCountdown = GAMEOVER_TIMEOUT;
    } else {
      placePuckAndPaddlesAfterGoal();
      gameState.phase = 'countdown';
      gameState.countdown = 3;
    }
  }
}

// ゲームループ
const FPS = 60;
const dt = 1.0 / FPS;

setInterval(() => {
  if (gameState.phase === 'playing') {
    updatePhysics(dt);
  } else if (gameState.phase === 'countdown') {
    gameState.countdown -= dt;
    if (gameState.countdown <= 0) {
      gameState.phase = 'playing';
      gameState.countdown = -1;
    }
  } else if (gameState.phase === 'ready' && readyPhaseStart) {
    const elapsed = (Date.now() - readyPhaseStart) / 1000;
    gameState.readyCountdown = Math.max(0, READY_TIMEOUT - Math.floor(elapsed));
    if (elapsed >= READY_TIMEOUT) {
      // タイムアウト: 両方キック
      console.log('Ready timeout - resetting game');
      gameState = createInitialState();
      readyPhaseStart = null;
    }
  } else if (gameState.phase === 'gameover' && gameoverPhaseStart) {
    const elapsed = (Date.now() - gameoverPhaseStart) / 1000;
    gameState.gameoverCountdown = Math.max(0, GAMEOVER_TIMEOUT - Math.floor(elapsed));
    if (elapsed >= GAMEOVER_TIMEOUT) {
      console.log('Gameover timeout - resetting game');
      gameState = createInitialState();
      gameoverPhaseStart = null;
    }
  }

  // 全クライアントに状態を送信
  io.emit('state', gameState);
}, 1000 / FPS);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});
