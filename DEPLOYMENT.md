# エアホッケーゲーム - デプロイメントガイド

このガイドでは、無料でオンラインゲームを公開する方法を説明します。

## 📋 目次

1. [準備](#準備)
2. [オプション1: Render + GitHub Pages（推奨）](#オプション1-render--github-pages推奨)
3. [オプション2: Railway + Vercel](#オプション2-railway--vercel)
4. [オプション3: Fly.io + Netlify](#オプション3-flyio--netlify)
5. [ローカルテスト](#ローカルテスト)

---

## 準備

### 必要なもの
- GitHubアカウント（無料）
- Node.js 18以上（ローカルテスト用）

### ファイル構成
```

```

---

## オプション1: Render + GitHub Pages（推奨）

### ✅ メリット
- 完全無料
- 設定が簡単
- 自動デプロイ

### 🔧 手順

#### 1. GitHubリポジトリを作成

```bash
# web_versionフォルダに移動
cd web_version

# Gitリポジトリ初期化
git init
git add .
git commit -m "Initial commit"

# GitHubで新しいリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/hockey-game.git
git branch -M main
git push -u origin main
```

#### 2. サーバーをRenderにデプロイ

1. [Render](https://render.com)にサインアップ（GitHubアカウントで可）
2. 「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 以下の設定を入力：
   - **Name**: `hockey-game-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. 「Create Web Service」をクリック

6. デプロイ完了後、URLをメモ（例: `https://hockey-game-server.onrender.com`）

#### 3. クライアントをGitHub Pagesにデプロイ

**重要**: `/client`フォルダは直接選択できないため、GitHub Actionsを使用します。

1. `client/game.js`のSERVER_URLを更新（既に設定済みの場合はスキップ）：

```javascript
const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://YOUR-RENDER-APP.onrender.com';  // RenderのURLに変更
```

2. 変更をコミット＆プッシュ：

```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

3. GitHubリポジトリの「Settings」→「Pages」
4. **Source**: `GitHub Actions`を選択
5. 自動的に`.github/workflows/deploy.yml`が検出されます
6. Actionsタブで自動デプロイを確認

7. 数分後、`https://YOUR_USERNAME.github.io/REPO_NAME/`でアクセス可能

#### 4. CORS設定（既に設定済み）

`server/server.js`のCORS設定を確認：
```javascript
const io = socketIO(server, {
  cors: {
    origin: "*",  // 本番環境では特定のドメインを指定推奨
    methods: ["GET", "POST"]
  }
});
```

---

## オプション2: Railway + Vercel

### ✅ メリット
- Railwayは高速
- Vercelは最適化が優れている

### 🔧 手順

#### 1. サーバーをRailwayにデプロイ

1. [Railway](https://railway.app)にサインアップ
2. 「New Project」→「Deploy from GitHub repo」
3. リポジトリを選択
4. 「Deploy Now」をクリック
5. 「Settings」→「Root Directory」を`server`に設定
6. デプロイURLをメモ

#### 2. クライアントをVercelにデプロイ

1. [Vercel](https://vercel.com)にサインアップ
2. 「New Project」→GitHubリポジトリを選択
3. 以下の設定：
   - **Root Directory**: `client`
   - **Framework Preset**: `Other`
4. 「Deploy」をクリック
5. デプロイ後、`client/game.js`のSERVER_URLを更新してコミット

---

## オプション3: Fly.io + Netlify

### ✅ メリット
- グローバルCDN
- カスタムドメイン対応

### 🔧 手順

#### 1. サーバーをFly.ioにデプロイ

1. [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)をインストール
2. サインアップ: `flyctl auth signup`
3. `server/`フォルダに`fly.toml`を作成：

```toml
app = "hockey-game-server"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

4. デプロイ:
```bash
cd server
flyctl launch
flyctl deploy
```

#### 2. クライアントをNetlifyにデプロイ

1. [Netlify](https://netlify.com)にサインアップ
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. 設定：
   - **Base directory**: `client`
   - **Build command**: （空白）
   - **Publish directory**: `.`
5. 「Deploy site」をクリック

---

## ローカルテスト

### サーバーを起動

```bash
cd server
npm install
npm start
```

サーバーが`http://localhost:3000`で起動します。

### クライアントを開く

1. `client/index.html`をブラウザで直接開く、または
2. Live Serverなどを使用

複数のブラウザウィンドウで開いてマルチプレイヤーをテスト。

---

## 🎮 ゲームの遊び方

1. デプロイしたクライアントURLにアクセス
2. ニックネームを入力
3. 2人目のプレイヤーが参加するまで待つ
4. 両プレイヤーが「Ready」をクリック
5. ゲーム開始！

### 操作方法
- **マウス移動**: パドルを動かす
- **左クリック（長押し）**: 左回転
- **右クリック（長押し）**: 右回転
- **クリック**: Ready / Play Again

---

## トラブルシューティング

### サーバーに接続できない

1. サーバーURLが正しいか確認
2. ブラウザの開発者ツール（F12）でエラーをチェック
3. CORS設定を確認

### Renderの無料プランでスリープする

Renderの無料プランは15分間アクセスがないとスリープします。
- 初回アクセス時は起動に30秒ほどかかる場合があります
- 定期的にアクセスするcronジョブを設定可能（別途設定必要）

### GitHub Pagesが404エラー

1. リポジトリ設定で「Pages」が有効か確認
2. ブランチとフォルダが正しいか確認
3. 数分待ってから再アクセス

---

## 💡 ヒント

### カスタムドメインを使う

- GitHub Pages: Settings → Pages → Custom domain
- Vercel: Project Settings → Domains
- Render: Settings → Custom Domain

### パフォーマンス改善

1. Renderの有料プラン（$7/月）でスリープを無効化
2. CDNを使用（Cloudflare等）
3. 地理的に近いサーバーリージョンを選択

### セキュリティ強化

1. CORS設定を特定ドメインのみに制限
2. レート制限を追加
3. 環境変数でシークレットを管理

---

## 📚 参考リンク

- [Render Documentation](https://render.com/docs)
- [GitHub Pages](https://pages.github.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)

---

## ❓ FAQ

**Q: 無料で何人まで同時プレイできますか？**
A: Renderの無料プランでは数十人程度は問題なく動作します。ただし、同時プレイヤーは2人（+観戦者）のゲーム設計です。

**Q: モバイルでもプレイできますか？**
A: タッチ操作には未対応ですが、タブレット等のマウス対応デバイスでは動作します。

**Q: サーバーコードを変更したい**
A: `server/server.js`を編集後、GitにプッシュすればRenderが自動で再デプロイします。

**Q: どの組み合わせがベストですか？**
A: **Render + GitHub Pages**が最もシンプルで推奨です。

---

楽しいゲームライフを！🏒✨
