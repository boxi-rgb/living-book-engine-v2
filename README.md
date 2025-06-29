# Living AI Books: 読者共創型・自己進化出版プラットフォーム

## 概要

このプロジェクトは、AIと読者の共創によって進化する「生きた本」を創り出すための、コストゼロでコミュニティ駆動型の出版エンジンです。

従来の「一度きりの製品リリース」としての出版から、読者のフィードバックや貢献によって継続的に成長する「サービス」としての出版へと概念を変革します。

## 特徴

- **コストゼロ:** OpenAIなどの高価なAPIや専用サーバーは使用しません。GitHub、Vercel/Netlifyの無料枠、そして読者の貢献によって運営されます。
- **コミュニティ駆動:** 読者は単なる消費者ではなく、IssueやPull Requestを通じて書籍の改善に直接参加する「共創者」です。
- **自己進化:** 読者の貢献がマージされるたびに、書籍は自動的に更新・デプロイされ、常に最新の状態に保たれます。
- **透明性:** すべての変更履歴はGitのコミットログとして公開され、誰が、いつ、どのように貢献したかが明確です。

## 参加方法

この書籍は、あなたの貢献を歓迎します！

1.  **リポジトリをフォークする:**
    `https://github.com/boxi-rgb/living-book-engine-v2`
2.  **Issueを立てる:**
    誤字脱字の報告、内容の改善提案、新しいトピックの提案など、どんなことでもIssueとして投稿してください。
    - [バグ報告テンプレート](https://github.com/boxi-rgb/living-book-engine-v2/issues/new?assignees=&labels=bug&template=bug_report.md&title=%5BBUG%5D+)
    - [機能要望テンプレート](https://github.com/boxi-rgb/living-book-engine-v2/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=%5BFEAT%5D+)
3.  **Pull Requestを送る:**
    Issueで議論された内容や、あなたが直接修正したい箇所があれば、Pull Requestを送ってください。Markdown Lintが自動で品質をチェックします。
    - [Pull Requestテンプレート](https://github.com/boxi-rgb/living-book-engine-v2/compare/main...main?expand=1&template=PULL_REQUEST_TEMPLATE.md)

## デプロイされたサイト

（ここにVercel/NetlifyのデプロイURLが入ります。ユーザーがVercel/Netlifyに接続後、URLを教えてください。）

## 開発者向け

### プロジェクトのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/boxi-rgb/living-book-engine-v2.git
cd living-book-engine-v2

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルドとデプロイ

```bash
npm run build
```

ビルドされた静的ファイルは `.vitepress/dist` ディレクトリに出力されます。

## ライセンス

MIT License
