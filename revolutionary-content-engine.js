/**
 * 🔥 REVOLUTIONARY CONTENT ENGINE
 * 業界破壊型コンテンツ生成システム - 常識粉砕特化型
 */

import GeminiApiService from './gemini-api-service.js'
import fs from 'fs'
import path from 'path'

class RevolutionaryContentEngine {
  constructor() {
    this.geminiService = new GeminiApiService()
    
    // 革命的品質基準（妥協なし）
    this.revolutionaryStandards = {
      paradigm_destruction_score: 90,
      cognitive_dissonance_index: 85,
      industry_differentiation: 95,
      truth_excavation_depth: 92,
      transformational_catalyst: 88
    }
    
    this.logger = this.initializeLogger()
  }

  /**
   * 業界常識の完全分析と破壊ポイント特定
   */
  async analyzeIndustryConsensus(category) {
    this.logger.info(`🕵️ Analyzing industry consensus for destruction: ${category}`)
    
    const analysisPrompt = `
あなたは業界の裏側を知り尽くした革命的分析者です。

【${category}業界の常識・定説を徹底分析】

以下の視点で業界の「当たり前」を完全に解剖してください：

1. 【支配的な思考パターン】
   - この業界で「常識」とされている考え方
   - 誰もが疑わずに信じている前提
   - 「成功法則」として語られるパターン

2. 【利害関係の構造】
   - この常識で得をする人・組織
   - なぜこの常識が維持されているのか
   - 誰がこの常識を広めているのか

3. 【隠されている矛盾・盲点】
   - 常識の論理的破綻ポイント
   - 都合の悪い事実・データ
   - 例外的な成功事例が示す真実

4. 【破壊すべき核心】
   - 最も強固で影響力のある思い込み
   - 崩せば業界全体が震撼する前提
   - 逆転の発想で見えてくる真実

革命的な視点で、容赦なく分析してください。
    `

    const analysis = await this.geminiService.generateBookContent(analysisPrompt, 'chapter_writing', {
      temperature: 0.9,
      maxOutputTokens: 4096
    })

    return this.parseIndustryAnalysis(analysis)
  }

  /**
   * 逆張り真実の構築
   */
  async constructContrarianTruths(industryAnalysis) {
    this.logger.info(`💡 Constructing contrarian truths`)
    
    const contrarianPrompt = `
業界分析結果：
${JSON.stringify(industryAnalysis, null, 2)}

【逆張り真実の構築】

上記の業界常識を完全に覆す革命的真実を構築してください：

1. 【常識の完全否定】
   - なぜその常識は間違っているのか
   - 実際のデータ・事実は何を示しているのか
   - 常識を信じた結果起きる悲劇

2. 【革命的な対案】
   - 常識と正反対のアプローチ
   - なぜそちらの方が効果的なのか
   - 実践した場合の具体的メリット

3. 【実証可能な証拠】
   - 逆張りアプローチの成功事例
   - 従来手法の失敗事例
   - 統計・データによる裏付け

4. 【実行戦略】
   - 革命的アプローチの具体的実践法
   - 段階別実行プラン
   - 予想される抵抗とその突破法

読者の世界観を根底から覆す内容にしてください。
    `

    const contrarianTruths = await this.geminiService.generateBookContent(contrarianPrompt, 'chapter_writing', {
      temperature: 0.85,
      maxOutputTokens: 6144
    })

    return this.parseContrarianTruths(contrarianTruths)
  }

  /**
   * 革命的書籍生成
   */
  async generateRevolutionaryBook(category, customPrompt = null) {
    this.logger.info(`🚀 REVOLUTIONARY BOOK GENERATION INITIATED: ${category}`)
    
    try {
      // PHASE 1: 業界常識の解体
      const industryAnalysis = await this.analyzeIndustryConsensus(category)
      this.logger.info(`📊 Industry consensus analyzed and marked for destruction`)
      
      // PHASE 2: 逆張り真実の構築
      const contrarianTruths = await this.constructContrarianTruths(industryAnalysis)
      this.logger.info(`💣 Contrarian truths constructed`)
      
      // PHASE 3: 革命的タイトル生成
      const revolutionaryTitle = await this.generateRevolutionaryTitle(category, contrarianTruths)
      this.logger.info(`🎯 Revolutionary title generated: ${revolutionaryTitle}`)
      
      // PHASE 4: 読者変容ナラティブ設計
      const transformationNarrative = await this.designTransformationNarrative(contrarianTruths)
      this.logger.info(`🔄 Transformation narrative designed`)
      
      // PHASE 5: 革命的コンテンツ生成
      const revolutionaryContent = await this.generateRevolutionaryContent({
        category,
        title: revolutionaryTitle,
        industryAnalysis,
        contrarianTruths,
        transformationNarrative
      })
      
      // PHASE 6: 革命品質検証
      const qualityAssessment = await this.assessRevolutionaryQuality(revolutionaryContent)
      
      if (qualityAssessment.meetsCriteria) {
        this.logger.info(`✅ REVOLUTIONARY STANDARDS MET`)
        return await this.generateFinalRevolutionaryBook(revolutionaryContent, qualityAssessment)
      } else {
        this.logger.warn(`⚠️ Revolutionary standards not met, regenerating with higher intensity`)
        return await this.regenerateWithHigherIntensity(revolutionaryContent, qualityAssessment)
      }
      
    } catch (error) {
      this.logger.error(`💀 REVOLUTION FAILED: ${error.message}`)
      throw error
    }
  }

  /**
   * 革命的タイトル生成
   */
  async generateRevolutionaryTitle(category, contrarianTruths) {
    const titlePrompt = `
分野：${category}
逆張り真実：${JSON.stringify(contrarianTruths, null, 2)}

【業界を震撼させる革命的タイトル生成】

以下の要件を満たすタイトルを生成してください：

1. 【常識破壊力】
   - 業界の当たり前を完全否定
   - 読んだ瞬間に衝撃を与える
   - 専門家が反発したくなる内容

2. 【認知的不協和】
   - 読者の予想を裏切る
   - 一見矛盾しているように見える
   - 興味を引かずにはいられない

3. 【革命的約束】
   - 従来とは正反対のアプローチ
   - 劇的な変化を予感させる
   - 具体的な変革を示唆

4. 【禁断の魅力】
   - 業界が隠したがる内容
   - タブーに踏み込む勇気
   - 内部告発的な響き

例：
- "なぜ努力は無駄なのか - 成功者が隠す「怠惰の哲学」"
- "マーケティングは嘘だった - 顧客を騙さずに売る禁断の技術"

${category}分野で業界を根底から覆すタイトルを生成してください。
    `

    const title = await this.geminiService.generateBookContent(titlePrompt, 'title_suggestion', {
      temperature: 0.95,
      maxOutputTokens: 1024
    })

    return title.trim()
  }

  /**
   * 読者変容ナラティブ設計
   */
  async designTransformationNarrative(contrarianTruths) {
    const narrativePrompt = `
逆張り真実：${JSON.stringify(contrarianTruths, null, 2)}

【読者変容ナラティブ設計】

読者の思考・行動・世界観を根本から変える物語構造を設計してください：

1. 【認知的不協和の創出】
   - 読者の確信を揺さぶる導入
   - 予想外の事実の提示方法
   - 快適圏からの強制退去戦略

2. 【世界観の解体・再構築】
   - 古い思考枠組みの段階的破壊
   - 新しい視点の段階的構築
   - パラダイムシフトの瞬間設計

3. 【個人的革命の実現】
   - 読者固有状況への適用方法
   - 具体的行動変化の誘導
   - 継続的変革のメカニズム

5章構成で、各章が読者を次のレベルへ強制的に押し上げる構造を設計してください。
    `

    const narrative = await this.geminiService.generateBookContent(narrativePrompt, 'plot_development', {
      temperature: 0.8,
      maxOutputTokens: 3072
    })

    return this.parseTransformationNarrative(narrative)
  }

  /**
   * 革命的コンテンツ生成（5章並列）
   */
  async generateRevolutionaryContent(strategy) {
    this.logger.info(`📚 Generating revolutionary content (parallel processing)`)
    
    const numChapters = 5
    
    // 革命的章の並列生成
    this.logger.info(`🔥 Starting parallel generation of ${numChapters} revolutionary chapters`)
    const chapterPromises = Array.from({length: numChapters}, (_, i) => 
      this.generateRevolutionaryChapter(strategy, i + 1, numChapters)
    )
    
    const chapters = await Promise.all(chapterPromises)
    this.logger.info(`✅ All ${numChapters} revolutionary chapters generated`)
    
    return {
      title: strategy.title,
      chapters,
      totalCharacters: chapters.reduce((sum, ch) => sum + ch.characterCount, 0),
      revolutionaryScore: await this.calculateRevolutionaryScore(chapters)
    }
  }

  /**
   * 単一革命的章生成
   */
  async generateRevolutionaryChapter(strategy, chapterNumber, totalChapters) {
    this.logger.info(`🔥 Generating Revolutionary Chapter ${chapterNumber}/${totalChapters}`)
    
    const chapterPrompt = this.createRevolutionaryChapterPrompt(strategy, chapterNumber, totalChapters)
    
    try {
      const rawContent = await this.geminiService.generateBookContent(chapterPrompt, 'chapter_writing', {
        temperature: 0.85,
        maxOutputTokens: 8192
      })
      
      const chapter = {
        number: chapterNumber,
        title: this.generateRevolutionaryChapterTitle(strategy, chapterNumber),
        content: rawContent,
        characterCount: rawContent.length,
        revolutionaryIntensity: await this.measureRevolutionaryIntensity(rawContent)
      }
      
      this.logger.info(`🚀 Revolutionary Chapter ${chapterNumber} completed (${chapter.characterCount} chars, intensity: ${chapter.revolutionaryIntensity})`)
      return chapter
      
    } catch (error) {
      this.logger.error(`💀 Revolutionary Chapter ${chapterNumber} generation failed: ${error.message}`)
      throw new Error(`Revolutionary Chapter ${chapterNumber} generation failed: ${error.message}`)
    }
  }

  /**
   * 革命的章プロンプト作成
   */
  createRevolutionaryChapterPrompt(strategy, chapterNumber, totalChapters) {
    const chapterRole = this.getRevolutionaryChapterRole(chapterNumber)
    
    return `
あなたは業界の既得権益を破壊する革命的な著者です。

【書籍情報】
タイトル: ${strategy.title}
分野: ${strategy.category}
第${chapterNumber}章/${totalChapters}章

【この章の革命的役割】
${chapterRole}

【絶対に守るべき革命的原則】

1. 【常識破壊の徹底】
   - 業界の「当たり前」を容赦なく否定
   - 読者の前提を根底から覆す
   - 専門家が反発する内容を含める

2. 【認知的不協和の創出】
   - 読者の予想を完全に裏切る展開
   - 快適圏から強制的に引きずり出す
   - 「そんなはずはない」と思わせる

3. 【革命的洞察の提供】
   - 他では絶対に読めない独自の真実
   - 業界が隠したがる裏側の暴露
   - 逆張りアプローチの具体的手法

4. 【実行可能な革命戦術】
   - 今すぐ実践できる具体的方法
   - 従来手法との明確な差別化
   - 結果を保証する詳細な手順

5. 【読者変容の強制】
   - この章を読む前と後で別人になる
   - 世界観レベルでの根本的変化
   - 後戻りできない覚醒体験

【文章の特徴】
- 業界の内部者しか知らない具体的事実を含める
- 感情的でありながら論理的に破綻のない論証
- 読者が他人に話したくなる衝撃的内容
- AIが書いたとは絶対に思われない人間的深み

【文字数】最低8,000文字以上の濃密な内容

読者の人生を根本から変える革命的な章を執筆してください。
    `
  }

  /**
   * 革命的章の役割定義
   */
  getRevolutionaryChapterRole(chapterNumber) {
    const roles = {
      1: '業界の嘘を暴露し、読者の世界観を根底から揺さぶる。常識という名の幻想を完全に破壊する。',
      2: '従来手法の致命的欠陥を具体的に証明し、革命的代替案の優位性を圧倒的証拠で示す。',
      3: '革命的手法の具体的実践方法を詳細に解説し、読者が即座に実行できる戦術を提供する。',
      4: '高度な応用技術と、抵抗勢力（既得権益者）への対抗戦略を伝授する。',
      5: '読者の完全なる変革を完成させ、革命的人生を継続するための永続システムを構築する。'
    }
    
    return roles[chapterNumber] || `第${chapterNumber}章の革命的変革`
  }

  /**
   * 革命的章タイトル生成
   */
  generateRevolutionaryChapterTitle(strategy, chapterNumber) {
    const titlePatterns = {
      1: '第1章：業界が隠す致命的な嘘 - ',
      2: '第2章：常識の正反対が正解だった - ',
      3: '第3章：革命的実践法の全貌 - ',
      4: '第4章：既得権益との戦い方 - ',
      5: '第5章：完全なる変革の完成 - '
    }
    
    const categoryFocus = {
      'self-help': ['自己欺瞞からの脱出', '努力信仰の崩壊', '怠惰の哲学', '競争からの離脱', '真の自由への道'],
      'business': ['成長神話の破綻', 'マーケティングの嘘', '顧客第一主義の罠', '競合との共存', '利益を捨てる勇気'],
      'technology': ['効率化の罠', 'AI依存の危険', 'デジタル断食', '人間回帰戦略', 'テクノロジー支配からの解放']
    }
    
    const focuses = categoryFocus[strategy.category] || ['既存概念の破壊', '革命的転換', '新時代の創造', '完全なる変革', '真の解放']
    const focus = focuses[chapterNumber - 1] || '革命的変革'
    
    return `${titlePatterns[chapterNumber]}${focus}`
  }

  /**
   * 革命的品質評価
   */
  async assessRevolutionaryQuality(content) {
    this.logger.info(`🔍 Assessing revolutionary quality`)
    
    const qualityPrompt = `
以下のコンテンツを革命的品質基準で評価してください：

【評価対象】
タイトル: ${content.title}
章数: ${content.chapters.length}
総文字数: ${content.totalCharacters}

【各章の内容サンプル】
${content.chapters.map(ch => `第${ch.number}章: ${ch.content.substring(0, 500)}...`).join('\n\n')}

【革命的品質基準（各100点満点）】

1. 【業界常識破壊力】 (目標90点以上)
   - 既存の常識をどれだけ覆しているか
   - 業界専門家が反発する内容の度合い
   - 従来手法との明確な差別化レベル

2. 【認知的不協和生成力】 (目標85点以上)  
   - 読者の予想をどれだけ裏切るか
   - 快適圏破壊の徹底度
   - 「そんなはずはない」感の強度

3. 【独自性・差別化度】 (目標95点以上)
   - 他のコンテンツとの違いの明確さ
   - 唯一無二の洞察・手法の有無
   - AI生成感の完全排除度

4. 【真実発掘深度】 (目標92点以上)
   - 表面的でない深層真実の露呈度
   - 業界の裏側暴露の詳細レベル
   - 実証可能な証拠の充実度

5. 【変革触媒力】 (目標88点以上)
   - 読者の行動変化誘発力
   - 世界観転換の強制力
   - 実行可能性と効果の保証度

各項目を厳正に評価し、革命的品質基準を満たしているかジャッジしてください。
    `

    const assessment = await this.geminiService.generateBookContent(qualityPrompt, 'code_generation', {
      temperature: 0.3,
      maxOutputTokens: 2048
    })

    return this.parseQualityAssessment(assessment)
  }

  /**
   * 品質評価結果のパース
   */
  parseQualityAssessment(assessment) {
    // 簡易パース（実際はより sophisticated な解析が必要）
    const scores = {
      paradigm_destruction: this.extractScore(assessment, '業界常識破壊力'),
      cognitive_dissonance: this.extractScore(assessment, '認知的不協和生成力'),
      differentiation: this.extractScore(assessment, '独自性・差別化度'),
      truth_excavation: this.extractScore(assessment, '真実発掘深度'),
      transformation_catalyst: this.extractScore(assessment, '変革触媒力')
    }

    const meetsCriteria = 
      scores.paradigm_destruction >= this.revolutionaryStandards.paradigm_destruction_score &&
      scores.cognitive_dissonance >= this.revolutionaryStandards.cognitive_dissonance_index &&
      scores.differentiation >= this.revolutionaryStandards.industry_differentiation &&
      scores.truth_excavation >= this.revolutionaryStandards.truth_excavation_depth &&
      scores.transformation_catalyst >= this.revolutionaryStandards.transformational_catalyst

    return {
      scores,
      meetsCriteria,
      assessment: assessment,
      overallScore: Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
    }
  }

  /**
   * スコア抽出（簡易版）
   */
  extractScore(text, criterion) {
    // 実際はより sophisticated な解析が必要
    const regex = new RegExp(`${criterion}[:\\s]*([0-9]+)`, 'i')
    const match = text.match(regex)
    return match ? parseInt(match[1]) : 75 // デフォルト値
  }

  /**
   * 最終革命書籍生成
   */
  async generateFinalRevolutionaryBook(content, qualityAssessment) {
    this.logger.info(`📄 Generating final revolutionary book`)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const slug = this.createSlug(content.title)
    const outputDir = `docs/revolutionary-books/${slug}-${timestamp}`
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 革命的目次ファイル生成
    const indexContent = this.generateRevolutionaryIndexFile(content, qualityAssessment)
    fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent)
    
    // 各章ファイル生成
    content.chapters.forEach((chapter, index) => {
      const chapterContent = this.generateRevolutionaryChapterFile(chapter, content, index)
      fs.writeFileSync(path.join(outputDir, `chapter-${chapter.number}.md`), chapterContent)
    })
    
    // 革命品質レポート生成
    const revolutionReport = this.generateRevolutionReport(qualityAssessment, content)
    fs.writeFileSync(path.join(outputDir, 'revolution-report.json'), JSON.stringify(revolutionReport, null, 2))
    
    return {
      title: content.title,
      outputPath: outputDir,
      revolutionary_scores: qualityAssessment.scores,
      chapters: content.chapters.length,
      total_characters: content.totalCharacters,
      revolution_verified: qualityAssessment.meetsCriteria,
      industry_disruption_potential: qualityAssessment.overallScore
    }
  }

  /**
   * 革命的インデックスファイル生成
   */
  generateRevolutionaryIndexFile(content, qualityAssessment) {
    return `---
title: "${content.title}"
description: "業界破壊型革命的書籍 - ${content.title}"
author: "Revolutionary Content Engine"
type: "INDUSTRY_DISRUPTION"
revolution_score: ${qualityAssessment.overallScore}
industry_threat_level: ${qualityAssessment.meetsCriteria ? 'MAXIMUM' : 'HIGH'}
published: ${new Date().toISOString()}
language: ja
pages: ${content.chapters.length + 1}
warning: "既存業界専門家による反発必至"
---

# ${content.title}

## 🚨 **警告：業界破壊的内容**

本書は${content.chapters[0]?.title.includes('自己') ? '自己啓発' : content.chapters[0]?.title.includes('ビジネス') ? 'ビジネス' : 'テクノロジー'}業界の既得権益を根底から破壊する革命的内容を含んでいます。

既存の常識に安住したい方、変化を恐れる方は読まないでください。

## 🔥 **革命的品質保証**

- **業界常識破壊力**: ${qualityAssessment.scores.paradigm_destruction}/100
- **認知的不協和生成**: ${qualityAssessment.scores.cognitive_dissonance}/100  
- **独自性・差別化**: ${qualityAssessment.scores.differentiation}/100
- **真実発掘深度**: ${qualityAssessment.scores.truth_excavation}/100
- **変革触媒力**: ${qualityAssessment.scores.transformation_catalyst}/100

**総合革命度**: ${qualityAssessment.overallScore.toFixed(1)}/100

${qualityAssessment.meetsCriteria ? '🏆 **革命基準達成** - 業界破壊認定済み' : '⚠️ **革命継続中** - さらなる破壊力強化必要'}

## 📚 **革命的目次**

${content.chapters.map((chapter, index) => 
  `${chapter.number}. [${chapter.title}](./chapter-${chapter.number}.md)`
).join('\n')}

## ⚡ **読者への最終警告**

この本を読んだ後、あなたは以前の自分には戻れません。

業界の「常識」「成功法則」「専門家の権威」すべてが幻想だったことを知り、
真実に基づいた革命的アプローチで人生を再設計することになります。

**覚悟はできていますか？**

---

*この革命的書籍があなたの人生を根底から変革することを保証します。*

**生成日時**: ${new Date().toLocaleString('ja-JP')}
**業界破壊度**: ${qualityAssessment.meetsCriteria ? 'MAXIMUM' : 'HIGH'}
`
  }

  /**
   * スラッグ作成
   */
  createSlug(title) {
    return title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 40)
  }

  /**
   * ログ初期化
   */
  initializeLogger() {
    return {
      info: (msg) => console.log(`[${new Date().toISOString()}] [REVOLUTION] ${msg}`),
      warn: (msg) => console.log(`[${new Date().toISOString()}] [WARNING] ${msg}`),
      error: (msg) => console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`)
    }
  }

  // 追加のヘルパーメソッド
  parseIndustryAnalysis(analysis) {
    // 簡易実装 - 実際はより sophisticated
    return { analysis: analysis.substring(0, 1000) }
  }

  parseContrarianTruths(truths) {
    return { truths: truths.substring(0, 1000) }
  }

  parseTransformationNarrative(narrative) {
    return { narrative: narrative.substring(0, 1000) }
  }

  async calculateRevolutionaryScore(chapters) {
    return chapters.reduce((sum, ch) => sum + (ch.revolutionaryIntensity || 85), 0) / chapters.length
  }

  async measureRevolutionaryIntensity(content) {
    // 革命的強度の簡易計算
    const contrarianWords = ['逆に', '実は', '嘘', '間違い', '真実は', '業界が隠す', '常識を疑え']
    const intensity = contrarianWords.reduce((count, word) => {
      return count + (content.split(word).length - 1)
    }, 0)
    
    return Math.min(95, 70 + intensity * 2)
  }

  generateRevolutionaryChapterFile(chapter, content, index) {
    const prevChapter = index > 0 ? `chapter-${index}.md` : 'index.md'
    const nextChapter = index < content.chapters.length - 1 ? `chapter-${index + 2}.md` : null
    
    return `---
title: "${chapter.title}"
chapter: ${chapter.number}
book_title: "${content.title}"
prev: ${prevChapter.replace('.md', '')}
next: ${nextChapter ? nextChapter.replace('.md', '') : ''}
character_count: ${chapter.characterCount}
revolutionary_intensity: ${chapter.revolutionaryIntensity}
industry_threat_level: HIGH
---

# ${chapter.title}

${chapter.content}

---

**前の章**: [${index === 0 ? '革命的書籍について' : `第${index}章`}](${prevChapter})
${nextChapter ? `**次の章**: [第${index + 2}章](${nextChapter})` : '**完了**: [革命的目次に戻る](index.md)'}

*第${chapter.number}章「${chapter.title}」完了 - 全${content.chapters.length}章中*
`
  }

  generateRevolutionReport(qualityAssessment, content) {
    return {
      timestamp: new Date().toISOString(),
      book_title: content.title,
      revolutionary_metrics: qualityAssessment.scores,
      revolution_verified: qualityAssessment.meetsCriteria,
      industry_disruption_potential: qualityAssessment.overallScore,
      threat_assessment: qualityAssessment.meetsCriteria ? 'MAXIMUM_INDUSTRY_DISRUPTION' : 'HIGH_DISRUPTION_POTENTIAL',
      recommendations: qualityAssessment.meetsCriteria ? 
        ['Revolutionary standards achieved', 'Ready for industry disruption', 'Prepare for expert backlash'] :
        ['Increase contrarian intensity', 'Enhance cognitive dissonance', 'Deepen truth excavation']
    }
  }

  async regenerateWithHigherIntensity(content, qualityAssessment) {
    this.logger.warn(`🔥 Regenerating with MAXIMUM REVOLUTIONARY INTENSITY`)
    // より過激な再生成ロジック
    return await this.generateRevolutionaryBook(content.category, 'MAXIMUM_INTENSITY')
  }
}

export default RevolutionaryContentEngine