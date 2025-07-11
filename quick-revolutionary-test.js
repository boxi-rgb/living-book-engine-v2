import { GeminiApiService } from './gemini-api-service.js'
import { logger } from './logger.js'
import { TrueRevolutionaryPromptSystem } from './true-revolutionary-prompt-system.js'
import { AntiAiValidationSystem } from './anti-ai-validation-system.js'
import fs from 'fs'
import path from 'path'

/**
 * Quick Revolutionary Test - 完全再構築版
 * AI機械応答を完全に排除し、真の革命的コンテンツを生成
 */
class QuickRevolutionaryTest {
  constructor() {
    this.geminiService = new GeminiApiService()
    this.promptSystem = new TrueRevolutionaryPromptSystem()
    this.validator = new AntiAiValidationSystem()
    this.logger = logger
    this.maxRetries = 5
  }

  /**
   * 真の革命的コンテンツ生成（完全再構築）
   */
  async generateTrueRevolutionary(category = 'self-help') {
    this.logger.info(`🔥 TRUE REVOLUTIONARY GENERATION STARTED: ${category}`)
    this.logger.info(`💀 AI機械応答完全排除モード`)
    
    let attempt = 0
    let bestContent = null
    let bestScore = 0

    while (attempt < this.maxRetries) {
      attempt++
      this.logger.info(`🎯 Generation attempt ${attempt}/${this.maxRetries}`)

      try {
        // 真の革命プロンプト生成
        const promptData = this.promptSystem.optimizePrompt(category, 'MAXIMUM')
        
        if (!promptData.validation.isValid) {
          this.logger.error(`❌ Prompt validation failed: ${promptData.validation.issues.join(', ')}`)
          continue
        }

        this.logger.info(`🚀 Using persona: ${promptData.metadata.persona.character}`)
        
        // コンテンツ生成
        const content = await this.geminiService.generateBookContent(
          promptData.prompt,
          'chapter_writing',
          {
            temperature: 0.95, // 最大創造性
            maxOutputTokens: 8192,
            topP: 0.9
          }
        )

        if (!content || content.length < 1000) {
          this.logger.warn(`⚠️ Content too short: ${content?.length || 0} chars`)
          continue
        }

        // AI機械応答検証
        const violations = this.validator.validateContent(content)
        
        if (this.validator.shouldReject(violations)) {
          this.logger.error(`❌ Content rejected: ${violations.severity}`)
          this.logger.error(`AI detections: ${violations.aiDetections.length}`)
          this.logger.error(`Manipulation flags: ${violations.manipulationFlags.length}`)
          
          // 自動修正を試行
          const fixedContent = this.validator.attemptAutoFix(content, violations)
          const revalidation = this.validator.validateContent(fixedContent)
          
          if (!this.validator.shouldReject(revalidation)) {
            this.logger.info(`🔧 Auto-fix successful, using corrected content`)
            content = fixedContent
            violations = revalidation
          } else {
            this.logger.warn(`🔧 Auto-fix failed, retrying generation`)
            continue
          }
        }

        // 人間らしさスコア計算
        const humanScore = this.validator.calculateHumanStyleScore(content)
        
        this.logger.info(`📊 Content validation results:`)
        this.logger.info(`- Severity: ${violations.severity}`)
        this.logger.info(`- Human style score: ${humanScore}/100`)
        this.logger.info(`- Content length: ${content.length} chars`)

        if (humanScore > bestScore) {
          bestContent = content
          bestScore = humanScore
          
          // 十分な品質に達した場合は生成完了
          if (violations.severity === 'CLEAN' && humanScore >= 80) {
            this.logger.info(`🎉 High-quality content generated on attempt ${attempt}`)
            break
          }
        }

      } catch (error) {
        this.logger.error(`💥 Generation attempt ${attempt} failed:`, error.message)
        
        if (error.message.includes('overloaded') || error.message.includes('503')) {
          this.logger.info(`⏰ API overloaded, waiting 30 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 30000))
        }
      }
    }

    if (!bestContent) {
      throw new Error('Failed to generate acceptable content after all attempts')
    }

    // 最終品質評価
    const finalValidation = this.validator.validateContent(bestContent)
    const finalReport = this.validator.generateReport(finalValidation)
    
    this.logger.info(`🎯 Final quality score: ${bestScore}/100`)
    this.logger.info(`📋 Recommendation: ${finalReport.recommendation}`)

    // ファイル保存
    await this.saveGeneratedContent(category, bestContent, finalReport)
    
    return {
      content: bestContent,
      qualityScore: bestScore,
      validationReport: finalReport,
      attempts: attempt
    }
  }

  /**
   * 生成コンテンツの保存
   */
  async saveGeneratedContent(category, content, validationReport) {
    const timestamp = new Date().toISOString().split('T')[0]
    const outputDir = path.join('docs', 'revolutionary-books', `${category}-true-revolution-${timestamp}`)
    
    // ディレクトリ作成
    await fs.promises.mkdir(outputDir, { recursive: true })
    
    // タイトル抽出（簡易版）
    const titleMatch = content.match(/^#\s*(.+)$/m) || content.match(/【(.+)】/) || content.match(/『(.+)』/)
    const title = titleMatch ? titleMatch[1] : `真の革命的${category}書籍`
    
    // メタデータ
    const metadata = {
      title: title,
      chapter: 1,
      book_title: title,
      character_count: content.length,
      quality_score: validationReport.summary.humanStyleScore,
      ai_validation: validationReport.severity,
      generation_method: 'TRUE_REVOLUTIONARY_SYSTEM',
      anti_ai_verified: validationReport.summary.aiDetections === 0
    }

    // chapter-1.md
    const chapterContent = `---
${Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}
---

${content}`

    await fs.promises.writeFile(
      path.join(outputDir, 'chapter-1.md'),
      chapterContent,
      'utf8'
    )

    // index.md
    const indexContent = `---
title: "${title}"
description: "真の革命的${category}書籍 - AI機械応答完全排除版"
category: "${category}"
generation_date: "${new Date().toISOString()}"
quality_verified: true
anti_ai_validated: true
---

# ${title}

> **AI機械応答完全排除** - 真の革命的コンテンツ生成システム

## 品質検証結果

- **人間らしさスコア**: ${validationReport.summary.humanStyleScore}/100
- **AI検出結果**: ${validationReport.summary.aiDetections === 0 ? '✅ AI応答なし' : '❌ AI応答検出'}
- **洗脳検出**: ${validationReport.summary.manipulationFlags}件
- **検証ステータス**: ${validationReport.recommendation}

## 章構成

- [第1章](./chapter-1.md) - 革命の序章

---

*Generated by True Revolutionary System v2.0*`

    await fs.promises.writeFile(
      path.join(outputDir, 'index.md'),
      indexContent,
      'utf8'
    )

    // 検証レポート保存
    await fs.promises.writeFile(
      path.join(outputDir, 'validation-report.json'),
      JSON.stringify(validationReport, null, 2),
      'utf8'
    )

    this.logger.info(`📁 Content saved to: ${outputDir}`)
  }

  /**
   * 品質統計表示
   */
  displayQualityStats(result) {
    console.log('\n🔥 TRUE REVOLUTIONARY GENERATION COMPLETED')
    console.log('=' .repeat(50))
    console.log(`📊 Quality Score: ${result.qualityScore}/100`)
    console.log(`🎯 Generation Attempts: ${result.attempts}`)
    console.log(`📋 Status: ${result.validationReport.recommendation}`)
    console.log(`✅ AI Detection: ${result.validationReport.summary.aiDetections === 0 ? 'CLEAN' : 'DETECTED'}`)
    console.log(`📝 Content Length: ${result.content.length} characters`)
    console.log(`🔥 Severity Level: ${result.validationReport.severity}`)
    
    if (result.validationReport.summary.aiDetections > 0) {
      console.log(`\n⚠️  AI Detections Found: ${result.validationReport.summary.aiDetections}`)
    }
    
    if (result.qualityScore >= 80) {
      console.log('\n🎉 HIGH-QUALITY REVOLUTIONARY CONTENT GENERATED!')
    } else if (result.qualityScore >= 60) {
      console.log('\n✅ ACCEPTABLE REVOLUTIONARY CONTENT GENERATED')
    } else {
      console.log('\n⚠️  LOW-QUALITY CONTENT - CONSIDER REGENERATION')
    }
  }
}

// CLI実行
async function main() {
  const args = process.argv.slice(2)
  const category = args[0] || 'self-help'
  
  console.log('🔥 Starting True Revolutionary Generation...')
  console.log(`📂 Category: ${category}`)
  console.log('💀 AI機械応答完全排除モード\n')
  
  const test = new QuickRevolutionaryTest()
  
  try {
    const result = await test.generateTrueRevolutionary(category)
    test.displayQualityStats(result)
  } catch (error) {
    console.error('💥 Generation failed:', error.message)
    process.exit(1)
  }
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { QuickRevolutionaryTest }