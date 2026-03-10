# Shikaku Race Studio

ショート動画向けの `Square Race` 生成ツールです。ブラウザ上でコースを量産し、そのまま録画して YouTube Shorts / Instagram Reels / 通常の YouTube 動画に使える形を目指しています。

## Features

- `1080x1920` / `1920x1080` / `1080x1080` の出力プリセット
- 複数スタイルのコース自動生成と `seed` 再現
- キャンバスクリックでバンパーを追加できる簡易エディタ
- コース JSON の書き出し / 読み込み
- 壁衝突でレーサーごとに異なる音
- キャンバス録画ダウンロード

## Recording Notes

- 録画はブラウザの `MediaRecorder` 対応に依存します。
- `MP4` をサポートするブラウザでは MP4 で保存します。
- 非対応ブラウザでは `WebM` にフォールバックします。

## Local

静的サイトなので、任意のローカルサーバーで配信すれば動きます。

```bash
python3 -m http.server 4173
```

## Deploy

GitHub に push して Vercel の Git 連携プロジェクトへ接続すれば、自動デプロイ構成で運用できます。
