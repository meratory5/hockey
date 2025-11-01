# 🚀 クイックスタートガイド

たった3ステップでオンラインエアホッケーゲームを公開！

## 📋 準備するもの

- GitHubアカウント（無料）
- テキストエディタ（VS Code推奨）

**所要時間: 約15分**

---

## ステップ1: GitHubリポジトリ作成（5分）

### 1-1. GitHub上で新しいリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」
3. リポジトリ名: `hockey-game`（任意）
4. Public を選択
5. 「Create repository」をクリック

### 1-2. ローカルでGit設定

```bash
# web_versionフォルダに移動
cd web_version

# Gitリポジトリを初期化
git init

# 全ファイルを追加
git add .

# コミット
git commit -m "Initial commit: Air Hockey Game"

# GitHubに接続（YOUR_USERNAMEを自分のユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/hockey-game.git

# プッシュ
git branch -M main
git push -u origin main
```

✅ GitHubでファイルがアップロードされたことを確認！

---

## ステップ2: サーバーをRenderにデプロイ（5分）

### 2-1. Renderアカウント作成

1. [Render.com](https://render.com)にアクセス
2. 「Get Started」→「GitHub」でサインアップ
3. GitHubアカウントと連携

### 2-2. サーバーをデプロイ

1. Renderダッシュボードで「New +」→「Web Service」
2. 「Connect a repository」→先ほど作成したリポジトリを選択
3. 以下の設定を入力：

   ```
   Name:               hockey-game-server
   Region:             Oregon (US West) ※近い地域を選択
   Branch:             main
   Root Directory:     server
   Runtime:            Node
   Build Command:      npm install
   Start Command:      npm start
   Instance Type:      Free
   ```

4. 「Create Web Service」をクリック

5. デプロイ開始！（数分かかります）

6. **完了したら、URLをメモ！**
   - 例: `https://hockey-game-server.onrender.com`

✅ URLにアクセスして「Air Hockey Server is running!」が表示されたらOK！

---

## ステップ3: クライアントをGitHub Pagesで公開（5分）

### 3-1. サーバーURLを設定

1. `client/game.js`を開く
2. 7行目あたりの`SERVER_URL`を変更：

```javascript
const SERVER_URL = 'https://hockey-game-server.onrender.com';
```
※先ほどメモしたRenderのURLに変更

3. 保存してGitにプッシュ：

```bash
git add client/game.js
git commit -m "Update server URL"
git push
```

### 3-2. GitHub Pagesを有効化

1. GitHubのリポジトリページに移動
2. 「Settings」タブをクリック
3. 左メニューの「Pages」をクリック
4. 以下の設定：
   ```
   Source:  Deploy from a branch
   Branch:  main
   Folder:  /client
   ```
5. 「Save」をクリック

6. 数分待つと、上部に緑色の背景で公開URLが表示される！
   - 例: `https://YOUR_USERNAME.github.io/hockey-game/`

✅ このURLにアクセスしてゲームが起動すればOK！

---

## 🎉 完成！

おめでとうございます！以下のことができました：

- ✅ サーバーを無料でデプロイ
- ✅ クライアントを無料で公開
- ✅ URLだけで誰でも遊べる状態に

## 📤 友達と遊ぶ

1. GitHub PagesのURLを友達に送る
2. 同時にアクセス
3. ニックネームを入力
4. 両方が「Ready」をクリック
5. プレイ開始！

## 🔧 よくある問題と解決法

### サーバーに接続できない

**症状**: 「Connecting...」のまま

**解決法**:
1. `client/game.js`のSERVER_URLが正しいか確認
2. Renderのサーバーが起動しているか確認（Renderダッシュボード）
3. ブラウザのコンソール（F12）でエラーをチェック

### GitHub Pagesが404エラー

**症状**: ページが見つからない

**解決法**:
1. 設定で「Pages」が有効か確認
2. フォルダが`/client`になっているか確認
3. 10分ほど待ってから再アクセス

### Renderのサーバーがスリープする

**症状**: 初回アクセスが遅い

**説明**: 無料プランは15分間アクセスがないとスリープします。
- 初回アクセス時は30秒ほど待つ
- 定期的にアクセスすれば問題なし

## 💡 次のステップ

- カスタムドメインを設定（GitHub Pages設定）
- ゲームパラメータをカスタマイズ（`server/server.js`）
- デザインを変更（`client/style.css`）
- 友達と対戦して楽しむ！

## 📚 詳細ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 他のホスティング方法
- [README.md](./README.md) - プロジェクト概要
- [server/README.md](./server/README.md) - サーバーAPI
- [client/README.md](./client/README.md) - カスタマイズ方法

---

**困ったら**: [DEPLOYMENT.md](./DEPLOYMENT.md)のトラブルシューティングセクションを参照

楽しいゲームライフを！🏒✨
