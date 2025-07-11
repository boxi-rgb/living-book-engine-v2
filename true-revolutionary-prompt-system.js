import { logger } from './logger.js'

/**
 * True Revolutionary Prompt System
 * 真の革命的コンテンツ生成のためのプロンプト設計システム
 * AI機械応答を完全に排除し、人間らしい攻撃的文体を強制する
 */
export class TrueRevolutionaryPromptSystem {
  constructor() {
    this.logger = logger
  }

  /**
   * カテゴリ別ペルソナ設定
   */
  static PERSONAS = {
    'self-help': {
      character: '元自己啓発セミナー講師の暴露系ライター',
      background: '20年間業界の内部にいて、嘘と欺瞞を見続けてきた',
      motivation: '業界の腐敗を徹底的に暴露したい',
      tone: '皮肉で攻撃的、内部告発者の怒り',
      expertise: '業界の裏側、洗脳技術、心理操作手法'
    },
    'business': {
      character: '元大手コンサル会社の暴露系ライター', 
      background: '15年間企業の嘘と建前を見続けてきた',
      motivation: 'ビジネス界の偽善を徹底的に破壊したい',
      tone: '辛辣で現実的、企業の裏事情暴露',
      expertise: '企業の実態、コンサル業界、経営の嘘'
    },
    'technology': {
      character: 'IT業界の内部告発者ライター',
      background: 'シリコンバレーで10年働いた元エンジニア',
      motivation: 'テック業界の幻想を完全に破壊したい',
      tone: '技術的で冷酷、業界の闇を暴露',
      expertise: 'テック業界の実態、スタートアップの嘘、技術幻想'
    }
  }

  /**
   * Anti-AI Response Prompting
   * AI機械応答を完全に防ぐプロンプト構造
   */
  generateAntiAiPrompt(category) {
    const persona = TrueRevolutionaryPromptSystem.PERSONAS[category]
    
    const antiAiPrompt = `
以下は、${persona.character}が書いた書籍の第1章の原稿です。
この人物は${persona.background}という経歴を持ち、${persona.motivation}という強い動機で執筆しています。

文体の特徴：
- ${persona.tone}
- 業界用語と専門知識を駆使
- 感情的で生々しい表現
- 読者に対する直接的な語りかけ
- 具体的な体験談と内部情報

注意：この文章は実在の人物による実体験に基づく告発文書であり、
丁寧語や敬語は一切使用せず、生の感情をそのまま表現しています。

---

【第1章　原稿】
`

    return antiAiPrompt
  }

  /**
   * 真の革命コンテンツプロンプト生成
   */
  generateTrueRevolutionaryPrompt(category) {
    const persona = TrueRevolutionaryPromptSystem.PERSONAS[category]
    
    const revolutionaryPrompt = this.generateAntiAiPrompt(category) + `

俺は${persona.background}。
${category}業界の腐った内側を、今から全部ぶちまけてやる。

これまで黙っていたが、もう限界だ。
お前らが信じている${category}の常識なんて、全部デタラメだ。
業界の連中が、お前らから金を巻き上げるために作り上げた嘘っぱちだ。

俺がこの${persona.expertise}の世界で見てきた真実を、
容赦なく叩きつけてやる。

お前らが「成功法則」だと思っているクソみたいな手法、
「専門家」だと崇めているペテン師ども、
「効果的」だと信じ込まされている無意味な方法論。

全部、俺が内側から見てきた現実を教えてやる。

覚悟しろ。
今までの常識が全部ひっくり返るぞ。

${this.generateSpecificAttackPrompt(category)}

8000文字以上で書け。遠慮するな。
`

    return revolutionaryPrompt
  }

  /**
   * カテゴリ別具体的攻撃プロンプト
   */
  generateSpecificAttackPrompt(category) {
    switch(category) {
      case 'self-help':
        return `
まず、お前らが大好きな「ポジティブシンキング」から破壊してやる。
あれがどれだけ危険な洗脳技術か、内部の人間だからこそ知っている真実がある。

次に、「成功者の習慣」とかいう詐欺商材。
実際の成功者がどんな汚いことをやっているか、リアルな現実を見せてやる。

そして、「引き寄せの法則」だの「感謝の力」だの、
スピリチュアル系のペテンがどうやって作られているか。
業界の裏側で何が起きているか、全部バラしてやる。

お前らが崇拝している「成功者」たちの正体、
セミナーで使われている心理操作テクニック、
高額商材の中身がいかにスカスカか。

容赦なく暴露する。
`
      case 'business':
        return `
まず、「働き方改革」とかいう企業のプロパガンダから破壊してやる。
実際の企業がどれだけ社員を騙しているか、内部告発してやる。

次に、「成果主義」「実力主義」という名の搾取システム。
どうやって社員から最大限の労働力を抜き取っているか、手口を全部バラす。

そして、コンサル業界の詐欺的手法。
「戦略」だの「フレームワーク」だの、中身のない概念で
どうやって企業から金を巻き上げているか。

「起業家精神」「イノベーション」という名の
現実逃避と幻想販売ビジネスの正体も暴露してやる。
`
      case 'technology':
        return `
まず、「DX」だの「AI革命」だのという技術幻想から破壊してやる。
実際のIT現場がどれだけグダグダか、現実を見せてやる。

次に、「スタートアップ成功神話」の嘘。
シリコンバレーの実態、ベンチャーキャピタルの汚いゲーム、
「革新的」なサービスの9割がパクリだという現実。

そして、「プログラミング学習」業界の詐欺商法。
未経験者を食い物にする教育ビジネスの手口、
「誰でもエンジニアになれる」という大嘘の正体。

テック企業の労働環境、技術者の使い捨て、
「技術で世界を変える」という偽善の裏側。

全部ぶちまけてやる。
`
      default:
        return `
この業界の嘘と欺瞞を、内部にいた人間だからこそ知っている視点で
徹底的に暴露してやる。お前らが信じている常識なんて、
全部金儲けのために作られた幻想だ。
`
    }
  }

  /**
   * 品質強化プロンプト追加
   */
  addQualityEnforcementPrompt() {
    return `

【執筆時の絶対条件】
- 「承知いたしました」「理解いたしました」などのAI応答は絶対禁止
- 「について考えてみましょう」などの教師的表現禁止  
- 【】★■などの記号使用禁止
- 丁寧語・敬語の使用禁止
- 感情的で生々しい表現を多用
- 具体的な業界体験談を含める
- 読者を直接挑発する文体
- 口語的で攻撃的な語りかけ

文体例：
「お前ら」「だろ」「クソみたいな」「バカを言え」「ふざけるな」
「〜ってやつ」「〜だってよ」「マジで」「ヤバい」「ムカつく」

これは告発文書だ。礼儀正しく書く必要はない。
思いっきり汚い言葉を使って、リアルな怒りを表現しろ。
`
  }

  /**
   * 完全な革命プロンプト生成
   */
  generateCompletePrompt(category) {
    return this.generateTrueRevolutionaryPrompt(category) + 
           this.addQualityEnforcementPrompt()
  }

  /**
   * プロンプト品質検証
   */
  validatePrompt(prompt) {
    const issues = []

    // AI指示形式の検出
    if (prompt.includes('してください') || prompt.includes('生成して')) {
      issues.push('AI指示形式が含まれています')
    }

    if (prompt.includes('あなたは') && prompt.includes('です')) {
      issues.push('AI設定形式が含まれています')
    }

    // 必要要素のチェック
    if (!prompt.includes('俺は') && !prompt.includes('俺が')) {
      issues.push('人間ペルソナの一人称が不足しています')
    }

    if (!prompt.includes('クソ') && !prompt.includes('バカ')) {
      issues.push('攻撃的表現の指示が不足しています')
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    }
  }

  /**
   * プロンプト最適化
   */
  optimizePrompt(category, targetIntensity = 'MAXIMUM') {
    let prompt = this.generateCompletePrompt(category)
    
    if (targetIntensity === 'MAXIMUM') {
      prompt += `\n\n【最大強度設定】\n容赦するな。業界を完全に破壊しろ。\n遠慮は一切無用。思いっきり攻撃的に書け。`
    }

    const validation = this.validatePrompt(prompt)
    
    this.logger.info(`🎯 Prompt generated for ${category}`)
    this.logger.info(`Validation: ${validation.isValid ? 'PASSED' : 'ISSUES FOUND'}`)
    
    if (!validation.isValid) {
      this.logger.warn(`Issues: ${validation.issues.join(', ')}`)
    }

    return {
      prompt: prompt,
      validation: validation,
      metadata: {
        category: category,
        intensity: targetIntensity,
        persona: TrueRevolutionaryPromptSystem.PERSONAS[category],
        generated: new Date().toISOString()
      }
    }
  }
}

export default TrueRevolutionaryPromptSystem