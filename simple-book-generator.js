#!/usr/bin/env node
/**
 * シンプル書籍生成システム (Gemini API連携版)
 */

const fs = require('fs').promises;
const path = require('path');
const GeminiApiService = require('./gemini-api-service'); // Gemini APIサービスをインポート

class SimpleBookGenerator {
  constructor() {
    this.outputDir = './docs/generated-books';
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
    // カテゴリごとの大まかなテーマや指示。詳細はAIが生成する。
    this.categoryInstructions = {
      'self-help': "自己啓発分野で、読者が具体的な行動を起こせるような実践的ガイドブックのアイデア。",
      'business': "ビジネス分野、特にスタートアップや中小企業経営者向けの成功戦略に関する書籍のアイデア。",
      'technology': "最新技術トレンド（例: AI、Web3、メタバースなど）が仕事や社会に与える影響と活用法に関する書籍のアイデア。"
    };
    this.numChapters = 5; // 生成する章の数
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

    const categoryInstruction = this.categoryInstructions[category] || `一般的な ${category} 分野の書籍のアイデア。`;
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
章の本文は、複数のセクション（例: ## 見出し）で構成し、必要に応じてリストや強調表現も使用してください。
最低でも500文字程度の十分なボリュームで執筆してください。
`;
    try {
      console.log(`「${bookTitle}」 - 第${chapterOutline.chapter_number}章「${chapterOutline.chapter_title}」の本文生成を Gemini Pro モデルにリクエストします...`);
      const chapterContent = await this.apiService.generateBookContent(
        prompt,
        'chapter_writing', // Proモデルを使うタスクタイプ
        {
          temperature: 0.75, // やや創造的に
          // maxOutputTokens: 4096 // 必要に応じて設定
        }
      );
      console.log(`第${chapterOutline.chapter_number}章の本文を正常に取得しました。`);
      return chapterContent;
    } catch (error) {
      console.error(`第${chapterOutline.chapter_number}章の本文生成中にエラーが発生しました: ${error.message}`);
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
      if (!chapterFullContent) {
        // 1つの章の生成に失敗しても、他の章の処理は続けるか、全体を中止するか検討。
        // ここではエラーとして全体を中止する。
        throw new Error(`第${chapterInfo.chapter_number}章「${chapterInfo.chapter_title}」の本文生成に失敗しました。`);
      }
      generatedChapters.push({
        title: chapterInfo.chapter_title, // AIが生成した章タイトル
        content: chapterFullContent     // AIが生成した章本文
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    // bookSlug はカテゴリと日付から生成するが、書籍タイトルも一部含めるとよりユニークになる可能性
    const safeBookTitleForSlug = bookTitle.replace(/[^\w\s一-龠ぁ-んァ-ヶー]/g, '').replace(/\s+/g, '-').substring(0, 50);
    const bookSlug = `${category}-${safeBookTitleForSlug}-${timestamp}`;
    const bookDir = path.join(this.outputDir, bookSlug);

    await fs.mkdir(bookDir, { recursive: true });

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
    await fs.writeFile(path.join(bookDir, 'index.md'), indexContent);

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
      await fs.writeFile(
        path.join(bookDir, `chapter-${chapterNumber}.md`),
        chapterContentMarkdown
      );
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