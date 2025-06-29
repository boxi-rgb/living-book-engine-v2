#!/usr/bin/env node
/**
 * KDP自動化スケジューラー
 * Living Book Engine v2 × 1日1冊自動出版システム
 * 
 * 機能:
 * - 日次書籍生成スケジュール
 * - 品質管理・監視
 * - エラーハンドリング
 * - 統計・レポート生成
 */

const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Import our pipeline
const AIContentPipeline = require('./content-generation-pipeline.js');

class AutomationScheduler {
  constructor() {
    this.pipeline = new AIContentPipeline();
    this.config = {
      schedule: {
        daily_generation: '0 6 * * *',      // 毎日06:00
        quality_check: '0 12 * * *',        // 毎日12:00
        kdp_upload: '0 18 * * *',           // 毎日18:00
        analytics: '0 22 * * *'             // 毎日22:00
      },
      thresholds: {
        quality_min: 8,
        retry_count: 3,
        timeout_minutes: 30
      },
      notifications: {
        webhook_url: process.env.DISCORD_WEBHOOK || process.env.SLACK_WEBHOOK,
        email_enabled: false
      }
    };
    
    this.stats = {
      books_generated: 0,
      books_published: 0,
      success_rate: 0,
      avg_quality: 0,
      total_revenue: 0
    };
    
    this.logFile = path.join(__dirname, 'logs', 'automation.log');
    this.statsFile = path.join(__dirname, 'stats', 'daily-stats.json');
    
    this.init();
  }
  
  async init() {
    // ディレクトリ作成
    await this.ensureDirectories();
    
    // 統計読み込み
    await this.loadStats();
    
    // スケジュール開始
    this.setupSchedules();
    
    console.log('🚀 KDP自動化スケジューラー開始');
    console.log('📅 スケジュール:', this.config.schedule);
  }
  
  async ensureDirectories() {
    const dirs = ['logs', 'stats', 'output', 'backups'];
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }
  
  async loadStats() {
    try {
      const data = await fs.readFile(this.statsFile, 'utf8');
      this.stats = { ...this.stats, ...JSON.parse(data) };
    } catch (error) {
      console.log('📊 新規統計ファイル作成');
      await this.saveStats();
    }
  }
  
  async saveStats() {
    await fs.writeFile(this.statsFile, JSON.stringify(this.stats, null, 2));
  }
  
  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    
    console.log(logEntry.trim());
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('ログ書き込みエラー:', error);
    }
  }
  
  setupSchedules() {
    // 日次書籍生成
    cron.schedule(this.config.schedule.daily_generation, async () => {
      await this.runDailyGeneration();
    }, {
      timezone: "Asia/Tokyo"
    });
    
    // 品質チェック
    cron.schedule(this.config.schedule.quality_check, async () => {
      await this.runQualityCheck();
    }, {
      timezone: "Asia/Tokyo"
    });
    
    // KDPアップロード
    cron.schedule(this.config.schedule.kdp_upload, async () => {
      await this.runKDPUpload();
    }, {
      timezone: "Asia/Tokyo"
    });
    
    // 分析レポート
    cron.schedule(this.config.schedule.analytics, async () => {
      await this.runAnalytics();
    }, {
      timezone: "Asia/Tokyo"
    });
    
    console.log('⏰ スケジュール設定完了');
  }
  
  async runDailyGeneration() {
    await this.log('📚 日次書籍生成開始');
    
    let retryCount = 0;
    let success = false;
    let result = null;
    
    while (retryCount < this.config.thresholds.retry_count && !success) {
      try {
        result = await this.pipeline.generateDailyBook();
        
        if (result.success && result.quality >= this.config.thresholds.quality_min) {
          success = true;
          this.stats.books_generated++;
          this.stats.avg_quality = (this.stats.avg_quality + result.quality) / this.stats.books_generated;
          
          await this.log(`✅ 書籍生成成功: ${result.structure.title} (品質: ${result.quality}/10)`);
          await this.notifySuccess('生成', result);
          
        } else {
          throw new Error(`品質基準未達成: ${result.quality}/10`);
        }
        
      } catch (error) {
        retryCount++;
        await this.log(`❌ 生成失敗 (試行 ${retryCount}/${this.config.thresholds.retry_count}): ${error.message}`, 'ERROR');
        
        if (retryCount < this.config.thresholds.retry_count) {
          await this.sleep(60000); // 1分待機
        }
      }
    }
    
    if (!success) {
      await this.log('❌ 日次書籍生成失敗 - 最大試行回数に達しました', 'ERROR');
      await this.notifyFailure('生成', '最大試行回数に達しました');
    }
    
    await this.saveStats();
    return success;
  }
  
  async runQualityCheck() {
    await this.log('🔍 品質チェック開始');
    
    try {
      // 今日生成された書籍を確認
      const today = new Date().toISOString().split('T')[0];
      const outputDir = path.join(__dirname, 'docs', 'generated-books');
      
      const books = await fs.readdir(outputDir);
      const todayBooks = books.filter(book => book.includes(today));
      
      if (todayBooks.length === 0) {
        await this.log('⚠️ 本日生成された書籍が見つかりません', 'WARN');
        return false;
      }
      
      for (const bookDir of todayBooks) {
        const bookPath = path.join(outputDir, bookDir);
        const indexPath = path.join(bookPath, 'index.md');
        
        if (await this.fileExists(indexPath)) {
          const content = await fs.readFile(indexPath, 'utf8');
          const quality = await this.pipeline.qualityCheck(content);
          
          await this.log(`📊 品質チェック結果 ${bookDir}: ${quality.score}/10`);
          
          if (!quality.passed) {
            await this.log(`⚠️ 品質基準未達成: ${quality.feedback}`, 'WARN');
          }
        }
      }
      
      return true;
      
    } catch (error) {
      await this.log(`❌ 品質チェックエラー: ${error.message}`, 'ERROR');
      return false;
    }
  }
  
  async runKDPUpload() {
    await this.log('📤 KDPアップロード開始');
    
    try {
      // 品質チェック済みの書籍を取得
      const outputDir = path.join(__dirname, 'kdp-output');
      
      if (!(await this.fileExists(outputDir))) {
        await this.log('📂 KDP出力ディレクトリが存在しません - 変換実行');
        
        // Markdown → KDP変換実行
        const { stdout, stderr } = await execAsync('python3 markdown-to-kdp-converter.py docs/generated-books/latest');
        
        if (stderr) {
          throw new Error(`変換エラー: ${stderr}`);
        }
        
        await this.log('✅ KDP変換完了');
      }
      
      // KDPアップロード（実装必要 - 現在はモック）
      await this.mockKDPUpload();
      
      this.stats.books_published++;
      this.stats.success_rate = (this.stats.books_published / this.stats.books_generated) * 100;
      
      await this.log('✅ KDPアップロード完了');
      await this.notifySuccess('アップロード', { title: 'Latest Book' });
      
      return true;
      
    } catch (error) {
      await this.log(`❌ KDPアップロードエラー: ${error.message}`, 'ERROR');
      await this.notifyFailure('アップロード', error.message);
      return false;
    }
  }
  
  async mockKDPUpload() {
    // KDP API連携の実装をここに追加
    await this.log('🔄 KDPアップロード処理中...');
    await this.sleep(2000); // 2秒待機（モック）
    await this.log('✅ KDPアップロード完了（モック）');
  }
  
  async runAnalytics() {
    await this.log('📊 分析レポート生成開始');
    
    try {
      const report = await this.generateDailyReport();
      const reportPath = path.join(__dirname, 'stats', `report-${new Date().toISOString().split('T')[0]}.md`);
      
      await fs.writeFile(reportPath, report);
      await this.log(`📋 レポート生成完了: ${reportPath}`);
      
      // 週次・月次レポートの生成
      const dayOfWeek = new Date().getDay();
      const dayOfMonth = new Date().getDate();
      
      if (dayOfWeek === 0) { // 日曜日
        await this.generateWeeklyReport();
      }
      
      if (dayOfMonth === 1) { // 月初
        await this.generateMonthlyReport();
      }
      
      return true;
      
    } catch (error) {
      await this.log(`❌ 分析エラー: ${error.message}`, 'ERROR');
      return false;
    }
  }
  
  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    
    return `# 📊 KDP自動化 日次レポート
    
**日付**: ${today}
**生成時刻**: ${new Date().toLocaleString('ja-JP')}

## 📈 本日の成果
- **生成書籍数**: ${this.stats.books_generated}
- **出版書籍数**: ${this.stats.books_published}
- **成功率**: ${this.stats.success_rate.toFixed(1)}%
- **平均品質スコア**: ${this.stats.avg_quality.toFixed(1)}/10

## 🎯 累計統計
- **総生成書籍数**: ${this.stats.books_generated}
- **総出版書籍数**: ${this.stats.books_published}
- **総収益**: $${this.stats.total_revenue.toFixed(2)}

## 🔄 システム状況
- **稼働時間**: ${process.uptime().toFixed(0)}秒
- **メモリ使用量**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
- **Node.js バージョン**: ${process.version}

## 📝 改善提案
- 品質スコア向上のためのプロンプト調整
- 処理時間短縮のための並列化
- エラーハンドリングの強化

---
*自動生成レポート - Living Book Engine v2*
`;
  }
  
  async generateWeeklyReport() {
    await this.log('📊 週次レポート生成中...');
    // 週次レポート実装
  }
  
  async generateMonthlyReport() {
    await this.log('📊 月次レポート生成中...');
    // 月次レポート実装
  }
  
  async notifySuccess(operation, result) {
    const message = `✅ ${operation}成功: ${result.structure?.title || result.title || 'Unknown'}`;
    await this.sendNotification(message);
  }
  
  async notifyFailure(operation, error) {
    const message = `❌ ${operation}失敗: ${error}`;
    await this.sendNotification(message);
  }
  
  async sendNotification(message) {
    if (!this.config.notifications.webhook_url) {
      return;
    }
    
    try {
      const axios = require('axios');
      await axios.post(this.config.notifications.webhook_url, {
        content: `🤖 KDP自動化システム\n${message}\n時刻: ${new Date().toLocaleString('ja-JP')}`
      });
    } catch (error) {
      await this.log(`通知送信エラー: ${error.message}`, 'ERROR');
    }
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 手動実行メソッド
  async manualGeneration() {
    console.log('🔄 手動書籍生成開始...');
    return await this.runDailyGeneration();
  }
  
  async manualKDPUpload() {
    console.log('🔄 手動KDPアップロード開始...');
    return await this.runKDPUpload();
  }
  
  async getStats() {
    return this.stats;
  }
  
  async shutdown() {
    await this.log('🛑 自動化システム停止');
    await this.saveStats();
    process.exit(0);
  }
}

// CLI実行
if (require.main === module) {
  const scheduler = new AutomationScheduler();
  
  // グレースフルシャットダウン
  process.on('SIGINT', async () => {
    console.log('\n📋 シャットダウン処理中...');
    await scheduler.shutdown();
  });
  
  process.on('SIGTERM', async () => {
    await scheduler.shutdown();
  });
  
  // CLI引数処理
  const args = process.argv.slice(2);
  if (args.length > 0) {
    switch (args[0]) {
      case 'generate':
        scheduler.manualGeneration().then(success => {
          console.log(success ? '✅ 生成完了' : '❌ 生成失敗');
          process.exit(success ? 0 : 1);
        });
        break;
        
      case 'upload':
        scheduler.manualKDPUpload().then(success => {
          console.log(success ? '✅ アップロード完了' : '❌ アップロード失敗');
          process.exit(success ? 0 : 1);
        });
        break;
        
      case 'stats':
        scheduler.getStats().then(stats => {
          console.log('📊 統計情報:');
          console.log(JSON.stringify(stats, null, 2));
          process.exit(0);
        });
        break;
        
      default:
        console.log('使用方法: node automation-scheduler.js [generate|upload|stats]');
        process.exit(1);
    }
  }
}

module.exports = AutomationScheduler;

// Last Updated: 2025-06-29 04:26:00 JST