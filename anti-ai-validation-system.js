import { logger } from './logger.js'

/**
 * Anti-AI Content Validation System
 * AI機械応答と洗脳的コンテンツを検出・排除する
 */
export class AntiAiValidationSystem {
  constructor() {
    this.logger = logger
  }

  /**
   * AI機械応答検出パターン
   */
  static AI_DETECTION_PATTERNS = [
    // 機械的な応答開始
    /^承知.*しました/,
    /^かしこまりました/,
    /^理解.*しました/,
    /^了解.*しました/,
    /それでは.*始めましょう/,
    /以下.*生成.*します/,
    /^お手伝い.*させていただきます/,
    
    // AI自己言及
    /私は.*AI/,
    /私は.*著者として/,
    /私は.*創造/,
    /AI.*として/,
    /システム.*として/,
    
    // 機械的な構成表現
    /以下.*ような/,
    /について考えてみましょう/,
    /まとめてみました/,
    /整理してみます/,
    /説明.*させていただきます/,
    /提案.*させていただきます/,
    
    // テンプレート的表現
    /【.*】/g,
    /★.*★/g,
    /▼.*▼/g,
    /■.*■/g,
    
    // 洗脳的・説教的表現
    /大切なのは/,
    /重要なことは/,
    /^まず.*大切/,
    /忘れてはいけない/,
    /心に刻んで/,
    /学ぶべき/,
    /理解すべき/,
    
    // AI特有の丁寧すぎる表現
    /させていただく/g,
    /いただけれ/,
    /恐縮ですが/,
    /申し上げます/,
    /お聞かせください/
  ]

  /**
   * 洗脳的コンテンツ検出パターン
   */
  static MANIPULATION_PATTERNS = [
    /あなたは.*特別/,
    /あなたには.*力がある/,
    /信じる.*力/,
    /ポジティブ.*思考/,
    /必ず.*うまくいく/,
    /夢は.*叶う/,
    /感謝.*すれば/,
    /宇宙.*応援/,
    /引き寄せ.*法則/,
    /運命.*変える/,
    /奇跡.*起こる/,
    /愛.*エネルギー/
  ]

  /**
   * 人間らしい文体強制パターン
   */
  static HUMAN_STYLE_REQUIRED = [
    // 口語的表現を要求
    '書き言葉すぎる',
    '論文っぽい',
    '機械的すぎる',
    '感情がない',
    '生々しさがない'
  ]

  /**
   * コンテンツの完全検証
   */
  validateContent(content) {
    this.logger.info('🔍 Anti-AI validation starting...')
    
    const violations = {
      aiDetections: [],
      manipulationFlags: [],
      humanStyleIssues: [],
      severity: 'CLEAN'
    }

    // AI機械応答検出
    for (const pattern of AntiAiValidationSystem.AI_DETECTION_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        violations.aiDetections.push({
          pattern: pattern.source,
          matches: matches,
          severity: 'CRITICAL'
        })
      }
    }

    // 洗脳的コンテンツ検出  
    for (const pattern of AntiAiValidationSystem.MANIPULATION_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        violations.manipulationFlags.push({
          pattern: pattern.source,
          matches: matches,
          severity: 'HIGH'
        })
      }
    }

    // 人間らしさ検証
    const humanStyleScore = this.calculateHumanStyleScore(content)
    if (humanStyleScore < 70) {
      violations.humanStyleIssues.push({
        score: humanStyleScore,
        issues: this.identifyStyleIssues(content),
        severity: 'MEDIUM'
      })
    }

    // 総合重要度判定
    if (violations.aiDetections.length > 0) {
      violations.severity = 'CRITICAL'
    } else if (violations.manipulationFlags.length > 3) {
      violations.severity = 'HIGH'
    } else if (violations.humanStyleIssues.length > 0) {
      violations.severity = 'MEDIUM'
    }

    this.logger.info(`🎯 Validation result: ${violations.severity}`)
    this.logger.info(`AI detections: ${violations.aiDetections.length}`)
    this.logger.info(`Manipulation flags: ${violations.manipulationFlags.length}`)

    return violations
  }

  /**
   * 人間らしさスコア計算
   */
  calculateHumanStyleScore(content) {
    let score = 100

    // 機械的な文体ペナルティ
    const sentences = content.split(/[。！？]/)
    const formalSentences = sentences.filter(s => 
      s.includes('である') || 
      s.includes('します') ||
      s.includes('ます') ||
      s.includes('ください')
    )
    
    const formalRatio = formalSentences.length / sentences.length
    if (formalRatio > 0.7) {
      score -= 30 // 丁寧すぎる文体
    }

    // 感情表現の欠如
    const emotionalWords = content.match(/ムカつく|クソ|バカ|最悪|うざい|イライラ|腹立つ|キレる/g)
    if (!emotionalWords || emotionalWords.length < 3) {
      score -= 20 // 感情表現が少ない
    }

    // 口語表現の有無
    const colloquialWords = content.match(/だろ|じゃん|だよな|ってか|マジで|ヤバい|すげー/g)
    if (!colloquialWords || colloquialWords.length < 2) {
      score -= 15 // 口語表現不足
    }

    return Math.max(0, score)
  }

  /**
   * 文体問題の特定
   */
  identifyStyleIssues(content) {
    const issues = []

    if (content.includes('させていただく')) {
      issues.push('過度に丁寧な敬語使用')
    }
    
    if (content.match(/です。.*です。.*です。/)) {
      issues.push('単調な文末表現')
    }

    if (!content.match(/[。！？].*[だよ|だろ|じゃん]/)) {
      issues.push('口語表現の欠如')
    }

    if (!content.match(/[クソ|バカ|ムカつく|最悪]/)) {
      issues.push('感情表現の不足')
    }

    return issues
  }

  /**
   * コンテンツ自動修正（緊急時）
   */
  attemptAutoFix(content, violations) {
    this.logger.info('🔧 Attempting auto-fix for AI violations...')
    
    let fixedContent = content

    // AI機械応答の削除
    for (const violation of violations.aiDetections) {
      for (const match of violation.matches) {
        fixedContent = fixedContent.replace(match, '')
      }
    }

    // 機械的な表現の置換
    fixedContent = fixedContent
      .replace(/させていただきます/g, 'する')
      .replace(/について考えてみましょう/g, 'について考えろ')
      .replace(/大切なのは/g, '重要なのは')
      .replace(/【/g, '').replace(/】/g, '')
      .replace(/★/g, '').replace(/▼/g, '').replace(/■/g, '')

    // より攻撃的な表現に変換
    fixedContent = fixedContent
      .replace(/問題です/g, 'クソみたいな問題だ')
      .replace(/困難/g, 'クソ面倒')
      .replace(/素晴らしい/g, 'まともな')

    this.logger.info('🎯 Auto-fix completed')
    return fixedContent
  }

  /**
   * 完全拒否判定
   */
  shouldReject(violations) {
    return violations.severity === 'CRITICAL' || 
           violations.aiDetections.length > 2 ||
           violations.manipulationFlags.length > 5
  }

  /**
   * 検証レポート生成
   */
  generateReport(violations) {
    const report = {
      timestamp: new Date().toISOString(),
      severity: violations.severity,
      summary: {
        aiDetections: violations.aiDetections.length,
        manipulationFlags: violations.manipulationFlags.length,
        humanStyleScore: violations.humanStyleIssues[0]?.score || 100
      },
      details: violations,
      recommendation: this.getRecommendation(violations)
    }

    return report
  }

  /**
   * 改善推奨事項
   */
  getRecommendation(violations) {
    if (violations.severity === 'CRITICAL') {
      return 'COMPLETE_REGENERATION_REQUIRED - AI機械応答が検出されました'
    } else if (violations.severity === 'HIGH') {
      return 'MAJOR_REVISION_NEEDED - 洗脳的コンテンツの修正が必要'
    } else if (violations.severity === 'MEDIUM') {
      return 'STYLE_IMPROVEMENT_NEEDED - より人間らしい文体への調整が必要'
    } else {
      return 'CONTENT_APPROVED - 検証をパスしました'
    }
  }
}

export default AntiAiValidationSystem