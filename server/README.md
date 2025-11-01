# エアホッケーゲーム - サーバー

Node.js + Socket.IOによるリアルタイムマルチプレイヤーゲームサーバー。

## 特徴

- リアルタイム2人対戦
- 物理演算エンジン搭載
- 観戦モード対応
- 認証・ホワイトリスト・バン機能なし（シンプル版）

## セットアップ

### 必要環境
- Node.js 18以上

### インストール

```bash
npm install
```

### 起動

```bash
npm start
```

開発時（自動再起動）:
```bash
npm run dev
```

サーバーは`http://localhost:3000`で起動します。

## 環境変数

- `PORT`: サーバーポート（デフォルト: 3000）

Renderなどのホスティングサービスでは自動的に設定されます。

## ファイル構成

```
server/
├── server.js       # メインサーバーロジック
├── physics.js      # 物理演算エンジン
├── package.json    # 依存関係
└── README.md       # このファイル
```

## ゲームロジック

### ゲームフェーズ

1. `waiting_players`: プレイヤー待機中
2. `ready`: 準備フェーズ（20秒）
3. `countdown`: カウントダウン（3秒）
4. `playing`: ゲーム中
5. `goal`: ゴール演出（3秒）
6. `reach`: リーチ演出（3秒）
7. `gameover`: ゲーム終了（20秒）

### ゲームパラメータ

- 勝利スコア: 5点
- デュース: 4-4以降は2点差で勝利
- パドル質量: 2.5
- パック質量: 1.0
- 最大回転速度: 8π rad/s

## API

### クライアント → サーバー

**nickname**
```javascript
socket.emit('nickname', { nickname: 'PlayerName' });
```

**move**
```javascript
socket.emit('move', {
  pos: { x: 400, y: 300 },
  spinDirection: 0  // 0=停止, 1=左, -1=右
});
```

**ready**
```javascript
socket.emit('ready');
```

### サーバー → クライアント

**seat**
```javascript
socket.on('seat', (data) => {
  // data: { seat: 1|2|'spectator', nickname: 'PlayerName' }
});
```

**state**
```javascript
socket.on('state', (gameState) => {
  // 60FPSで送信されるゲーム状態
});
```

## デプロイ

詳細は`../DEPLOYMENT.md`を参照してください。

### Render

1. GitHubリポジトリをRenderに接続
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`

### Railway

1. GitHubリポジトリをRailwayに接続
2. Root Directoryを`server`に設定
3. 自動デプロイ

### Fly.io

```bash
flyctl launch
flyctl deploy
```

## ライセンス

MIT
