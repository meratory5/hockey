// グローバル変数
let socket;
let mySeat = null;
let myNickname = '';
let gameState = null;
let canvas, ctx;
let spinDirection = 0; // 0=停止, 1=左回転, -1=右回転

// サーバーURL（本番環境では変更）
const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : window.location.origin;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  const nicknameInput = document.getElementById('nickname-input');
  const joinButton = document.getElementById('join-button');

  // Enterキーで参加
  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && nicknameInput.value.trim()) {
      joinGame();
    }
  });

  joinButton.addEventListener('click', joinGame);
});

function joinGame() {
  const nicknameInput = document.getElementById('nickname-input');
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    alert('Please enter a nickname!');
    return;
  }

  // 英数字のみ許可
  if (!/^[a-zA-Z0-9]+$/.test(nickname)) {
    alert('Only alphanumeric characters allowed!');
    return;
  }

  myNickname = nickname;

  // サーバーに接続
  connectToServer();
}

function connectToServer() {
  document.getElementById('nickname-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  // Socket.IO接続
  socket = io(SERVER_URL);

  socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus('connected');
    socket.emit('nickname', { nickname: myNickname });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus('disconnected');
  });

  socket.on('seat', (data) => {
    mySeat = data.seat;
    myNickname = data.nickname;
    console.log(`Assigned seat: ${mySeat}`);
  });

  socket.on('state', (state) => {
    gameState = state;
    draw();
  });

  // マウスイベント
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // 右クリックメニュー無効化
}

function updateConnectionStatus(status) {
  const statusEl = document.getElementById('connection-status');
  statusEl.className = status;
  if (status === 'connected') {
    statusEl.textContent = '✓ Connected';
  } else if (status === 'disconnected') {
    statusEl.textContent = '✗ Disconnected';
  } else {
    statusEl.textContent = 'Connecting...';
  }
}

function handleMouseMove(e) {
  if (!socket || mySeat === 'spectator') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  socket.emit('move', {
    pos: { x, y },
    spinDirection
  });
}

function handleMouseDown(e) {
  if (!gameState || mySeat === 'spectator') return;

  const phase = gameState.phase;

  if (phase === 'ready' || phase === 'gameover') {
    // 準備完了
    socket.emit('ready');
  } else if (phase === 'playing') {
    // 回転開始
    if (e.button === 0) {
      // 左クリック = 左回転
      spinDirection = 1;
    } else if (e.button === 2) {
      // 右クリック = 右回転
      spinDirection = -1;
    }
  }
}

function handleMouseUp(e) {
  // 回転停止
  if (e.button === 0 && spinDirection === 1) {
    spinDirection = 0;
  } else if (e.button === 2 && spinDirection === -1) {
    spinDirection = 0;
  }
}

// 描画
function draw() {
  if (!gameState) return;

  // 背景
  ctx.fillStyle = '#1a1e2e';
  ctx.fillRect(0, 0, 800, 600);

  // センターライン
  ctx.strokeStyle = '#646464';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(400, 0);
  ctx.lineTo(400, 600);
  ctx.stroke();

  // ゴールエリア
  ctx.fillStyle = 'rgba(200, 50, 50, 0.3)';
  ctx.fillRect(0, 200, 15, 200);
  ctx.fillStyle = 'rgba(50, 50, 200, 0.3)';
  ctx.fillRect(785, 200, 15, 200);

  // 壁
  ctx.fillStyle = '#969696';
  ctx.fillRect(0, 0, 15, 200);
  ctx.fillRect(0, 400, 15, 200);
  ctx.fillRect(785, 0, 15, 200);
  ctx.fillRect(785, 400, 15, 200);

  // パドル1（赤）
  const p1 = gameState.paddle1;
  const color1 = mySeat === 1 ? '#ff6464' : '#ff6464';
  drawPaddle(p1, color1, mySeat === 1);

  // パドル2（青）
  const p2 = gameState.paddle2;
  const color2 = mySeat === 2 ? '#6464ff' : '#6464ff';
  drawPaddle(p2, color2, mySeat === 2);

  // パック
  const puck = gameState.puck;
  drawPuck(puck);

  // スコア
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`${gameState.score1}  :  ${gameState.score2}`, 400, 60);

  // デュース表示
  if (gameState.isDeuce && gameState.phase === 'playing') {
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffff64';
    ctx.textAlign = 'left';
    ctx.fillText('DEUCE', 30, 40);
  }

  // プレイヤー名表示
  ctx.font = '28px Arial';
  ctx.fillStyle = '#ff6464';
  ctx.textAlign = 'left';
  ctx.fillText('Player 1', 30, 550);

  if (gameState.player1Reach) {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffff64';
    ctx.fillText('REACH', 30, 525);
  }

  ctx.font = '20px Arial';
  ctx.fillStyle = '#ff9696';
  const p1You = mySeat === 1 ? ' (YOU)' : '';
  ctx.fillText(gameState.player1Name + p1You, 30, 580);

  ctx.font = '28px Arial';
  ctx.fillStyle = '#6464ff';
  ctx.textAlign = 'right';
  ctx.fillText('Player 2', 770, 550);

  if (gameState.player2Reach) {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffff64';
    ctx.fillText('REACH', 770, 525);
  }

  ctx.font = '20px Arial';
  ctx.fillStyle = '#9696ff';
  const p2You = mySeat === 2 ? ' (YOU)' : '';
  ctx.fillText(gameState.player2Name + p2You, 770, 580);

  // 観戦モード表示
  if (mySeat === 'spectator') {
    ctx.font = '32px Arial';
    ctx.fillStyle = '#c8c864';
    ctx.textAlign = 'center';
    ctx.fillText('SPECTATOR MODE', 400, 40);
  }

  // 回転中の表示
  if (spinDirection !== 0 && gameState.phase === 'playing') {
    ctx.font = '28px Arial';
    ctx.fillStyle = '#64ffff';
    ctx.textAlign = 'center';
    const spinText = spinDirection === 1 ? 'LEFT SPIN' : 'RIGHT SPIN';
    ctx.fillText(spinText, 400, 40);
  }

  // フェーズ別表示
  const phase = gameState.phase;

  if (phase === 'waiting_players') {
    drawCenteredText('Waiting for players...', 280, 64, '#c8c8c8');
  } else if (phase === 'ready') {
    const countdown = gameState.readyCountdown;
    if (mySeat !== 'spectator') {
      drawCenteredText('Click to Ready', 240, 64, '#ffff64');
      ctx.font = '32px Arial';
      ctx.fillStyle = '#ff6464';
      ctx.textAlign = 'center';
      ctx.fillText(`Time: ${countdown}s`, 400, 300);

      let readyStatus = '';
      if (gameState.ready1) readyStatus += `${gameState.player1Name} Ready! `;
      if (gameState.ready2) readyStatus += `${gameState.player2Name} Ready!`;
      if (readyStatus) {
        ctx.font = '28px Arial';
        ctx.fillStyle = '#64ff64';
        ctx.fillText(readyStatus, 400, 350);
      }
    } else {
      drawCenteredText('Waiting for ready...', 280, 64, '#c8c8c8');
    }
  } else if (phase === 'countdown') {
    const countdown = Math.ceil(gameState.countdown);
    if (countdown > 0) {
      drawCountdown(countdown);
    }
  } else if (phase === 'goal') {
    const scorer = gameState.goalScorer;
    const scorerName = scorer === 1 ? gameState.player1Name : gameState.player2Name;
    drawOverlay(0, 0, 0, 200);
    drawCenteredText('GOAL!', 280, 100, '#ffff32');
    ctx.font = '32px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${scorerName} scored!`, 400, 360);
  } else if (phase === 'reach') {
    const reachPlayer = gameState.player1Reach ? gameState.player1Name : gameState.player2Name;
    drawOverlay(0, 0, 0, 200);
    drawCenteredText(reachPlayer, 260, 80, '#ffff64');
    drawCenteredText('REACH!', 350, 64, '#ffff32');
  } else if (phase === 'gameover') {
    const winner = gameState.winner;
    const winnerName = winner === 1 ? gameState.player1Name : gameState.player2Name;
    const countdown = gameState.gameoverCountdown;

    drawOverlay(0, 0, 0, 220);

    let resultText, resultColor;
    if (mySeat === winner) {
      resultText = 'YOU WIN!';
      resultColor = '#64ff64';
    } else if (mySeat === 'spectator') {
      resultText = `${winnerName} WINS!`;
      resultColor = '#ffff64';
    } else {
      resultText = 'YOU LOSE';
      resultColor = '#ff6464';
    }

    drawCenteredText(resultText, 210, 100, resultColor);

    ctx.font = '64px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameState.score1} - ${gameState.score2}`, 400, 290);

    if (mySeat !== 'spectator') {
      ctx.font = '32px Arial';
      ctx.fillStyle = '#ff6464';
      ctx.fillText(`Time: ${countdown}s`, 400, 350);

      let readyStatus = '';
      if (gameState.ready1) readyStatus += `${gameState.player1Name} Ready! `;
      if (gameState.ready2) readyStatus += `${gameState.player2Name} Ready!`;
      if (readyStatus) {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#64ff64';
        ctx.fillText(readyStatus, 400, 390);
      }

      ctx.font = '28px Arial';
      ctx.fillStyle = '#c8c8c8';
      ctx.fillText('Click: Play Again  |  ESC: Quit', 400, 440);
    }
  }
}

function drawPaddle(paddle, color, isYou) {
  // 円
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(paddle.x, paddle.y, paddle.radius, 0, 2 * Math.PI);
  ctx.fill();

  // 回転インジケーター
  const angle = paddle.spinAngle;
  const innerColor = isYou ? '#ffff64' : darkenColor(color);

  // 2本の線
  for (let i = 0; i < 2; i++) {
    const a = angle + i * Math.PI;
    const startX = paddle.x + Math.cos(a) * paddle.radius * 0.35;
    const startY = paddle.y + Math.sin(a) * paddle.radius * 0.35;
    const endX = paddle.x + Math.cos(a) * paddle.radius * 0.9;
    const endY = paddle.y + Math.sin(a) * paddle.radius * 0.9;

    ctx.strokeStyle = darkenColor(color);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // 中心の円
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(paddle.x, paddle.y, paddle.radius * 0.25, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPuck(puck) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, puck.radius, 0, 2 * Math.PI);
  ctx.fill();

  // 回転インジケーター
  const angle = puck.spinAngle;
  for (let i = 0; i < 2; i++) {
    const a = angle + i * Math.PI;
    const startX = puck.x + Math.cos(a) * puck.radius * 0.35;
    const startY = puck.y + Math.sin(a) * puck.radius * 0.35;
    const endX = puck.x + Math.cos(a) * puck.radius * 0.9;
    const endY = puck.y + Math.sin(a) * puck.radius * 0.9;

    ctx.strokeStyle = '#323232';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.fillStyle = '#323232';
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, puck.radius * 0.25, 0, 2 * Math.PI);
  ctx.fill();
}

function drawCenteredText(text, y, size, color) {
  ctx.font = `bold ${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, 400, y);
}

function drawCountdown(num) {
  drawOverlay(0, 0, 0, 180);
  ctx.font = 'bold 100px Arial';
  ctx.fillStyle = '#ffff64';
  ctx.textAlign = 'center';
  ctx.fillText(num.toString(), 400, 330);
}

function drawOverlay(r, g, b, a) {
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  ctx.fillRect(0, 0, 800, 600);
}

function darkenColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)})`;
}
