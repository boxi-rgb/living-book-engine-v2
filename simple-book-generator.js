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

// 設定ファイルの読み込み
// スクリプトの比較的早い段階で読み込む
let APP_CONFIG;
let rawConfigContent = ""; // 生のファイル内容を保持する変数
try {
  rawConfigContent = fs.readFileSync('./config.json', 'utf-8');
  Logger.debug("読み込まれた config.json の生の内容:", rawConfigContent.substring(0, 500) + "..."); // 先頭500文字だけ表示
  APP_CONFIG = JSON.parse(rawConfigContent);
  Logger.info("設定ファイル config.json を正常に読み込みました。");
} catch (error) {
  Logger.error("設定ファイル (config.json) の読み込みまたはパースに失敗しました。", error.message);
  Logger.error("読み込もうとしたファイル内容 (raw):", rawConfigContent.substring(0,500) + "...");
  Logger.error("詳細:", error); // エラーオブジェクト全体も出力
  // 設定ファイルが読めない場合は致命的エラーとして終了する
  process.exit(1);
}

class SimpleBookGenerator {
  constructor() {
    this.outputDir = APP_CONFIG.outputDir || './docs/generated-books'; // 設定ファイルから取得、なければデフォルト
    Logger.info(`出力先ディレクトリ: ${this.outputDir}`);

    if (!process.env.GEMINI_API_KEY) {
      Logger.error("致命的エラー: GEMINI_API_KEY 環境変数が設定されていません。");
      Logger.error("プロジェクトルートに .env ファイルを作成し、GEMINI_API_KEY を設定してください。例: GEMINI_API_KEY=YOUR_API_KEY_HERE");
      // APIキーがない場合は、致命的エラーとして処理を中断する
      throw new Error("GEMINI_API_KEYが未設定です。処理を中断します。");
    }

    try {
      this.apiService = new GeminiApiService(); // GeminiApiService内でAPIキーチェックとエラー発生
      Logger.info("GeminiApiService の初期化に成功しました。");
    } catch (error) {
      // GeminiApiServiceのコンストラクタがエラーをスローするので、ここでキャッチする
      Logger.error("GeminiApiService の初期化に失敗しました:", error.message);
      this.apiService = null; // 明示的にnullを設定
      throw error; // エラーを再スローして処理を中断
    }

    // カテゴリごとの指示とデフォルトタイトルを設定ファイルから取得
    this.categoriesConfig = APP_CONFIG.categories || {};
    Logger.debug("APP_CONFIG.categories:", APP_CONFIG.categories); // デバッグログ追加
    Logger.debug("this.categoriesConfig:", this.categoriesConfig); // デバッグログ追加
    this.numChapters = APP_CONFIG.defaultNumChapters || 5; // 設定ファイルから取得、なければデフォルト5
    Logger.info(`デフォルトの章数: ${this.numChapters}`);
    Logger.info(`利用可能なカテゴリ: ${Object.keys(this.categoriesConfig).join(', ')}`);
  }

  /**
   * 安全なファイルスラッグを生成する
   * @param {string} title 元のタイトル
   * @returns {string} 生成されたスラッグ
   */
  _generateSafeSlug(title) {
    const slugConfig = APP_CONFIG.slugGeneration || {};
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
      return null;
    }

    const categoryConfig = this.categoriesConfig[category];
    if (!categoryConfig || !categoryConfig.instruction) {
      Logger.error(`カテゴリ「${category}」の設定または指示が見つかりません。config.jsonを確認してください。`);
      throw new Error(`カテゴリ「${category}」の指示が設定ファイルにありません。`);
    }
    const categoryInstruction = categoryConfig.instruction;
    Logger.info(`カテゴリ「${category}」の書籍概要生成を開始します。指示: 「${categoryInstruction.substring(0, 50)}...」`);

    const prompt = `
あなたはプロの書籍編集者です。以下の指示に基づいて、新しい書籍のタイトルと${this.numChapters}章構成の各章のタイトルおよび短い要約（各章1-2文程度）を提案してください。
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
      if (!outline || !outline.book_title || !outline.chapters || outline.chapters.length !== this.numChapters) {
        Logger.error("AIから返された書籍概要の形式が不正です。または期待した章数と異なります。", "期待章数:", this.numChapters, "実際の章数:", outline && outline.chapters ? outline.chapters.length : 'N/A', "概要:", outline);
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

    const prompt = `
あなたはプロのライターです。以下の情報に基づいて、書籍「${bookTitle}」の第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文を執筆してください。
章の要約は「${chapterOutline.chapter_summary}」です。
この要約を元に、読者にとって有益で魅力的な内容をMarkdown形式で記述してください。
章の本文は、1つの主要なセクション（## 見出し で始めてください）と、それに続く2-3パラグラフの短い内容（全体で約200文字から300文字程度）で構成してください。
過度に長い内容は避けてください。
`;
    try {
      Logger.debug(`第${chapterOutline.chapter_number}章 本文生成プロンプト:`, prompt.substring(0, 200) + "...");
      const chapterContent = await this.apiService.generateBookContent(
        prompt,
        'chapter_writing', // Proモデルを使うタスクタイプ
        {
          temperature: 0.7, // 少し抑えめに
          maxOutputTokens: 512 // 生成トークン数にも上限を設定
        }
      );
      // Logger.info(`第${chapterOutline.chapter_number}章の本文を正常に取得しました。`); // Logger.infoに移動済みなのでこれは不要
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
    generator = new SimpleBookGenerator();
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