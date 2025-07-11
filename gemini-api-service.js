// gemini-api-service.js
import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import Logger from './logger.js'; // Loggerをインポート

dotenv.config();

class GeminiApiService {
    constructor(appConfig = {}) { // appConfig を引数で受け取る
        this.appConfig = appConfig; // インスタンスプロパティとして保持
        const apiKeyFromEnv = process.env.GEMINI_API_KEY;
        if (!apiKeyFromEnv) {
            Logger.warn("GEMINI_API_KEY 環境変数が設定されていません。GeminiApiService の一部機能が動作しない可能性があります。");
            throw new Error("GEMINI_API_KEY が設定されていません。GeminiApiService を初期化できません。");
        }
        this.apiKey = apiKeyFromEnv;
        this.genAI = new GoogleGenerativeAI(this.apiKey);

        const proModelName = "gemini-2.5-pro";
        const flashModelName = "gemini-2.5-flash";
        this.geminiPro = this.genAI.getGenerativeModel({ model: proModelName });
        this.geminiPro.modelName = proModelName; // モデル名をインスタンスに保持
        this.geminiFlash = this.genAI.getGenerativeModel({ model: flashModelName });
        this.geminiFlash.modelName = flashModelName; // モデル名をインスタンスに保持

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
                Logger.error(`API呼び出し試行 ${i + 1}/${maxRetries} が失敗しました:`, error.message);
                Logger.debug("APIエラー詳細:", error); // エラーオブジェクト全体をデバッグログに

                // error.status が存在し、それが数値であることを確認してからparseIntする
                const statusCode = error.status ? parseInt(error.status) : null;
                const isRetryable = error.message.includes('429') || (statusCode && statusCode >= 500);

                if (isRetryable && i < maxRetries - 1) {
                    const delay = Math.min(baseDelayMs * Math.pow(2, i) + Math.random() * 1000, 60000); // 最大60秒
                    Logger.info(`${delay / 1000}秒後にリトライします... (試行 ${i + 2}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    if (isRetryable) {
                        Logger.error("最大リトライ回数に達しました。API呼び出しを中止します。");
                    } else {
                        Logger.error("リトライ不可能なエラーです。API呼び出しを中止します。");
                    }
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
            temperature: this.appConfig.apiService?.defaultTemperature || 0.7, // this.appConfigから取得
        };

        switch (taskType) {
            case 'title_suggestion':
            case 'short_summary':
            case 'keyword_extraction':
                modelToUse = this.geminiFlash;
                generationConfig.temperature = 0.5; // 比較的確定的な出力
                Logger.info(`タスクタイプ「${taskType}」のため、モデル「${modelToUse.modelName}」を使用します。 Temperature: ${generationConfig.temperature}`);
                break;
            case 'plot_development':
            case 'character_creation':
            case 'chapter_writing':
            case 'code_generation':
                modelToUse = this.geminiPro;
                generationConfig.temperature = 0.8; // より創造的な出力
                Logger.info(`タスクタイプ「${taskType}」のため、モデル「${modelToUse.modelName}」を使用します。 Temperature: ${generationConfig.temperature}`);
                break;
            default:
                Logger.warn(`未定義のタスクタイプ: ${taskType}。デフォルトでモデル「${this.geminiFlash.modelName}」を使用します。`);
                modelToUse = this.geminiFlash;
                generationConfig.temperature = 0.6;
                break;
        }

        // 呼び出し側からの generationConfigOverrides で設定を上書き
        generationConfig = { ...generationConfig, ...generationConfigOverrides };
        Logger.debug("最終的なGenerationConfig:", generationConfig);

        const apiCall = async () => {
            if (generationConfig.responseMimeType === "application/json" && !generationConfig.responseSchema) {
                Logger.error("JSON出力が要求されましたが、responseSchemaが提供されていません。", "Config:", generationConfig);
                throw new Error("JSON出力を要求する場合、responseSchemaの指定が必要です。");
            }

            const requestPayload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: generationConfig,
                safetySettings: this.safetySettings
            };
            Logger.debug("Gemini APIリクエストペイロード:", JSON.stringify(requestPayload, null, 2).substring(0, 500) + "..."); // 長いプロンプトを考慮

            const result = await modelToUse.generateContent(requestPayload);

            // generateContent のレスポンス構造に合わせて調整
            // const response = await result.response; // これはSDK v1.0.0-beta.0以前の書き方の場合がある
            // 最新のSDKでは result.response が直接 GenerateContentResponse のことが多い
            const response = result.response;

            // デバッグログ追加
            // console.log("[DEBUG] Full API Result:", JSON.stringify(result, null, 2));
            // console.log("[DEBUG] API Response object:", JSON.stringify(response, null, 2)); // これはデバッグ時のみ有効化

            if (!response) {
                Logger.error("APIからのレスポンスオブジェクト(result.response)が取得できませんでした。", "Full result:", result);
                throw new Error("APIからの有効なレスポンスオブジェクト(result.response)が取得できませんでした。");
            }

            // 安全性フィードバックの確認
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                Logger.error(`プロンプトがブロックされました。理由: ${response.promptFeedback.blockReason}`, "詳細:", response.promptFeedback);
                throw new Error(`プロンプトが安全性設定によりブロックされました: ${response.promptFeedback.blockReason}`);
            }
            if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === 'SAFETY') {
                 Logger.error(`生成コンテンツが安全性によりブロックされました。`);
                 const safetyRatings = response.candidates[0].safetyRatings;
                 Logger.warn('Safety Ratings:', safetyRatings); // 警告レベルでレーティング詳細を出力
                throw new Error(`生成されたコンテンツが安全性設定によりブロックされました。Finish reason: SAFETY`);
            }

            if (typeof response.text !== 'function') {
                Logger.error("response.text が関数ではありません。", "Response object:", JSON.stringify(response, null, 2));
                // フォールバック処理は複雑化を避けるため一旦削除。text()がない場合はエラーとする。
                throw new Error("APIレスポンスの形式が不正です: response.text が関数ではありません。");
            }

            const textContent = response.text();
            Logger.debug("[DEBUG] Text content from response.text():", typeof textContent, textContent === undefined ? "undefined" : textContent === null ? "null" : `"${textContent ? textContent.substring(0,100) + "..." : ""}"`);
            if (textContent === undefined || textContent === null) {
                 Logger.warn("APIから返された textContent が undefined または null でした。空文字列として扱います。");
                 // 空文字列を返すことで、呼び出し元でのエラーを防ぎ、本文なしとして処理できるようにする
                 return generationConfig.responseMimeType === "application/json" ? "{}" : "";
            }


            if (generationConfig.responseMimeType === "application/json") {
                try {
                    return JSON.parse(textContent);
                } catch (e) {
                    Logger.error("JSONのパースに失敗しました。", "元のテキスト:", textContent, "エラー:", e.message);
                    throw new Error("AIからのJSONレスポンスのパースに失敗しました。");
                }
            }
            return textContent;
        };

        return this._callWithRetry(apiCall);
    }
}

export default GeminiApiService;

// 使用例 (テスト用) - Loggerを使うように変更
async function testApiService() {
    if (!process.env.GEMINI_API_KEY) { // 環境変数から直接確認
        Logger.info("テストスキップ: GEMINI_API_KEYが未設定です。");
        return;
    }
    Logger.info("GeminiApiService のテストを開始します...");
    let service;
    try {
        service = new GeminiApiService();
    } catch (e) {
        Logger.error("テスト用サービス初期化失敗:", e.message);
        return;
    }

    try {
        Logger.info("\n--- Flashモデルテスト (タイトル提案) ---");
        const titlePrompt = "AIと人間の協調に関するノンフィクション書籍のタイトルを3つ提案してください。";
        const titles = await service.generateBookContent(titlePrompt, 'title_suggestion');
        Logger.info("生成されたタイトル:", titles);

        Logger.info("\n--- Proモデルテスト (章の概要、JSON出力) ---");
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
        Logger.info("生成された章の概要 (JSON):", chapterOutline);
        if (typeof chapterOutline === 'object' && chapterOutline !== null) {
            Logger.info("パース成功。タイトル:", chapterOutline.chapter_title);
        } else {
            Logger.warn("章の概要がオブジェクトとして正しくパースされませんでした。");
        }

    } catch (error) {
        Logger.error("ApiServiceテスト中にエラーが発生しました:", error.message);
        Logger.debug("テストエラー詳細:", error);
    }
}

// このファイルが直接実行された場合のみテストを実行
if (import.meta.url === `file://${process.argv[1]}`) {
    // グローバルなAPP_CONFIGのダミー設定 (gemini-api-service.jsが直接config.jsonを読まないが、
    // APP_CONFIGを参照するコードが将来的に追加される可能性を考慮)
    global.APP_CONFIG = {
        apiService: { defaultTemperature: 0.7 }
    };
    testApiService();
}
