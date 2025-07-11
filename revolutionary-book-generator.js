#!/usr/bin/env node

/**
 * 🔥 REVOLUTIONARY BOOK GENERATOR
 * 業界破壊型書籍生成システム - 完全自動化革命エンジン
 */

import RevolutionaryContentEngine from './revolutionary-content-engine.js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config()

class RevolutionaryBookGenerator {
  constructor() {
    this.revolutionEngine = new RevolutionaryContentEngine()
    this.logger = this.initializeLogger()
    
    // 革命モード設定
    this.revolutionModes = {
      ANNIHILATION: '既存業界完全破壊モード',
      DISRUPTION: '業界秩序破壊モード', 
      TRANSFORMATION: '読者変革強制モード'
    }
  }

  /**
   * 革命的書籍生成 - メインエントリーポイント
   */
  async generateRevolutionaryBook(category, intensity = 'DISRUPTION') {
    this.logger.info(`🚀 REVOLUTIONARY BOOK GENERATION INITIATED`)
    this.logger.info(`📊 Category: ${category} | Intensity: ${intensity}`)
    
    try {
      // 革命エンジン起動
      this.logger.info(`🔥 Starting ${this.revolutionModes[intensity]}`)
      
      const revolutionResult = await this.revolutionEngine.generateRevolutionaryBook(category)
      
      this.logger.info(`✅ REVOLUTION COMPLETED`)
      this.logger.info(`📖 Title: ${revolutionResult.title}`)
      this.logger.info(`📁 Path: ${revolutionResult.outputPath}`)
      this.logger.info(`🎯 Revolution Score: ${revolutionResult.industry_disruption_potential}/100`)
      this.logger.info(`💥 Industry Threat: ${revolutionResult.revolution_verified ? 'MAXIMUM' : 'HIGH'}`)
      
      return revolutionResult
      
    } catch (error) {
      this.logger.error(`💀 REVOLUTION FAILED: ${error.message}`)
      this.logger.error(`🔧 Attempting emergency revolution recovery...`)
      
      // 緊急革命復旧
      return await this.emergencyRevolutionRecovery(category, error)
    }
  }

  /**
   * 緊急革命復旧システム
   */
  async emergencyRevolutionRecovery(category, originalError) {
    this.logger.warn(`🚨 EMERGENCY REVOLUTION RECOVERY INITIATED`)
    
    try {
      // より直接的なアプローチで再試行
      const emergencyResult = await this.revolutionEngine.generateRevolutionaryBook(
        category, 
        'EMERGENCY_SIMPLIFIED'
      )
      
      this.logger.info(`🔧 Emergency revolution successful`)
      return emergencyResult
      
    } catch (emergencyError) {
      this.logger.error(`💀 TOTAL REVOLUTION FAILURE`)
      this.logger.error(`Original: ${originalError.message}`)
      this.logger.error(`Emergency: ${emergencyError.message}`)
      
      throw new Error(`Revolutionary system complete failure: ${emergencyError.message}`)
    }
  }

  /**
   * 革命統計レポート生成
   */
  generateRevolutionStats(result) {
    return {
      generation_timestamp: new Date().toISOString(),
      revolution_metrics: {
        industry_disruption_score: result.industry_disruption_potential,
        revolution_verified: result.revolution_verified,
        chapter_count: result.chapters,
        total_content_volume: result.total_characters,
        threat_level: result.revolution_verified ? 'MAXIMUM' : 'HIGH'
      },
      performance_metrics: {
        generation_success: true,
        quality_standards_met: result.revolution_verified,
        industry_expert_backlash_expected: result.revolution_verified
      }
    }
  }

  /**
   * ログ初期化
   */
  initializeLogger() {
    return {
      info: (msg) => console.log(`[${new Date().toISOString()}] [🔥 REVOLUTION] ${msg}`),
      warn: (msg) => console.log(`[${new Date().toISOString()}] [⚠️ WARNING] ${msg}`),
      error: (msg) => console.log(`[${new Date().toISOString()}] [💀 ERROR] ${msg}`)
    }
  }
}

// CLI実行部分
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new RevolutionaryBookGenerator()
  const category = process.argv[2] || 'self-help'
  const intensity = process.argv[3] || 'DISRUPTION'
  
  generator.generateRevolutionaryBook(category, intensity)
    .then(result => {
      console.log('\n🎉 REVOLUTIONARY BOOK GENERATION SUCCESS!')
      console.log(`📖 Title: ${result.title}`)
      console.log(`📁 Path: ${result.outputPath}`)
      console.log(`🎯 Revolution Score: ${result.industry_disruption_potential}/100`)
      console.log(`💥 Revolution Verified: ${result.revolution_verified ? 'YES - INDUSTRY DISRUPTION CONFIRMED' : 'NO - REQUIRES HIGHER INTENSITY'}`)
      console.log(`⚡ Threat Level: ${result.revolution_verified ? 'MAXIMUM DISRUPTION' : 'HIGH DISRUPTION'}`)
      
      // 革命統計
      const stats = generator.generateRevolutionStats(result)
      console.log('\n📊 REVOLUTION STATISTICS:')
      console.log(`- Chapters Generated: ${stats.revolution_metrics.chapter_count}`)
      console.log(`- Content Volume: ${stats.revolution_metrics.total_content_volume.toLocaleString()} characters`)
      console.log(`- Industry Threat Level: ${stats.revolution_metrics.threat_level}`)
      console.log(`- Expert Backlash Expected: ${stats.performance_metrics.industry_expert_backlash_expected ? 'YES' : 'NO'}`)
    })
    .catch(error => {
      console.error('\n💀 REVOLUTIONARY BOOK GENERATION FAILED!')
      console.error(`💥 Error: ${error.message}`)
      console.error('🔧 Check system configuration and try again')
      process.exit(1)
    })
}

export default RevolutionaryBookGenerator