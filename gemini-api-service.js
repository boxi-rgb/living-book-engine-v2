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
        this.geminiPro = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // レポートでは2.5でしたが、利用可能な最新版を指定
        this.geminiFlash = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // 同上

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
        let baseGenerationConfig = {
            // temperature: 0.7, // デフォルト値はSDKに依存、必要なら設定
            // maxOutputTokens: 8192, // モデルの最大値に応じて設定
            safetySettings: this.safetySettings, // 安全性設定を適用
            // responseMimeType や responseSchema はタスクに応じて設定
        };

        switch (taskType) {
            case 'title_suggestion':
            case 'short_summary':
            case 'keyword_extraction':
                modelToUse = this.geminiFlash;
                baseGenerationConfig.temperature = 0.5; // 比較的確定的な出力
                // レポート提案: Flashの思考予算を無効にする (SDKでの具体的な指定方法を確認する必要あり)
                // thinkingConfig: { thinkingBudget: 0 } のようなものが generationConfig に入る想定
                // 現在のSDKバージョンで thinkingBudget が直接サポートされているか要確認。
                // なければ、この設定は一旦コメントアウトまたは削除。
                // generationConfigOverrides.thinkingConfig = { ...generationConfigOverrides.thinkingConfig, thinkingBudget: 0 };
                console.log(`タスクタイプ「${taskType}」のため、Gemini Flash モデルを使用します。`);
                break;
            case 'plot_development':
            case 'character_creation':
            case 'chapter_writing':
            case 'code_generation': // 書籍ジェネレーターにインタラクティブ要素が含まれる場合
                modelToUse = this.geminiPro;
                baseGenerationConfig.temperature = 0.8; // より創造的な出力
                console.log(`タスクタイプ「${taskType}」のため、Gemini Pro モデルを使用します。`);
                break;
            default:
                console.warn(`未定義のタスクタイプ: ${taskType}。デフォルトでGemini Flash モデルを使用します。`);
                modelToUse = this.geminiFlash;
                baseGenerationConfig.temperature = 0.6;
                break;
        }

        const finalGenerationConfig = { ...baseGenerationConfig, ...generationConfigOverrides };

        const apiCall = async () => {
            // 構造化出力の場合
            if (finalGenerationConfig.responseMimeType === "application/json" && !finalGenerationConfig.responseSchema) {
                throw new Error("JSON出力を要求する場合、responseSchemaの指定が必要です。");
            }

            const result = await modelToUse.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: finalGenerationConfig,
                // safetySettings は generationConfig 内に含めるのが一般的 (SDKによる)
            });

            // generateContent のレスポンス構造に合わせて調整
            // const response = await result.response; // これはSDK v1.0.0-beta.0以前の書き方の場合がある
            // 最新のSDKでは result.response が直接 GenerateContentResponse のことが多い
            const response = result.response;


            if (!response) {
                console.error("APIからのレスポンスがありませんでした。", result);
                throw new Error("APIからの有効なレスポンスがありません。");
            }

            // 安全性フィードバックの確認
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                console.error(`プロンプトがブロックされました: ${response.promptFeedback.blockReason}`);
                throw new Error(`プロンプトが安全性設定によりブロックされました: ${response.promptFeedback.blockReason}`);
            }
            if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === 'SAFETY') {
                 console.error(`生成コンテンツがブロックされました: SAFETY`);
                 const safetyRatings = response.candidates[0].safetyRatings;
                 console.error('Safety Ratings:', safetyRatings);
                throw new Error(`生成されたコンテンツが安全性設定によりブロックされました。`);
            }


            if (finalGenerationConfig.responseMimeType === "application/json") {
                try {
                    return JSON.parse(response.text());
                } catch (e) {
                    console.error("JSONのパースに失敗しました:", response.text());
                    throw new Error("AIからのJSONレスポンスのパースに失敗しました。");
                }
            }
            return response.text();
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
