#!/usr/bin/env node

/**
 * 🔥 QUICK REVOLUTIONARY TEST
 * エラー回避・簡易テスト版
 */

import GeminiApiService from './gemini-api-service.js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

class QuickRevolutionaryTest {
  constructor() {
    this.geminiService = new GeminiApiService()
    this.logger = this.initializeLogger()
  }

  async generateQuickRevolutionary(category = 'self-help') {
    this.logger.info(`🔥 QUICK REVOLUTIONARY TEST STARTED: ${category}`)
    
    try {
      // 直接的な革命コンテンツ生成
      const revolutionaryPrompt = `
あなたは${category}業界の常識を破壊する革命的著者です。

【緊急ミッション：業界破壊的書籍生成】

以下の革命的要件で書籍を生成してください：

1. タイトル：業界専門家が激怒するレベルの常識破壊タイトル
2. 内容：従来の${category}手法を完全否定する革命的アプローチ
3. 文体：AIが書いたとは絶対に思われない人間的な深み

【禁止事項】
- ありきたりなアドバイス
- テンプレート的な構成
- 表面的な内容
- 感情表現の機械的挿入

【必須要素】
- 業界の嘘・欺瞞の暴露
- 逆張りの具体的手法
- 読者の世界観を根底から覆す洞察

第1章のみ、8000文字以上で執筆してください。
      `

      this.logger.info(`🎯 Generating revolutionary content...`)
      
      const revolutionaryContent = await this.geminiService.generateBookContent(
        revolutionaryPrompt, 
        'chapter_writing',
        {
          temperature: 0.9,
          maxOutputTokens: 8192
        }
      )

      this.logger.info(`📝 Content generated: ${revolutionaryContent.length} characters`)

      // 革命的タイトル生成
      const titlePrompt = `
以下のコンテンツから、業界を震撼させる革命的タイトルを生成してください：

${revolutionaryContent.substring(0, 1000)}...

要件：
- ${category}業界の常識を完全否定
- 専門家が反発したくなる内容
- 読者が衝撃を受けるインパクト
- 20-40文字程度

タイトルのみ回答してください。
      `

      const revolutionaryTitle = await this.geminiService.generateBookContent(
        titlePrompt,
        'title_suggestion',
        {
          temperature: 0.95,
          maxOutputTokens: 256
        }
      )

      this.logger.info(`🎯 Revolutionary title: ${revolutionaryTitle}`)

      // 簡易品質評価
      const qualityScore = this.assessRevolutionaryQuality(revolutionaryContent)
      
      // ファイル出力
      const outputPath = await this.saveRevolutionaryBook(
        revolutionaryTitle.trim(),
        revolutionaryContent,
        qualityScore
      )

      this.logger.info(`✅ QUICK REVOLUTION COMPLETED`)
      
      return {
        title: revolutionaryTitle.trim(),
        outputPath,
        characterCount: revolutionaryContent.length,
        qualityScore,
        revolutionaryLevel: qualityScore > 75 ? 'HIGH' : 'MEDIUM'
      }

    } catch (error) {
      this.logger.error(`💀 QUICK REVOLUTION FAILED: ${error.message}`)
      throw error
    }
  }

  assessRevolutionaryQuality(content) {
    let score = 0
    
    // 革命的キーワードチェック
    const revolutionaryWords = [
      '嘘', '間違い', '騙されている', '真実は', '実は', '逆に', 
      '常識を疑え', '業界が隠す', '専門家が言わない', '裏側',
      '破壊', '革命', '覆す', '否定', '暴露'
    ]
    
    revolutionaryWords.forEach(word => {
      const count = (content.split(word).length - 1)
      score += count * 3
    })
    
    // 文字数評価
    if (content.length > 8000) score += 20
    else if (content.length > 5000) score += 10
    
    // AI臭さチェック（減点）
    const aiPhrases = ['について考えてみましょう', 'まとめると', '重要なポイント']
    aiPhrases.forEach(phrase => {
      if (content.includes(phrase)) score -= 10
    })
    
    return Math.min(Math.max(score, 0), 100)
  }

  async saveRevolutionaryBook(title, content, qualityScore) {
    const timestamp = new Date().toISOString().split('T')[0]
    const slug = this.createSlug(title)
    const outputDir = `docs/revolutionary-books/${slug}-quick-${timestamp}`
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // インデックスファイル
    const indexContent = `---
title: "${title}"
description: "革命的書籍（クイックテスト版）"
author: "Revolutionary Quick Generator"
type: "INDUSTRY_DISRUPTION_TEST"
quality_score: ${qualityScore}
published: ${new Date().toISOString()}
language: ja
---

# ${title}

## 🔥 革命的書籍（クイックテスト版）

**品質スコア**: ${qualityScore}/100
**革命レベル**: ${qualityScore > 75 ? 'HIGH' : 'MEDIUM'}

## 📚 目次

1. [第1章：業界破壊の序章](./chapter-1.md)

---

*革命的コンテンツ生成システム クイックテスト版*

**生成日時**: ${new Date().toLocaleString('ja-JP')}
`
    
    fs.writeFileSync(`${outputDir}/index.md`, indexContent)
    
    // 第1章ファイル
    const chapterContent = `---
title: "第1章：業界破壊の序章"
chapter: 1
book_title: "${title}"
character_count: ${content.length}
quality_score: ${qualityScore}
---

# 第1章：業界破壊の序章

${content}

---

**前の章**: [革命的書籍について](index.md)
**次の章**: [継続中...]

*第1章完了 - クイックテスト版*
`
    
    fs.writeFileSync(`${outputDir}/chapter-1.md`, chapterContent)
    
    return outputDir
  }

  createSlug(title) {
    return title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 30)
  }

  initializeLogger() {
    return {
      info: (msg) => console.log(`[${new Date().toISOString()}] [🔥 QUICK] ${msg}`),
      warn: (msg) => console.log(`[${new Date().toISOString()}] [⚠️ WARN] ${msg}`),
      error: (msg) => console.log(`[${new Date().toISOString()}] [💀 ERROR] ${msg}`)
    }
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new QuickRevolutionaryTest()
  const category = process.argv[2] || 'self-help'
  
  tester.generateQuickRevolutionary(category)
    .then(result => {
      console.log('\n🎉 QUICK REVOLUTIONARY TEST SUCCESS!')
      console.log(`📖 Title: ${result.title}`)
      console.log(`📁 Path: ${result.outputPath}`)
      console.log(`📊 Quality Score: ${result.qualityScore}/100`)
      console.log(`🔥 Revolutionary Level: ${result.revolutionaryLevel}`)
      console.log(`📝 Character Count: ${result.characterCount.toLocaleString()}`)
    })
    .catch(error => {
      console.error('\n💀 QUICK REVOLUTIONARY TEST FAILED!')
      console.error(`💥 Error: ${error.message}`)
      process.exit(1)
    })
}

export default QuickRevolutionaryTest