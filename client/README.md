# エアホッケーゲーム - クライアント

HTML5 Canvas + Socket.IOによるブラウザゲームクライアント。

## 特徴

- ブラウザのみで動作（インストール不要）
- リアルタイム対戦
- レスポンシブデザイン
- シンプルで直感的なUI

## セットアップ

### サーバーURLの設定

`game.js`の`SERVER_URL`を編集：

```javascript
const SERVER_URL = 'https://your-server.onrender.com';
```

ローカルテスト時:
```javascript
const SERVER_URL = 'http://localhost:3000';
```

### 起動方法

#### 方法1: ブラウザで直接開く

`index.html`をダブルクリックしてブラウザで開く。

#### 方法2: Live Server（推奨）

VS Codeの拡張機能「Live Server」を使用。

#### 方法3: Python簡易サーバー

```bash
python -m http.server 8000
```

ブラウザで`http://localhost:8000`にアクセス。

## ファイル構成

```
client/
├── index.html    # メインHTML
├── game.js       # ゲームロジック
├── style.css     # スタイルシート
└── README.md     # このファイル
```

## 操作方法

### ニックネーム入力
- 最大12文字
- 英数字のみ

### ゲーム中
- **マウス移動**: パドルを動かす
- **左クリック（長押し）**: パドルを左回転（反時計回り）
- **右クリック（長押し）**: パドルを右回転（時計回り）
- **クリック**: Ready / Play Again

## ゲーム画面

### 色分け
- **赤**: プレイヤー1
- **青**: プレイヤー2
- **白**: パック

### 自分のパドル
中央に黄色い点が表示されます。

### 画面表示
- スコア（上部中央）
- プレイヤー名（下部）
- フェーズメッセージ（中央）
- 回転中の表示（上部）
- デュース・リーチ表示

## デプロイ

詳細は`../DEPLOYMENT.md`を参照してください。

### GitHub Pages

1. GitHubリポジトリ作成
2. Settings → Pages
3. Source: `main` branch, `/client` folder
4. 数分後、`https://username.github.io/repo-name/`でアクセス可能

### Vercel

1. Vercelアカウント作成
2. GitHubリポジトリをインポート
3. Root Directory: `client`
4. Deploy

### Netlify

1. Netlifyアカウント作成
2. 「Add new site」→「Import an existing project」
3. Base directory: `client`
4. Publish directory: `.`

## カスタマイズ

### 色変更

`style.css`や`game.js`で色を変更可能。

例: パドル1の色を緑に
```javascript
// game.js
const color1 = '#64ff64';  // 赤 → 緑
```

### Canvas サイズ変更

```javascript
// index.html
<canvas id="game-canvas" width="800" height="600"></canvas>
```

物理演算との整合性のため、800x600推奨。

### フォント変更

```css
/* style.css */
body {
  font-family: 'Your Font', sans-serif;
}
```

## 対応ブラウザ

- Chrome（推奨）
- Firefox
- Safari
- Edge

モダンブラウザであれば動作します。

## トラブルシューティング

### サーバーに接続できない

1. `game.js`の`SERVER_URL`が正しいか確認
2. サーバーが起動しているか確認
3. ブラウザのコンソール（F12）でエラーチェック

### 右クリックメニューが出る

通常は無効化されていますが、出る場合は`game.js`を確認：
```javascript
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
```

### レスポンシブ対応

`style.css`でメディアクエリを調整：
```css
@media (max-width: 850px) {
  #game-canvas {
    width: 100%;
    height: auto;
  }
}
```

## ライセンス

MIT
