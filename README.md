# 🏒 エアホッケーゲーム（Web版）

リアルタイムマルチプレイヤーエアホッケーゲーム - ブラウザで動作するシンプル版

## ✨ 特徴

- **リアルタイム対戦**: Socket.IOによる低遅延通信
- **物理エンジン**: 本格的な衝突・回転シミュレーション
- **シンプル設計**: 認証・ホワイトリスト不要で誰でもすぐプレイ
- **完全無料**: 無料ホスティングサービスで公開可能
- **ブラウザのみ**: インストール不要でURLアクセスのみ

## 🎮 デモ

プレイ方法:
1. URLにアクセス
2. ニックネームを入力
3. 2人目が参加したらゲーム開始！

## 🚀 クイックスタート

### ローカルで試す

#### サーバー起動
```bash
cd server
npm install
npm start
```

#### クライアント
`client/index.html`をブラウザで開く

複数のブラウザウィンドウで開いてマルチプレイヤーをテスト！

### オンラインで公開

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照

**推奨構成: Render（サーバー）+ GitHub Pages（クライアント）**

1. GitHubにpush
2. Renderでサーバーをデプロイ
3. GitHub Pagesでクライアントを公開
4. 完成！

## 📁 プロジェクト構成

```
web_version/
├── server/              # Node.jsサーバー
│   ├── server.js       # メインロジック
│   ├── physics.js      # 物理エンジン
│   ├── package.json
│   └── README.md
├── client/              # HTMLクライアント
│   ├── index.html      # メインHTML
│   ├── game.js         # ゲームロジック
│   ├── style.css       # スタイル
│   └── README.md
├── DEPLOYMENT.md        # デプロイガイド
└── README.md           # このファイル
```

## 🎯 ゲームルール

### 基本
- 2人対戦のエアホッケー
- 先に5点獲得で勝利
- 4-4以降はデュース（2点差で勝利）

### 操作
- **マウス移動**: パドルを動かす
- **左クリック（長押し）**: 左回転
- **右クリック（長押し）**: 右回転
- **クリック**: Ready / 再戦

### ゲームフロー
1. 2人のプレイヤーが参加
2. 両方が「Ready」をクリック
3. カウントダウン（3秒）
4. ゲーム開始
5. ゴールごとに演出
6. 5点先取で勝利

## 🛠️ 技術スタック

### サーバー
- **Node.js**: JavaScriptランタイム
- **Express**: Webフレームワーク
- **Socket.IO**: リアルタイム通信

### クライアント
- **HTML5 Canvas**: ゲーム描画
- **Socket.IO Client**: サーバー通信
- **Vanilla JavaScript**: フレームワークレス

### ホスティング（推奨）
- **Render**: サーバー（無料）
- **GitHub Pages**: クライアント（無料）

## 🌐 無料ホスティングオプション

| サービス | 用途 | 無料枠 | 特徴 |
|---------|------|--------|------|
| [Render](https://render.com) | サーバー | 750時間/月 | 自動デプロイ、簡単 |
| [Railway](https://railway.app) | サーバー | $5クレジット | 高速、Git統合 |
| [Fly.io](https://fly.io) | サーバー | 3つまで無料 | グローバルCDN |
| [GitHub Pages](https://pages.github.com) | クライアント | 無制限 | 簡単、Git統合 |
| [Vercel](https://vercel.com) | クライアント | 無制限 | 高速、最適化 |
| [Netlify](https://netlify.com) | クライアント | 無制限 | CI/CD統合 |

## 📊 パフォーマンス

- **遅延**: 20-50ms（サーバー次第）
- **更新頻度**: 60 FPS
- **同時接続**: 数十人（無料プラン）
- **観戦モード**: 対応

## 🔧 カスタマイズ

### ゲームパラメータ調整

`server/server.js`:
```javascript
const WIN_SCORE = 5;              // 勝利点数
const PADDLE_MASS = 2.5;          // パドル質量
const ANGULAR_ACCELERATION = 48.0; // 回転加速度
```

### 見た目変更

`client/style.css`:
```css
body {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}
```

## 📝 ライセンス

MIT License - 自由に使用・改変・配布可能

## 🤝 貢献

Issue・Pull Request大歓迎！

## ❓ よくある質問

**Q: 無料で何人まで遊べる？**
A: ゲーム自体は2人対戦（+観戦者）。サーバーは数十人同時接続可能。

**Q: モバイル対応は？**
A: タッチ未対応ですが、タブレット等のマウス対応デバイスでは動作。

**Q: カスタムドメインは使える？**
A: はい。GitHub Pages・Vercel・Netlifyでカスタムドメイン設定可能。

**Q: 元のPython版との違いは？**
A:
- 言語: Python → Node.js + JavaScript
- 認証・ホワイトリスト・バン機能を削除
- ブラウザで動作（インストール不要）

**Q: データは保存される？**
A: いいえ。セッションのみで、永続化なし。

## 📞 サポート

問題があれば Issue を作成してください。

---

楽しいゲームライフを！🏒✨
