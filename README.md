# 🚀 Living Book Engine v2 × KDP自動化システム

> **革新的出版プラットフォーム** - AI技術とコミュニティの力で「生きた本」を創造

## 🎯 プロジェクト概要

Living Book Engine v2は、**AIと読者の共創による自己進化出版プラットフォーム**です。従来の「一度きりの製品リリース」から、**コミュニティ駆動で継続的に成長するサービス**へと出版概念を変革します。

### 🌟 二つの革新的機能

#### 1. 🤝 コミュニティ駆動型出版（GEMINIエンジン）
- **コストゼロ**: 高価なAPIに依存しない持続可能な運営
- **読者共創**: IssueやPRを通じた直接的な品質向上
- **透明性**: 全変更履歴の公開とトレーサビリティ

#### 2. 🤖 AI自動出版システム（Claudeエンジン）
- **1日1冊**: 超高速AI執筆→KDP出版パイプライン
- **品質保証**: 多段階AI+コミュニティレビュー
- **ブルーオーシャン戦略**: データドリブンなニッチ市場開拓

## 🏗️ ハイブリッドシステム構成

```
コミュニティ貢献 ──┐
                  ├─→ Living Book Engine ─→ 品質管理 ─→ 出版
AI自動生成 ────────┘        ↓                ↓        ↓
                        VitePress      GitHub     KDP/Web
```

## 🚀 クイックスタート

### 1. 環境セットアップ
```bash
# リポジトリクローン
git clone https://github.com/boxi-rgb/living-book-engine-v2.git
cd living-book-engine-v2

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### 2. コミュニティ参加
1. **[Issues](https://github.com/boxi-rgb/living-book-engine-v2/issues/new/choose)**: 誤字脱字報告、改善提案、新トピック提案
2. **[Pull Request](https://github.com/boxi-rgb/living-book-engine-v2/compare)**: 直接的な改善貢献
3. **品質向上**: Markdown Lintによる自動品質チェック

### 3. AI自動出版システム

`simple-book-generator.js` スクリプトは、Google の Gemini API (1.5 Pro および 1.5 Flash モデル) を利用して、書籍のタイトル、章構成、各章の本文を動的に生成します。
実行には、プロジェクトルートに `.env` ファイルを作成し、有効な `GEMINI_API_KEY` を設定する必要があります。詳細は「環境変数」セクションを参照してください。

```bash
# AI書籍生成 (Gemini API利用)
# 例: node simple-book-generator.js self-help  (自己啓発カテゴリの書籍を1冊生成)
# 例: node simple-book-generator.js all         (定義済み全カテゴリの書籍を生成)
npm run generate-daily-book # (内部的に node simple-book-generator.js all を実行想定)

# KDP変換
npm run convert-to-kdp

# 全自動実行
npm run full-automation
```

## 📁 プロジェクト構造

```
📦 living-book-engine-v2/
├── 🤖 AI自動化システム/
│   ├── simple-book-generator.js      # AI書籍生成 (Gemini API連携、動的コンテンツ生成)
│   ├── gemini-api-service.js       # Gemini APIとの通信サービスクラス
│   ├── quick-kdp-converter.py        # EPUB変換（実証済み）
│   ├── automation-scheduler.js       # 自動化スケジューラー
│   └── docs/generated-books/         # AIにより生成された書籍が格納されるディレクトリ
│
├── 🤝 コミュニティシステム/
│   ├── .github/ISSUE_TEMPLATE/       # Issue テンプレート
│   ├── .github/workflows/            # CI/CD & Deploy
│   ├── .markdownlint.jsonc          # 品質管理設定
│   └── docs/.vitepress/              # サイト設定
│
├── 📚 コンテンツ/
│   ├── KDP_BlueOcean_Strategy.md     # 戦略文書
│   ├── COLLABORATION.md              # AI協業ログ
│   └── FINAL_DELIVERABLE.md          # 成果報告書
│
└── 🔧 設定ファイル/
    ├── package.json                  # 統合設定
    ├── requirements.txt              # Python依存関係
    └── .env.example                  # 環境変数テンプレート
```

## 🎨 特徴とメリット

### 💰 経済性
- **ゼロコスト運営**: GitHub/Vercel無料枠活用
- **収益化可能**: KDP自動出版による収益生成
- **持続可能性**: コミュニティ貢献とAI効率化の両立

### 🔄 持続性
- **自己進化**: 読者貢献による継続的改善
- **自動化**: AI技術による効率的なコンテンツ生成
- **品質保証**: ダブルチェックシステム（AI+人的）

### 🌍 拡張性
- **多言語対応**: コミュニティ翻訳+AI翻訳
- **複数フォーマット**: Web/EPUB/PDF対応
- **API化**: 将来的な外部システム連携

## 📊 実証済み成果

### 🏆 完成した書籍（3冊）
1. **『AI時代のセルフブランディング術』** (Self-Help)
2. **『スタートアップ成功の5つの法則』** (Business)  
3. **『AI活用で変わる働き方革命』** (Technology)

各書籍：
- ✅ **EPUB形式**: KDP準拠（約12KB）
- ✅ **5章構成**: 体系的な学習構造
- ✅ **実用的内容**: 即座に活用可能な具体的手法

### 📈 技術的成果
- ✅ **VitePress統合**: 高品質サイト生成
- ✅ **GitHub Actions**: 完全自動化パイプライン
- ✅ **品質管理**: Markdown Lint + AI校正
- ✅ **EPUB変換**: 標準準拠の変換システム

## 🤝 参加方法

### 読者として
- **[バグ報告](https://github.com/boxi-rgb/living-book-engine-v2/issues/new?template=bug_report.md)**
- **[機能要望](https://github.com/boxi-rgb/living-book-engine-v2/issues/new?template=feature_request.md)**
- **内容改善PR**: 誤字修正、内容追加、翻訳など

### 開発者として
- **AI システム改善**: 執筆品質向上、変換精度向上
- **UI/UX改善**: サイトデザイン、ユーザビリティ向上
- **新機能開発**: API開発、分析機能、モバイル対応

## 🔧 高度な設定

### AI自動化設定
```javascript
// 書籍生成カスタマイズ (将来的な拡張のための参考情報)
// 現在の simple-book-generator.js では、カテゴリはスクリプト内で定義されており (self-help, business, technology)、
// 文字数や品質基準、言語といった下記設定は直接利用されていません。
// 書籍の章数（現在は5章固定）や、より詳細な生成パラメータは simple-book-generator.js および
// gemini-api-service.js 内のプロンプトやロジックで制御されています。
// 主要な設定はプロジェクトルートの `config.json` ファイルで行います。
const config = {
  categories: ['self-help', 'business', 'technology'], // config.jsonで定義・カスタマイズ可能
  targetLength: 50000,  // 文字数 (現在参照されていません)
  qualityThreshold: 8,  // 品質基準（1-10）(現在参照されていません)
  languages: ['ja', 'en'] // (現在参照されていません。主に日本語で生成)
}
```

simple-book-generator.js は、内部的にGemini ProモデルとFlashモデルをタスク（書籍概要の生成、章本文の執筆など）に応じて使い分けています。ユーザーが直接モデルを指定する機能は現在のバージョンでは提供されていません。モデルの種類は `config.json` 内の `apiService` セクションで確認できます（現時点ではスクリプト内で直接参照はしていませんが、将来的な拡張のため）。

### `config.json` による設定

書籍生成の挙動は、プロジェクトルートにある `config.json` ファイルで詳細にカスタマイズできます。主な設定項目は以下の通りです。

*   `outputDir`: (オプション) 生成された書籍が格納されるディレクトリパス。デフォルトは `./docs/generated-books`。
*   `defaultNumChapters`: 生成される書籍のデフォルトの章数。
*   `categories`: 書籍カテゴリごとの設定。
    *   各カテゴリキー（例: `"self-help"`）に対して、以下の情報を設定します。
        *   `instruction`: そのカテゴリの書籍を生成する際のAIへの指示内容。
        *   `defaultTitle`: （現在未使用）AIがタイトル生成に失敗した場合などのフォールバック用。
    *   新しいカテゴリを追加する場合は、この `categories` オブジェクトに新しいキーと対応する `instruction` を追加してください。
*   `slugGeneration`: ファイルシステムで安全なディレクトリ名を生成する際のオプション。
    *   `maxLength`: 生成されるスラッグ（書籍タイトルから変換された部分）の最大長。
    *   `defaultSlug`: タイトルから有効なスラッグが生成できなかった場合のデフォルト値。
*   `apiService`: (将来的な参照用) AIモデルに関する設定。
    *   `proModel`: 使用する高性能モデル名。
    *   `flashModel`: 使用する高速・軽量モデル名。
    *   `defaultTemperature`: AI生成時のデフォルトの温度設定。

例: `config.json` の一部
```json
{
  "defaultNumChapters": 3,
  "categories": {
    "my-new-category": {
      "instruction": "私の新しいカスタムカテゴリに関する書籍のアイデア。",
      "defaultTitle": "カスタム書籍"
    },
    // ... 他のカテゴリ設定 ...
  },
  "slugGeneration": {
    "maxLength": 35,
    "defaultSlug": "custom-untitled"
  }
  // ...
}
```
このファイルを編集することで、コードを直接変更することなく、書籍生成の様々な側面を調整できます。

### 環境変数
```env
# AI API Keys（オプション - 高度な機能用）
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
# Google Gemini API Key (書籍生成に必要)
# Google AI Studio (https://aistudio.google.com/) でキーを取得し、
# プロジェクトルートに .env ファイルを作成して以下のように設定してください:
# GEMINI_API_KEY=YOUR_API_KEY_HERE
GEMINI_API_KEY=your_gemini_api_key_here

# 通知設定（オプション）
DISCORD_WEBHOOK=your_webhook_url
```

## 🚨 トラブルシューティング

### よくある問題
1. **Python環境**: `pip3 install -r requirements.txt`
2. **Node.js**: `npm install` または `npm run setup`
3. **権限エラー**: GitHubアクセストークン設定確認

### サポート
- **[GitHub Issues](https://github.com/boxi-rgb/living-book-engine-v2/issues)**
- **[Discussions](https://github.com/boxi-rgb/living-book-engine-v2/discussions)**

## 🔮 ロードマップ

### Phase 1 ✅ (完了)
- [x] コミュニティシステム基盤
- [x] AI執筆システム実証
- [x] KDP変換機能完成
- [x] 3冊の書籍完成

### Phase 2 🔄 (進行中)
- [ ] Webサイトデプロイ
- [ ] コミュニティ参加促進
- [ ] 品質向上システム
- [ ] 多言語対応準備

### Phase 3 🎯 (計画中)
- [ ] API公開
- [ ] 収益分配システム
- [ ] モバイルアプリ
- [ ] AI音声読み上げ

## 📜 ライセンス

**MIT License** - オープンソースで誰でも利用・改変可能

## 🏅 クレジット

**開発**: Claude AI + GEMINI AI 協業プロジェクト  
**コンセプト**: 読者共創型・自己進化出版の実現  
**目標**: 出版業界のデモクラタイゼーション

---

*🌟 一緒に出版の未来を創造しましょう！*

**Living Book Engine v2 - Where Books Come Alive**

# Last Updated: 2025-06-29 04:36:00 JST
