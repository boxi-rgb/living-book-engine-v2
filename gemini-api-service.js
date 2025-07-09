// gemini-api-service.js
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("警告: GEMINI_API_KEY 環境変数が設定されていません。書籍生成機能は動作しません。");
    // process.exit(1); // 初期化段階で終了させるか、利用時にエラーとするか検討
}

class GeminiApiService {
    constructor() {
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY が設定されていません。GeminiApiService を初期化できません。");
        }
        this.genAI = new GoogleGenerativeAI(API_KEY);
        // モデル名を2.5系に修正
        this.geminiPro = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        this.geminiFlash = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 安全性設定の例 (レポートには詳細なかったが、一般的に必要)
        this.safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];
    }

    /**
     * API呼び出しをリトライするヘルパー関数（指数関数的バックオフ付き）
     * @param {Function} apiCallFunction API呼び出しを実行する関数
     * @param {number} maxRetries 最大リトライ回数
     * @param {number} baseDelayMs 初期遅延（ミリ秒）
     * @returns {Promise<any>} API呼び出しの結果
     */
    async _callWithRetry(apiCallFunction, maxRetries = 5, baseDelayMs = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCallFunction();
            } catch (error) {
                console.error(`API呼び出し試行 ${i + 1}/${maxRetries} が失敗しました: ${error.message}`);
                // リトライ可能なエラーコードか確認 (Google APIの一般的なエラーコードを参考に調整が必要)
                // e.g. error.status === 429 (Rate Limit) or error.status >= 500 (Server Error)
                // 詳細なエラーオブジェクト構造はSDKのドキュメントや実際のエラー応答を確認して調整
                const isRetryable = error.message.includes('429') || parseInt(error.status) >= 500;

                if (isRetryable && i < maxRetries - 1) {
                    const delay = Math.min(baseDelayMs * Math.pow(2, i) + Math.random() * 1000, 60000); // 最大60秒
                    console.log(`${delay / 1000}秒後にリトライします...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error("最大リトライ回数に達したか、リトライ不可能なエラーです。");
                    throw error; // 最終的なエラーをスロー
                }
            }
        }
    }

    /**
     * タスクタイプに基づいて適切なGeminiモデルを動的に選択し、コンテンツを生成します。
     * @param {string} prompt AIへのテキストプロンプト。
     * @param {string} taskType タスクの複雑さ/性質を示す事前定義されたタイプ。
     * @param {object} [generationConfigOverrides={}] オプションの生成設定パラメータのオーバーライド。
     * @param {object} [requestOptions={}] ストリーミングなどのリクエストオプション。
     * @returns {Promise<string|object>} AIによって生成されたコンテンツ。
     */
    async generateBookContent(prompt, taskType, generationConfigOverrides = {}, requestOptions = {}) {
        let modelToUse;
        // generationConfig はここで初期化し、タスクタイプに応じて設定を追加
        let generationConfig = {
            temperature: 0.7, // デフォルトのtemperature
            // maxOutputTokens: 8192, // 必要に応じて
            // responseMimeType, responseSchema は generationConfigOverrides で渡される想定
        };

        switch (taskType) {
            case 'title_suggestion':
            case 'short_summary':
            case 'keyword_extraction':
                modelToUse = this.geminiFlash;
                generationConfig.temperature = 0.5; // 比較的確定的な出力
                console.log(`タスクタイプ「${taskType}」のため、Gemini Flash モデルを使用します。`);
                break;
            case 'plot_development':
            case 'character_creation':
            case 'chapter_writing':
            case 'code_generation': // 書籍ジェネレーターにインタラクティブ要素が含まれる場合
                modelToUse = this.geminiPro;
                generationConfig.temperature = 0.8; // より創造的な出力
                console.log(`タスクタイプ「${taskType}」のため、Gemini Pro モデルを使用します。`);
                break;
            default:
                console.warn(`未定義のタスクタイプ: ${taskType}。デフォルトでGemini Flash モデルを使用します。`);
                modelToUse = this.geminiFlash;
                generationConfig.temperature = 0.6;
                break;
        }

        // 呼び出し側からの generationConfigOverrides で設定を上書き
        generationConfig = { ...generationConfig, ...generationConfigOverrides };

        const apiCall = async () => {
            // 構造化出力の場合のスキーマチェック
            if (generationConfig.responseMimeType === "application/json" && !generationConfig.responseSchema) {
                throw new Error("JSON出力を要求する場合、responseSchemaの指定が必要です。");
            }

            const requestPayload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: generationConfig,
                safetySettings: this.safetySettings // safetySettings をトップレベルに配置
            };

            const result = await modelToUse.generateContent(requestPayload);

            // generateContent のレスポンス構造に合わせて調整
            // const response = await result.response; // これはSDK v1.0.0-beta.0以前の書き方の場合がある
            // 最新のSDKでは result.response が直接 GenerateContentResponse のことが多い
            const response = result.response;

            // デバッグログ追加
            // console.log("[DEBUG] Full API Result:", JSON.stringify(result, null, 2));
            // console.log("[DEBUG] API Response object:", JSON.stringify(response, null, 2));


            if (!response) {
                console.error("APIからのレスポンスオブジェクト(result.response)がありませんでした。", result);
                throw new Error("APIからの有効なレスポンスオブジェクト(result.response)がありません。");
            }

            // 安全性フィードバックの確認
            // response.promptFeedback が存在するかまず確認
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                console.error(`プロンプトがブロックされました: ${response.promptFeedback.blockReason}`, response.promptFeedback);
                throw new Error(`プロンプトが安全性設定によりブロックされました: ${response.promptFeedback.blockReason}`);
            }
            // response.candidates が存在し、空でなく、最初の要素に finishReason があるか確認
            if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === 'SAFETY') {
                 console.error(`生成コンテンツがブロックされました: SAFETY`);
                 const safetyRatings = response.candidates[0].safetyRatings;
                 console.error('Safety Ratings:', safetyRatings);
                throw new Error(`生成されたコンテンツが安全性設定によりブロックされました。`);
            }

            // response.text() がメソッドとして存在するか確認
            if (typeof response.text !== 'function') {
                console.error("[ERROR] response.text is not a function. Response object:", JSON.stringify(response, null, 2));
                // コンテンツが別の場所にある可能性も考慮 (例: response.candidates[0].content.parts[0].text)
                if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0 && response.candidates[0].content.parts[0].text) {
                    console.warn("[WARN] Trying to get text from response.candidates[0].content.parts[0].text");
                    const fallbackText = response.candidates[0].content.parts[0].text;
                    if (generationConfig.responseMimeType === "application/json") {
                        try {
                            return JSON.parse(fallbackText);
                        } catch (e) {
                            console.error("JSONのパースに失敗しました (フォールバックテキスト):", fallbackText);
                            throw new Error("AIからのJSONレスポンスのパースに失敗しました (フォールバックテキスト)。");
                        }
                    }
                    return fallbackText;
                }
                throw new Error("response.text is not a function and no fallback text found.");
            }

            const textContent = response.text();
            console.log("[DEBUG] Text content from response.text():", typeof textContent, textContent === undefined ? "undefined" : textContent === null ? "null" : `"${textContent ? textContent.substring(0,100) + "..." : ""}"`);


            if (generationConfig.responseMimeType === "application/json") {
                try {
                    return JSON.parse(textContent);
                } catch (e) {
                    console.error("JSONのパースに失敗しました:", textContent);
                    throw new Error("AIからのJSONレスポンスのパースに失敗しました。");
                }
            }
            return textContent;
        };

        return this._callWithRetry(apiCall);
    }
}

module.exports = GeminiApiService;

// 使用例 (テスト用)
async function testApiService() {
    if (!API_KEY) {
        console.log("テストスキップ: GEMINI_API_KEYが未設定です。");
        return;
    }
    console.log("GeminiApiService のテストを開始します...");
    const service = new GeminiApiService();

    try {
        console.log("\n--- Flashモデルテスト (タイトル提案) ---");
        const titlePrompt = "AIと人間の協調に関するノンフィクション書籍のタイトルを3つ提案してください。";
        const titles = await service.generateBookContent(titlePrompt, 'title_suggestion');
        console.log("生成されたタイトル:", titles);

        console.log("\n--- Proモデルテスト (章の概要、JSON出力) ---");
        const chapterPrompt = "「AI倫理の未来」というテーマの書籍の第一章の概要を生成してください。章タイトル、短い要約、主要な議論ポイント3つをJSON形式で出力してください。";
        const chapterSchema = {
            type: "OBJECT",
            properties: {
                chapter_title: { type: "STRING", description: "章のタイトル" },
                summary: { type: "STRING", description: "章の短い要約（2-3文）" },
                key_points: { type: "ARRAY", items: { type: "STRING" }, description: "主要な議論ポイント（3つ）" }
            },
            required: ["chapter_title", "summary", "key_points"]
        };
        const chapterOutline = await service.generateBookContent(chapterPrompt, 'chapter_writing', {
            responseMimeType: "application/json",
            responseSchema: chapterSchema,
            temperature: 0.7
        });
        console.log("生成された章の概要 (JSON):", chapterOutline);
        if (typeof chapterOutline === 'object') {
            console.log("パース成功。タイトル:", chapterOutline.chapter_title);
        }

    } catch (error) {
        console.error("ApiServiceテスト中にエラーが発生しました:", error.message);
    }
}

// このファイルが直接実行された場合のみテストを実行
if (require.main === module) {
    testApiService();
}
