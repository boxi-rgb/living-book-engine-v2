#!/usr/bin/env node
/**
 * シンプル書籍生成システム (Gemini API連携版)
 */

const fs = require('fs');
const fsPromises = require('fs').promises; // fs.promises を別名でインポート
const path = require('path');
const GeminiApiService = require('./gemini-api-service');
const wanakana = require('wanakana');
const Logger = require('./logger'); // Loggerを別ファイルからインポート

// 設定ファイルの読み込み - グローバルではなく、クラスの初期化時に行うことを検討
// または、このスクリプトの主要なロジックがクラスメソッド内やCLI実行部分に集約されているため、
// APP_CONFIGをトップレベルスコープに置くのは現状維持でも可。
// APP_CONFIG のトップレベルでの読み込みを削除

class SimpleBookGenerator {
  constructor(isTestMode = false) {
    this.isTestMode = isTestMode;

    if (isTestMode) {
      Logger.warn("テストモード: APP_CONFIGをモックします。");
      this.APP_CONFIG = {
        outputDir: './docs/generated-books-test',
        defaultNumChapters: 1, // プロンプトテスト用に1章
        categories: {
          "self-help": {
            "instruction": "自己啓発分野で、読者が具体的な行動を起こせるような実践的ガイドブックのアイデア。特に、日常生活で直面する小さな悩みや課題を解決し、前向きな気持ちになれるような内容が望ましい。",
            "defaultTitle": "（テスト用自己啓発タイトル）"
          },
          "business": { // 他のカテゴリもテストで使う可能性を考慮
            "instruction": "ビジネス分野、特に中小企業の経営者や個人事業主が明日から使える、具体的な経営改善やマーケティング戦略に関する書籍のアイデア。",
            "defaultTitle": "（テスト用ビジネス書タイトル）"
          }
        },
        slugGeneration: {
          maxLength: 40,
          defaultSlug: "test-untitled-book"
        },
        apiService: {
          proModel: "gemini-2.5-pro",
          flashModel: "gemini-2.5-flash",
          "defaultTemperature": 0.7
        }
      };
    } else {
      // 通常実行時はファイルから読み込む
      try {
        const rawConfigContent = fs.readFileSync('./config.json', 'utf-8');
        this.APP_CONFIG = JSON.parse(rawConfigContent);
        Logger.info("設定ファイル config.json を正常に読み込みました。");
        // Logger.debug("[Constructor] Parsed APP_CONFIG:", JSON.stringify(this.APP_CONFIG, null, 2).substring(0, 500) + "...");
        // Logger.debug("[Constructor] APP_CONFIG.categories:", this.APP_CONFIG.categories);
      } catch (error) {
        Logger.error("設定ファイル (config.json) の読み込みまたはパースに失敗しました。", error.message);
        Logger.error("詳細:", error);
        process.exit(1);
      }
    }

    this.outputDir = (this.APP_CONFIG.outputDir || './docs/generated-books');
    if (!isTestMode) Logger.info(`出力先ディレクトリ: ${this.outputDir}`);

    if (!process.env.GEMINI_API_KEY) {
      if (!isTestMode) Logger.error("致命的エラー: GEMINI_API_KEY 環境変数が設定されていません。");
      // Logger.error("プロジェクトルートに .env ファイルを作成し、GEMINI_API_KEY を設定してください。例: GEMINI_API_KEY=YOUR_API_KEY_HERE");
      throw new Error("GEMINI_API_KEYが未設定です。処理を中断します。");
    }

    try {
      this.apiService = new GeminiApiService(this.APP_CONFIG); // this.APP_CONFIG を渡す
      if (!isTestMode) Logger.info("GeminiApiService の初期化に成功しました。");
    } catch (error) {
      if (!isTestMode) Logger.error("GeminiApiService の初期化に失敗しました:", error.message);
      this.apiService = null;
      throw error;
    }

    this.categoriesConfig = this.APP_CONFIG.categories || {};
    // Logger.debug("APP_CONFIG.categories:", this.APP_CONFIG.categories);
    // Logger.debug("this.categoriesConfig:", this.categoriesConfig);
    this.numChapters = (this.APP_CONFIG.defaultNumChapters || 5);

    // プロンプトテスト用にnumChaptersを1に上書き（isTestModeはCLI実行時は通常falseなので、別のフラグや条件が必要かも）
    // 今回はCLI実行時に'test-prompt'のような特殊なカテゴリ引数を渡すことで判定するなどを検討できるが、
    // 一旦、章本文プロンプトのテストに集中するため、引き続き this.numChapters = 1; を直接使う。
    // ただし、CLIから'all'以外で呼ばれた場合にのみ1にするなど、もう少し工夫が必要。
    // 今回は、呼び出し側で制御すると仮定し、ここではAPP_CONFIGの値を優先する。
    // テスト実行時は、テストコード側でコンストラクタ引数 isTestMode を true にして、
    // さらに numChapters をテスト用に上書きする想定。
    // CLIからの直接実行テストでは、config.jsonのdefaultNumChaptersを1にする。
    // プロンプトテストモードの場合、章数は _generateBookOutline で動的に変更される可能性があるため、
    // ここでは isTestMode フラグに基づいてログ出力を調整する。
    if (isTestMode) {
      Logger.warn(`テストモード: APP_CONFIGはモックされています。章数やカテゴリ指示はテスト用に設定されます。`);
      Logger.info(`(テスト用)デフォルトの章数: ${this.numChapters}`);
      Logger.info(`(テスト用)利用可能なカテゴリ: ${Object.keys(this.categoriesConfig).join(', ')}`);
    } else {
      Logger.info(`デフォルトの章数 (config.jsonより): ${this.numChapters}`);
      Logger.info(`利用可能なカテゴリ (config.jsonより): ${Object.keys(this.categoriesConfig).join(', ')}`);
    }
  }

  /**
   * 安全なファイルスラッグを生成する
   * @param {string} title 元のタイトル
   * @returns {string} 生成されたスラッグ
   */
  _generateSafeSlug(title) {
    const slugConfig = (this.APP_CONFIG && this.APP_CONFIG.slugGeneration) ? this.APP_CONFIG.slugGeneration : {};
    const defaultSlug = slugConfig.defaultSlug || 'untitled-book';
    const maxLength = slugConfig.maxLength || 40;

    if (!title || typeof title !== 'string') {
      return defaultSlug;
    }

    // 1. wanakanaでローマ字に変換 (IMEModeを有効に)
    let slug = wanakana.toRomaji(title, { IMEMode: true });

    // 2. 小文字化
    slug = slug.toLowerCase();

    // 3. 英数字以外の文字をすべてハイフンに置換 (スペースも含む)
    slug = slug.replace(/[^a-z0-9]/g, '-');

    // 4. 連続するハイフンを単一のハイフンに
    slug = slug.replace(/-+/g, '-');

    // 5. 先頭と末尾のハイフンを削除
    slug = slug.replace(/^-+|-+$/g, '');

    // 6. 最大長に切り詰める
    if (slug.length > maxLength) {
      slug = slug.substring(0, maxLength);
      slug = slug.replace(/-+$/g, '');
    }

    // 7. 結果が空文字列またはハイフンのみになった場合はデフォルト値を返す
    if (!slug || slug === '-') {
      return defaultSlug;
    }

    return slug;
  }

  /**
   * 書籍全体の構成（タイトル、各章のタイトルと短い要約）をAIに生成させる
   * @param {string} category 書籍のカテゴリ
   * @returns {Promise<object|null>} 書籍のタイトルと章構成オブジェクト、またはエラー時null
   */
  async _generateBookOutline(category) {
    if (!this.apiService) {
      // Logger.errorは既にあるので、重複したconsole.errorを削除
      Logger.error("GeminiApiService が初期化されていません。書籍概要を生成できません。");
      Logger.error("GeminiApiService が初期化されていません。書籍概要を生成できません。");
      return null;
    }

    // カテゴリ指示の取得（コンストラクタで this.categoriesConfig が設定される前提）
    const categoryConfig = this.categoriesConfig[category];
    let categoryInstruction;
    let currentNumChapters = this.numChapters; // 通常の章数をまず取得

    if (this.isTestMode && category === 'self-help') {
        // プロンプトテストモードでは、self-helpカテゴリの指示をハードコードし、章数を1に固定
        Logger.warn("プロンプトテストモード: 'self-help' カテゴリの指示をハードコードし、章数を1に固定します。");
        categoryInstruction = "自己啓発分野で、読者が具体的な行動を起こせるような実践的ガイドブックのアイデア。特に、日常生活で直面する小さな悩みや課題を解決し、前向きな気持ちになれるような内容が望ましい。";
        currentNumChapters = 1; // この呼び出しでのみ章数を1に
    } else if (categoryConfig && categoryConfig.instruction) {
        categoryInstruction = categoryConfig.instruction;
    } else {
        Logger.error(`カテゴリ「${category}」の設定または指示が見つかりません。config.jsonを確認してください。`);
        throw new Error(`カテゴリ「${category}」の指示が設定ファイルにありません。`);
    }
    Logger.info(`カテゴリ「${category}」の書籍概要生成を開始します。指示 (先頭50文字):「${categoryInstruction.substring(0, 50)}...」章数: ${currentNumChapters}`);

    const prompt = `
あなたはプロの書籍編集者です。以下の指示に基づいて、新しい書籍のタイトルと${currentNumChapters}章構成の各章のタイトルおよび短い要約（各章1-2文程度）を提案してください。
出力は必ず指定されたJSONスキーマに従ってください。

書籍のテーマ: ${categoryInstruction}
書籍のカテゴリ: ${category}
章の数: ${this.numChapters}

JSONスキーマ:
{
  "type": "OBJECT",
  "properties": {
    "book_title": { "type": "STRING", "description": "書籍全体のタイトル" },
    "chapters": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "chapter_number": { "type": "NUMBER", "description": "章番号 (1から開始)" },
          "chapter_title": { "type": "STRING", "description": "この章のタイトル" },
          "chapter_summary": { "type": "STRING", "description": "この章の短い要約（1-2文）" }
        },
        "required": ["chapter_number", "chapter_title", "chapter_summary"]
      },
      "minItems": ${this.numChapters},
      "maxItems": ${this.numChapters}
    }
  },
  "required": ["book_title", "chapters"]
}
`;
    try {
      // console.log は Logger.info に置き換えるか、より詳細なデバッグログとする
      Logger.debug(`カテゴリ「${category}」の書籍概要生成プロンプト:`, prompt.substring(0, 200) + "...");
      const outline = await this.apiService.generateBookContent(
        prompt,
        'plot_development', // Proモデルを使うタスクタイプ
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              book_title: { type: "STRING" },
              chapters: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    chapter_number: { type: "NUMBER" },
                    chapter_title: { type: "STRING" },
                    chapter_summary: { type: "STRING" }
                  },
                  required: ["chapter_number", "chapter_title", "chapter_summary"]
                }
              }
            },
            required: ["book_title", "chapters"]
          },
          temperature: 0.7 // 創造性を少し持たせる
        }
      );
      // 簡単なバリデーション
      if (!outline || !outline.book_title || !outline.chapters || outline.chapters.length !== currentNumChapters) { // this.numChapters を currentNumChapters に変更
        Logger.error("AIから返された書籍概要の形式が不正です。または期待した章数と異なります。", "期待章数:", currentNumChapters, "実際の章数:", outline && outline.chapters ? outline.chapters.length : 'N/A', "概要:", outline);
        return null;
      }
      Logger.info(`書籍概要を正常に取得しました: 「${outline.book_title}」 (${outline.chapters.length}章)`);
      return outline;
    } catch (error) {
      Logger.error(`書籍概要の生成中にエラーが発生しました (カテゴリ: ${category}):`, error.message);
      Logger.debug("エラー詳細 (書籍概要生成):", error);
      return null;
    }
  }

  /**
   * 指定された章タイトルと要約に基づいて、章の詳細な本文をAIに生成させる
   * @param {string} bookTitle 書籍全体のタイトル
   * @param {object} chapterOutline 章のタイトルと要約を含むオブジェクト
   * @returns {Promise<string|null>} 生成された章の本文（Markdown形式）、またはエラー時null
   */
  async _generateChapterFullContent(bookTitle, chapterOutline) {
    if (!this.apiService) {
      Logger.error("GeminiApiService が初期化されていません。章の本文を生成できません。");
      return null;
    }
    Logger.info(`書籍「${bookTitle}」 - 第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文生成を開始します。`);
    Logger.debug(`章の要約（プロンプト用）: 「${chapterOutline.chapter_summary}」`);

    Logger.debug(`章の要約（プロンプト用）: 「${chapterOutline.chapter_summary}」`);

    // ★改善案2のプロンプトに戻す
    const prompt = `
あなたは経験豊富なテクニカルライターであり、複雑な情報を分かりやすく説明する専門家です。
書籍「${bookTitle}」の第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文を、以下の要約に基づいて執筆してください。

章の要約: ${chapterOutline.chapter_summary}

執筆の際は、以下のMarkdown構造とスタイルに従ってください。
- 章全体のタイトルとして "# ${chapterOutline.chapter_title}" を使用します。
- 章は複数の主要セクション（"## セクションタイトル"）に分け、各セクションには少なくとも2つ以上の段落を含めてください。
- 必要であれば、サブセクション（"### サブセクションタイトル"）も使用可能です。
- 箇条書きリスト（"- 項目1\\n- 項目2"）や番号付きリスト（"1. ステップ1\\n2. ステップ2"）を効果的に使用して情報を整理してください。
- 重要なキーワードは太字（"**キーワード**"）で強調してください。
- 全体として、読者が理解しやすく、かつ実践的な知識が得られるように、約400～600文字程度の本文を目指してください。

例えば、以下のような構造を参考にしてください（これはあくまで構造の例であり、内容は要約に合わせてください）：
# ${chapterOutline.chapter_title}
## 導入と本章の目的
（ここに導入文。本章で何を学ぶかなど。）
## ${chapterOutline.chapter_title}における主要概念A
（概念Aに関する説明。2段落以上。）
### 概念Aの具体例
（具体例やケーススタディなど。）
## ${chapterOutline.chapter_title}における主要概念B
（概念Bに関する説明。2段落以上。）
  - ポイント1
  - ポイント2
## まとめと次のステップ
（本章のまとめと、読者が次に行うべきことなど。）

上記例を参考に、章の要約「${chapterOutline.chapter_summary}」に基づいて本文を生成してください。
`;
    try {
      Logger.info(`第${chapterOutline.chapter_number}章 本文生成プロンプト (改善案2) を使用します。`);
      Logger.debug(`第${chapterOutline.chapter_number}章 本文生成プロンプト (改善案2):`, prompt.substring(0, 500) + "...");
      const chapterContent = await this.apiService.generateBookContent(
        prompt,
        'chapter_writing', // Proモデルを使うタスクタイプ
        {
          temperature: 0.7,
          maxOutputTokens: 512
        }
      );
      // Logger.info(`第${chapterOutline.chapter_number}章の本文を正常に取得しました。`);
      // 念のため、生成されたコンテンツの長さをチェック（デバッグ用）
      if (chapterContent && typeof chapterContent === 'string') {
        Logger.debug(`生成された第${chapterOutline.chapter_number}章の本文の長さ: ${chapterContent.length}文字`);
        if (chapterContent.length < 50) { // あまりに短い場合は警告
            Logger.warn(`警告: 第${chapterOutline.chapter_number}章の本文が非常に短いです（50文字未満）。内容を確認してください。`);
            Logger.warn(`取得したコンテンツ（冒頭）: 「${chapterContent.substring(0,100)}...」`);
        }
      } else {
        // このログは既にLogger.warnに置き換えられているので、重複を避ける
        // Logger.warn(`警告: 第${chapterOutline.chapter_number}章の本文が期待した形式（文字列）ではありません。`, "取得したコンテンツの型:", typeof chapterContent, "内容:", chapterContent);
      }
      Logger.info(`第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文の取得処理が完了しました。`); // メッセージを少し変更
      return chapterContent;
    } catch (error) {
      Logger.error(`第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文生成中にエラーが発生しました:`, error.message);
      Logger.debug("エラー詳細 (章本文生成):", error);
      return null;
    }
  }


  async generateBook(category = 'self-help') {
    Logger.info(`カテゴリ「${category}」の書籍生成プロセスを開始します...`);
    if (!this.apiService) {
      // このエラーはコンストラクタで捕捉されスローされるはずだが、念のため
      Logger.error("致命的エラー: Gemini APIサービスが利用できません。書籍を生成できません。");
      throw new Error("Gemini APIサービスが初期化されていないため、書籍生成を中止しました。");
    }

    // 1. 書籍全体の概要（タイトル、各章のタイトルと要約）を生成
    const bookOutline = await this._generateBookOutline(category);
    if (!bookOutline) {
      throw new Error(`カテゴリ「${category}」の書籍概要の生成に失敗しました。`);
    }

    const bookTitle = bookOutline.book_title;
    const generatedChapters = [];

    // 2. 各章の詳細な本文を生成
    for (const chapterInfo of bookOutline.chapters) {
      // Logger.info(`第${chapterInfo.chapter_number}章「${chapterInfo.chapter_title}」の処理を開始します...`); // _generateChapterFullContent内で同様のログが出るためコメントアウト
      const chapterFullContent = await this._generateChapterFullContent(bookTitle, chapterInfo);
      // chapterFullContent が null (APIエラーなど) の場合はエラーとするが、空文字列 "" は許容する
      if (chapterFullContent === null) {
        throw new Error(`第${chapterInfo.chapter_number}章「${chapterInfo.chapter_title}」の本文生成中にAPIエラーまたは致命的な問題が発生しました。`);
      }
      // 空文字列の場合でも、処理は継続し、空の章として扱う
      // （必要であれば、ここで固定の代替テキストを設定することも可能）
      // if (chapterFullContent === "") {
      //   console.warn(`警告: 第${chapterInfo.chapter_number}章の本文が空でした。`);
      // }
      generatedChapters.push({
        title: chapterInfo.chapter_title, // AIが生成した章タイトル
        content: chapterFullContent     // AIが生成した章本文
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const safeBookTitleForSlug = this._generateSafeSlug(bookTitle); // 新しいスラッグ生成関数を呼び出す
    const bookSlug = `${category}-${safeBookTitleForSlug}-${timestamp}`;
    const bookDir = path.join(this.outputDir, bookSlug);

    try {
      await fsPromises.mkdir(bookDir, { recursive: true });
      Logger.info(`書籍ディレクトリを作成しました: ${bookDir}`);
    } catch (error) {
      Logger.error(`書籍ディレクトリの作成に失敗しました: ${bookDir}`, error.message);
      Logger.debug("エラー詳細 (mkdir):", error);
      throw error; // ディレクトリ作成失敗は致命的として再スロー
    }

    // index.md作成 (AIが生成したタイトルと章構成を使用)
    const indexContent = `---
title: ${bookTitle}
description: ${category}分野のAI生成ガイドブック - ${bookTitle}
author: Gemini AI Generated Content
category: ${category}
keywords: ${category}, ${bookTitle.split(' ').join(', ')}, AI書籍
published: ${new Date().toISOString()}
language: ja
pages: ${generatedChapters.length + 1}
---

# ${bookTitle}

## 📖 書籍について

本書「${bookTitle}」は、${category}分野における実践的なガイドブックとして、最新のAI技術（Google Gemini）を活用して生成されました。読者の皆様に実用的な知識と具体的な手法を提供することを目指しています。

## 🎯 対象読者

- ${category}分野での知識を深めたい方
- ${bookTitle}に関心のある方
- AIによるコンテンツ生成の可能性を探求したい方

## 📚 目次

${generatedChapters.map((chapter, index) =>
  `${index + 1}. [${chapter.title}](./chapter-${index + 1}.md)`
).join('\n')}

---

*この書籍が皆様の学習と成長のお役に立てることを願っています。*

**生成日時**: ${new Date().toLocaleString('ja-JP')}
`;
    const indexPath = path.join(bookDir, 'index.md');
    try {
      await fsPromises.writeFile(indexPath, indexContent);
      Logger.info(`目次ファイルを作成しました: ${indexPath}`);
    } catch (error) {
      Logger.error(`目次ファイルの作成に失敗しました: ${indexPath}`, error.message);
      Logger.debug("エラー詳細 (writeFile index.md):", error);
      throw error; // index.md作成失敗も致命的
    }

    // 各章のファイル作成
    for (let i = 0; i < generatedChapters.length; i++) {
      const chapter = generatedChapters[i];
      const chapterNumber = i + 1;
      const chapterFilePath = path.join(bookDir, `chapter-${chapterNumber}.md`);
      const chapterContentMarkdown = `---
title: ${chapter.title}
chapter: ${chapterNumber}
book_title: ${bookTitle}
prev: ${i === 0 ? 'index' : `chapter-${i}`}
next: ${i === generatedChapters.length - 1 ? '' : `chapter-${i + 2}`}
---

# ${chapter.title}

${chapter.content}

---

**前の章**: [${i === 0 ? 'はじめに (書籍の目次)' : `第${i}章 ${generatedChapters[i-1].title}`}](${i === 0 ? 'index' : `chapter-${i}`}.md)
**次の章**: [${i === generatedChapters.length - 1 ? '書籍の目次に戻る' : `第${i + 2}章 ${generatedChapters[i+1] ? generatedChapters[i+1].title : ''}`}](${i === generatedChapters.length - 1 ? 'index' : `chapter-${i + 2}`}.md)

*第${chapterNumber}章「${chapter.title}」完了 - 全${generatedChapters.length}章中*
`;
      try {
        await fsPromises.writeFile(chapterFilePath, chapterContentMarkdown);
        Logger.info(`第${chapterNumber}章のファイルを作成しました: ${chapterFilePath}`);
      } catch (error) {
        Logger.error(`第${chapterNumber}章のファイル作成に失敗しました: ${chapterFilePath}`, error.message);
        Logger.debug(`エラー詳細 (writeFile chapter-${chapterNumber}.md):`, error);
        // 個々の章ファイル書き込み失敗は、全体を致命的エラーとせず警告に留めることも可能
        // ここでは一旦再スローする
        throw error;
      }
    }

    Logger.info(`🎉 書籍「${bookTitle}」の全ファイル生成が正常に完了しました！`);
    Logger.info(`📁 パス: ${bookDir}`);
    return {
      success: true,
      bookPath: bookDir,
      title: bookTitle,
      chapters: generatedChapters.length,
      category: category,
      slug: bookSlug
    };
  }

  async generateMultipleBooks() {
    // const categories = ['self-help', 'business', 'technology']; // 古い定義を削除
    const results = [];

    if (!this.apiService) {
      Logger.error("エラー: Gemini APIサービスが利用できません。複数書籍の生成を中止します。"); // Loggerを使用
      return results; // 空の結果を返す
    }

    // 利用可能な全カテゴリを取得
    const categories = Object.keys(this.categoriesConfig);
    if (categories.length === 0) {
      Logger.warn("設定ファイルに処理可能なカテゴリが定義されていません。");
      return results;
    }
    Logger.info(`複数書籍生成を開始します。対象カテゴリ: ${categories.join(', ')}`);

    for (const category of categories) {
      try {
        // 各カテゴリ生成前にログ出力
        // Logger.info(`\n--- カテゴリ「${category}」の書籍生成を開始します ---`); // generateBook冒頭で同様のログが出るので重複を避ける
        const result = await this.generateBook(category);
        results.push(result);
        Logger.info(`✅ カテゴリ「${category}」の書籍「${result.title}」の生成処理が正常に完了しました。`);
      } catch (error) {
        Logger.error(`❌ カテゴリ「${category}」の書籍生成中にエラーが発生しました:`, error.message);
        Logger.debug("エラー詳細 (generateMultipleBooks ループ内):", error);
        results.push({ success: false, category, title: `生成失敗 (${category})`, error: error.message });
      }
    }
    Logger.info("複数書籍の生成プロセスが完了しました。");
    return results;
  }
}

// CLI実行
if (require.main === module) {
  Logger.info("SimpleBookGenerator CLI実行開始");
  let generator;
  try {
    // CLIからの直接実行時は isTestMode を true にしてプロンプトテストを行う
    const isPromptTestMode = (process.argv.includes('--prompt-test'));
    generator = new SimpleBookGenerator(isPromptTestMode);
    if(isPromptTestMode) Logger.warn("プロンプトテストモードで実行中です。APP_CONFIGはモックされ、章数は1になります。");

  } catch (e) {
    // コンストラクタでAPIキーや設定ファイルエラーがスローされた場合
    Logger.error("SimpleBookGeneratorの初期化に失敗したため、処理を終了します。", e.message);
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const categoryArg = args[0];

  if (!categoryArg) {
    Logger.warn("引数が指定されていません。デフォルトカテゴリ 'self-help' で実行します。");
    Logger.warn("全カテゴリを生成する場合は 'all' を指定してください。");
  }
  const categoryToGenerate = categoryArg || 'self-help';


  if (categoryToGenerate.toLowerCase() === 'all') {
    Logger.info("全カテゴリの書籍を生成します...");
    generator.generateMultipleBooks()
      .then(results => {
        Logger.info('\n📊複数書籍生成結果:');
        results.forEach(result => {
          if (result.success) {
            Logger.info(`✅ ${result.category}: 「${result.title}」 (${result.chapters}章) - パス: ${result.bookPath}`);
          } else {
            Logger.error(`❌ ${result.category}: 生成失敗 - ${result.error}`);
          }
        });
        Logger.info("CLI実行完了 (all)");
      })
      .catch(error => {
        Logger.error("generateMultipleBooks で予期せぬエラーが発生しました:", error.message);
        Logger.debug("エラー詳細 (generateMultipleBooks catch):", error);
        process.exit(1);
      });
  } else {
    if (!generator.categoriesConfig[categoryToGenerate]) {
      Logger.error(`指定されたカテゴリ「${categoryToGenerate}」は設定ファイルに存在しません。`);
      Logger.info(`利用可能なカテゴリ: ${Object.keys(generator.categoriesConfig).join(', ')}`);
      process.exit(1);
    }
    Logger.info(`カテゴリ「${categoryToGenerate}」の書籍を生成します...`);
    generator.generateBook(categoryToGenerate)
      .then(result => {
        Logger.info('🎉 書籍生成完了!');
        Logger.info(`📖 タイトル: ${result.title}`);
        Logger.info(`📁 パス: ${result.bookPath}`);
        Logger.info(`📄 章数: ${result.chapters}`);
        Logger.info(`CLI実行完了 (${categoryToGenerate})`);
      })
      .catch(error => {
        Logger.error(`generateBook (${categoryToGenerate}) で予期せぬエラーが発生しました:`, error.message);
        Logger.debug(`エラー詳細 (generateBook ${categoryToGenerate} catch):`, error);
        process.exit(1);
      });
  }
}

module.exports = SimpleBookGenerator;

// Last Updated: 2025-07-08 19:35:29 UTC