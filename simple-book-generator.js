#!/usr/bin/env node
/**
 * シンプル書籍生成システム (Gemini API連携版)
 */

const fs = require('fs');
const fsPromises = require('fs').promises; // fs.promises を別名でインポート
const path = require('path');
const GeminiApiService = require('./gemini-api-service');
const wanakana = require('wanakana');

// 設定ファイルの読み込み
// スクリプトの比較的早い段階で読み込む
let APP_CONFIG;
try {
  APP_CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
} catch (error) {
  console.error("設定ファイル (config.json) の読み込みまたはパースに失敗しました。", error);
  // 設定ファイルが読めない場合は致命的エラーとして終了する
  process.exit(1);
}

class SimpleBookGenerator {
  constructor() {
    this.outputDir = APP_CONFIG.outputDir || './docs/generated-books'; // 設定ファイルから取得、なければデフォルト
    if (!process.env.GEMINI_API_KEY) {
      console.error("エラー: GEMINI_API_KEY 環境変数が設定されていません。");
      console.error("プロジェクトルートに .env ファイルを作成し、GEMINI_API_KEY を設定してください。");
      console.error("例: GEMINI_API_KEY=YOUR_API_KEY_HERE");
      // APIキーがない場合は、致命的エラーとして処理を中断するか、あるいは限定的な動作にするか検討
      // ここでは初期化は許可し、呼び出し時にエラーが発生するようにする
      this.apiService = null;
    } else {
      try {
        this.apiService = new GeminiApiService();
      } catch (error) {
        console.error("GeminiApiService の初期化に失敗しました:", error.message);
        this.apiService = null;
      }
    }
    // カテゴリごとの指示とデフォルトタイトルを設定ファイルから取得
    this.categoriesConfig = APP_CONFIG.categories || {};
    this.numChapters = APP_CONFIG.defaultNumChapters || 5; // 設定ファイルから取得、なければデフォルト5
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
      console.error("GeminiApiService が初期化されていません。書籍概要を生成できません。");
      return null;
    }

    const categoryConfig = this.categoriesConfig[category];
    if (!categoryConfig || !categoryConfig.instruction) {
      console.error(`カテゴリ「${category}」の設定または指示が見つかりません。config.jsonを確認してください。`);
      // フォールバックとして汎用的な指示を使うか、エラーにするか。ここではエラーとする。
      throw new Error(`カテゴリ「${category}」の指示が設定ファイルにありません。`);
    }
    const categoryInstruction = categoryConfig.instruction;

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
      console.log(`カテゴリ「${category}」の書籍概要生成を Gemini Pro モデルにリクエストします...`);
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
        console.error("AIから返された書籍概要の形式が不正です:", outline);
        return null;
      }
      console.log(`書籍概要を正常に取得しました: 「${outline.book_title}」`);
      return outline;
    } catch (error) {
      console.error(`書籍概要の生成中にエラーが発生しました: ${error.message}`);
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
      console.error("GeminiApiService が初期化されていません。章の本文を生成できません。");
      return null;
    }

    const prompt = `
あなたはプロのライターです。以下の情報に基づいて、書籍「${bookTitle}」の第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文を執筆してください。
章の要約は「${chapterOutline.chapter_summary}」です。
この要約を元に、読者にとって有益で魅力的な内容をMarkdown形式で記述してください。
章の本文は、1つの主要なセクション（## 見出し で始めてください）と、それに続く2-3パラグラフの短い内容（全体で約200文字から300文字程度）で構成してください。
過度に長い内容は避けてください。
`;
    try {
      console.log(`「${bookTitle}」 - 第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文生成を Gemini Pro モデルにリクエストします...`);
      const chapterContent = await this.apiService.generateBookContent(
        prompt,
        'chapter_writing', // Proモデルを使うタスクタイプ
        {
          temperature: 0.7, // 少し抑えめに
          maxOutputTokens: 512 // 生成トークン数にも上限を設定
        }
      );
      console.log(`第${chapterOutline.chapter_number}章の本文を正常に取得しました。`);
      // 念のため、生成されたコンテンツの長さをチェック（デバッグ用）
      if (chapterContent && typeof chapterContent === 'string') {
        console.log(`生成された第${chapterOutline.chapter_number}章の本文の長さ: ${chapterContent.length}文字`);
        if (chapterContent.length < 50) { // あまりに短い場合は警告
            console.warn(`警告: 第${chapterOutline.chapter_number}章の本文が非常に短いです（50文字未満）。内容を確認してください。`);
            console.warn(`取得したコンテンツ: 「${chapterContent.substring(0,100)}...」`);
        }
      } else {
        console.warn(`警告: 第${chapterOutline.chapter_number}章の本文が期待した形式（文字列）ではありません。取得したコンテンツ:`, chapterContent);
        // 空文字列やnullでない不正な値の場合、エラーとみなすか、空文字列として扱うか検討。
        // ここでは一旦そのまま返し、呼び出し元で !chapterFullContent でチェックされる。
      }
      return chapterContent;
    } catch (error) {
      console.error(`第${chapterOutline.chapter_number}章の本文生成中にエラーが発生しました: ${error.message}`);
      // エラー発生時は null を返すことで、呼び出し元が失敗を検知できるようにする
      return null;
    }
  }


  async generateBook(category = 'self-help') {
    if (!this.apiService) {
      console.error("エラー: Gemini APIサービスが利用できません。書籍を生成できません。");
      console.error("GEMINI_API_KEYが正しく設定されているか確認してください。");
      throw new Error("Gemini APIサービスが利用不可なため、書籍生成を中止しました。");
    }
    console.log(`カテゴリ「${category}」の書籍生成を開始します...`);

    // 1. 書籍全体の概要（タイトル、各章のタイトルと要約）を生成
    const bookOutline = await this._generateBookOutline(category);
    if (!bookOutline) {
      throw new Error(`カテゴリ「${category}」の書籍概要の生成に失敗しました。`);
    }

    const bookTitle = bookOutline.book_title;
    const generatedChapters = [];

    // 2. 各章の詳細な本文を生成
    for (const chapterInfo of bookOutline.chapters) {
      console.log(`第${chapterInfo.chapter_number}章「${chapterInfo.chapter_title}」の処理を開始します...`);
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

    await fsPromises.mkdir(bookDir, { recursive: true });

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
    await fsPromises.writeFile(path.join(bookDir, 'index.md'), indexContent);
    // console.log(`[デバッグ] index.md の内容:\n${indexContent.substring(0, 200)}...`);


    // 各章のファイル作成
    for (let i = 0; i < generatedChapters.length; i++) {
      const chapter = generatedChapters[i];
      const chapterNumber = i + 1;
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
      await fsPromises.writeFile(
        path.join(bookDir, `chapter-${chapterNumber}.md`),
        chapterContentMarkdown
      );
      // console.log(`[デバッグ] chapter-${chapterNumber}.md の内容:\n${chapterContentMarkdown.substring(0, 200)}...`);
    }

    console.log(`🎉 書籍「${bookTitle}」の生成が完了しました！`);
    console.log(`📁 パス: ${bookDir}`);
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
    const categories = ['self-help', 'business', 'technology']; // 既存のカテゴリ
    const results = [];

    if (!this.apiService) {
      console.error("エラー: Gemini APIサービスが利用できません。複数書籍の生成を中止します。");
      return results; // 空の結果を返す
    }

    for (const category of categories) {
      try {
        console.log(`\n--- カテゴリ「${category}」の書籍生成を開始します ---`);
        const result = await this.generateBook(category);
        results.push(result);
        console.log(`✅ カテゴリ「${category}」の書籍「${result.title}」生成完了`);
      } catch (error) {
        console.error(`❌ カテゴリ「${category}」の書籍生成中に致命的なエラーが発生しました:`, error.message);
        results.push({ success: false, category, title: `生成失敗 (${category})`, error: error.message });
      }
    }
    return results;
  }
}

// CLI実行
if (require.main === module) {
  const generator = new SimpleBookGenerator();
  
  const args = process.argv.slice(2);
  const category = args[0] || 'self-help';

  if (category === 'all') {
    generator.generateMultipleBooks()
      .then(results => {
        console.log('\n📊 生成結果:');
        results.forEach(result => {
          if (result.success) {
            console.log(`✅ ${result.category}: ${result.title} (${result.chapters}章)`);
          } else {
            console.log(`❌ ${result.category}: ${result.error}`);
          }
        });
      })
      .catch(console.error);
  } else {
    generator.generateBook(category)
      .then(result => {
        console.log('🎉 書籍生成完了!');
        console.log(`📖 タイトル: ${result.title}`);
        console.log(`📁 パス: ${result.bookPath}`);
        console.log(`📄 章数: ${result.chapters}`);
      })
      .catch(console.error);
  }
}

module.exports = SimpleBookGenerator;

// Last Updated: 2025-07-08 19:35:29 UTC