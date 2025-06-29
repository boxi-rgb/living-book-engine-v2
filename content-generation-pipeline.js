// VitePress AI Content Generation Pipeline
// Living Book Engine v2 × KDP自動化システム

import { defineConfig } from 'vitepress'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'

class AIContentPipeline {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
    
    this.config = {
      targetLength: 50000, // 50k words per book
      qualityThreshold: 0.8,
      outputPath: './docs',
      categories: ['self-help', 'business', 'technology', 'health'],
      languages: ['ja', 'en']
    }
  }

  // トレンド分析・キーワード選定
  async analyzeTrends() {
    const trendPrompt = `
    分析してください：
    1. 現在のKDP市場トレンド
    2. 競合が少ないニッチ分野
    3. 検索ボリュームが高いキーワード
    4. 収益性の高いカテゴリ
    
    JSON形式で返してください：
    {
      "trending_topics": [],
      "niche_opportunities": [],
      "high_value_keywords": [],
      "category_rankings": []
    }
    `
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: trendPrompt }]
    })
    
    return JSON.parse(response.content[0].text)
  }

  // 書籍構成生成
  async generateBookStructure(topic, keywords) {
    const structurePrompt = `
    トピック: ${topic}
    キーワード: ${keywords.join(', ')}
    
    以下の構成で書籍の章立てを作成してください：
    1. 魅力的なタイトル
    2. 詳細な目次（10-15章）
    3. 各章の概要（200-300字）
    4. 想定読者層
    5. 独自の価値提案
    
    JSON形式で構造化してください。
    `
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: structurePrompt }],
      temperature: 0.7
    })
    
    return JSON.parse(response.choices[0].message.content)
  }

  // 章別コンテンツ生成
  async generateChapterContent(chapterInfo, bookContext) {
    const contentPrompt = `
    書籍コンテキスト: ${bookContext.title}
    章タイトル: ${chapterInfo.title}
    章概要: ${chapterInfo.summary}
    
    以下の要件で章を執筆してください：
    - 文字数: 3000-4000字
    - 実用的で行動可能な内容
    - 具体例・事例を3つ以上含む
    - 章末に要点まとめ
    - SEO最適化されたMarkdown形式
    - 読みやすい構成（見出し、箇条書き活用）
    `
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: contentPrompt }]
    })
    
    return response.content[0].text
  }

  // VitePress形式でファイル生成
  async generateVitePressContent(bookStructure) {
    const bookDir = path.join(this.config.outputPath, bookStructure.slug)
    await fs.mkdir(bookDir, { recursive: true })
    
    // index.md (書籍トップページ)
    const indexContent = `---
title: ${bookStructure.title}
description: ${bookStructure.description}
author: AI Generated
category: ${bookStructure.category}
keywords: ${bookStructure.keywords.join(', ')}
published: ${new Date().toISOString()}
---

# ${bookStructure.title}

${bookStructure.introduction}

## 目次

${bookStructure.chapters.map((chapter, index) => 
  `${index + 1}. [${chapter.title}](./${chapter.slug}.md)`
).join('\n')}

---

*この書籍はAI技術とコミュニティの協力により作成されました。*
`
    
    await fs.writeFile(path.join(bookDir, 'index.md'), indexContent)
    
    // 各章のファイル生成
    for (const chapter of bookStructure.chapters) {
      const chapterContent = await this.generateChapterContent(chapter, bookStructure)
      const chapterMarkdown = `---
title: ${chapter.title}
chapter: ${chapter.number}
prev: ${chapter.prev || 'index'}
next: ${chapter.next || ''}
---

# ${chapter.title}

${chapterContent}

---

[← 前の章](${chapter.prev || 'index'}.md) | [次の章 →](${chapter.next || 'index'}.md)
`
      
      await fs.writeFile(
        path.join(bookDir, `${chapter.slug}.md`), 
        chapterMarkdown
      )
    }
    
    return bookDir
  }

  // 品質チェック
  async qualityCheck(content) {
    const qualityPrompt = `
    以下のコンテンツを評価してください：
    ${content.substring(0, 2000)}...
    
    評価項目：
    1. 文章の自然さ (1-10)
    2. 情報の正確性 (1-10)
    3. 読みやすさ (1-10)
    4. 独自性 (1-10)
    5. 実用性 (1-10)
    
    JSON形式で評価結果と改善提案を返してください。
    `
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: qualityPrompt }],
      temperature: 0.3
    })
    
    const quality = JSON.parse(response.choices[0].message.content)
    const avgScore = Object.values(quality.scores).reduce((a, b) => a + b, 0) / 5
    
    return {
      passed: avgScore >= this.config.qualityThreshold * 10,
      score: avgScore,
      feedback: quality.suggestions
    }
  }

  // メイン実行フロー
  async generateDailyBook() {
    try {
      console.log('🔍 トレンド分析開始...')
      const trends = await this.analyzeTrends()
      
      console.log('📋 書籍構成生成中...')
      const bookStructure = await this.generateBookStructure(
        trends.trending_topics[0],
        trends.high_value_keywords.slice(0, 5)
      )
      
      console.log('✍️ コンテンツ生成中...')
      const bookPath = await this.generateVitePressContent(bookStructure)
      
      console.log('🔍 品質チェック実行中...')
      const indexContent = await fs.readFile(path.join(bookPath, 'index.md'), 'utf8')
      const quality = await this.qualityCheck(indexContent)
      
      if (!quality.passed) {
        console.log('❌ 品質基準未達成:', quality.feedback)
        return { success: false, reason: '品質基準未達成' }
      }
      
      console.log('✅ 書籍生成完了:', bookPath)
      return { 
        success: true, 
        bookPath, 
        structure: bookStructure,
        quality: quality.score 
      }
      
    } catch (error) {
      console.error('❌ 生成エラー:', error)
      return { success: false, error: error.message }
    }
  }

  // GitHub自動コミット
  async commitToGitHub(bookPath, bookStructure) {
    const { execSync } = require('child_process')
    
    try {
      execSync(`git add ${bookPath}`, { cwd: process.cwd() })
      execSync(`git commit -m "📚 新書籍追加: ${bookStructure.title}"`, { cwd: process.cwd() })
      execSync('git push origin main', { cwd: process.cwd() })
      
      console.log('✅ GitHubにプッシュ完了')
      return true
    } catch (error) {
      console.error('❌ Git操作エラー:', error)
      return false
    }
  }
}

// VitePress設定拡張
export const vitepressConfig = defineConfig({
  title: 'AI Generated Books Platform',
  description: 'KDP自動出版システム',
  
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '書籍一覧', link: '/books/' },
      { text: '統計', link: '/analytics/' }
    ],
    
    sidebar: {
      '/books/': 'auto'
    }
  },
  
  // カスタムビルドフック
  buildEnd: async (siteConfig) => {
    console.log('📊 ビルド完了 - KDP変換準備中...')
    // KDP変換処理をここに実装
  }
})

// 実行スクリプト
if (import.meta.url === `file://${process.argv[1]}`) {
  const pipeline = new AIContentPipeline()
  pipeline.generateDailyBook()
    .then(result => {
      if (result.success) {
        console.log('🎉 日次書籍生成完了!')
        console.log(`📖 書籍: ${result.structure.title}`)
        console.log(`📊 品質スコア: ${result.quality}/10`)
      }
    })
    .catch(console.error)
}

export default AIContentPipeline

// Last Updated: 2025-06-29 04:22:00 JST