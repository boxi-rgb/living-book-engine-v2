const test = require('tape');
const path =require('path');
const fs = require('fs');

// テスト対象のモジュールをロードする前に、環境変数とconfig.jsonを準備
process.env.GEMINI_API_KEY = 'test_api_key'; // ダミーAPIキー

const configPath = path.resolve(__dirname, '../config.json');
const originalConfigContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null;

// テスト用のconfig.json内容
const testServiceConfig = {
    outputDir: './docs/generated-books',
    defaultNumChapters: 5,
    categories: {},
    slugGeneration: {
        maxLength: 40,
        defaultSlug: "untitled-book"
    },
    apiService: { // GeminiApiServiceのコンストラクタでは直接参照しないが、整合性のため
      proModel: "gemini-2.5-pro",
      flashModel: "gemini-2.5-flash",
      defaultTemperature: 0.7
    }
};
fs.writeFileSync(configPath, JSON.stringify(testServiceConfig), 'utf-8');

// モジュールをロード
const GeminiApiService = require('../gemini-api-service');


test('GeminiApiService Constructor', (t) => {
    t.plan(2);

    // APIキーが設定されている場合
    try {
        const service = new GeminiApiService();
        t.ok(service, 'コンストラクタはAPIキーがあればインスタンスを生成する');
    } catch (e) {
        t.fail('APIキーがあるにも関わらずコンストラクタがエラーをスローした');
    }

    // APIキーが設定されていない場合
    delete process.env.GEMINI_API_KEY;
    try {
        new GeminiApiService();
        t.fail('コンストラクタはAPIキーがない場合エラーをスローすべき');
    } catch (e) {
        t.pass('コンストラクタはAPIキーがない場合正しくエラーをスローする');
    }
    process.env.GEMINI_API_KEY = 'test_api_key'; // 他のテストのために戻す
});

test('GeminiApiService model selection and config', async (t) => {
    const service = new GeminiApiService();

    // スパイ/モックの準備
    let calledModelName = '';
    let calledGenerationConfig = null;
    let calledSafetySettings = null;

    const mockGenerateContent = async (payload) => {
        // どのモデルのgenerateContentが呼ばれたかを判別するために、
        // 実際のモデル名ではなく、呼び出し元で設定した情報から取得する。
        // ここでは、テストケース側で modelToUse.modelName をスパイに記録する想定だったが、
        // それは難しいので、taskTypeから推測されるモデルが使われたか、
        // またはペイロード自体にモデル情報が含まれていればそれを見る。
        // 今回は、テストケースごとに service.geminiPro/Flash.generateContent を直接モックする。
        calledGenerationConfig = payload.generationConfig;
        calledSafetySettings = payload.safetySettings;

        // ダミーレスポンス (テスト内容に応じて調整)
        if (payload.generationConfig.responseMimeType === 'application/json') {
            return { response: { text: () => JSON.stringify({ message: "mocked json response" }) } };
        }
        return { response: { text: () => "mocked text response" } };
    };

    // --- テストケース1: Flashモデル選択 ---
    t.comment('--- Flashモデル選択テスト ---');
    service.geminiFlash.generateContent = async (payload) => { // Flashモデルのメソッドをモック
        calledModelName = 'gemini-2.5-flash'; // 仮にモデル名を記録
        return mockGenerateContent(payload);
    };
    service.geminiPro.generateContent = async (p) => { t.fail('Proモデルが呼ばれるべきではない'); return mockGenerateContent(p); };


    await service.generateBookContent("test prompt", "title_suggestion", { temperature: 0.1 });
    t.equal(calledModelName, 'gemini-2.5-flash', 'Flashモデルが選択されるべき (title_suggestion)');
    t.equal(calledGenerationConfig.temperature, 0.1, '指定したtemperatureがconfigに反映されるべき');
    t.ok(calledSafetySettings, 'SafetySettingsが渡されるべき');
    t.notOk(calledGenerationConfig.responseSchema, 'JSON関連のconfigは渡されていないはず (title_suggestion)');


    // --- テストケース2: Proモデル選択 ---
    t.comment('--- Proモデル選択テスト ---');
    service.geminiPro.generateContent = async (payload) => { // Proモデルのメソッドをモック
        calledModelName = 'gemini-2.5-pro';
        return mockGenerateContent(payload);
    };
    service.geminiFlash.generateContent = async (p) => { t.fail('Flashモデルが呼ばれるべきではない'); return mockGenerateContent(p);};

    await service.generateBookContent("test prompt", "chapter_writing", { maxOutputTokens: 100 });
    t.equal(calledModelName, 'gemini-2.5-pro', 'Proモデルが選択されるべき (chapter_writing)');
    t.equal(calledGenerationConfig.maxOutputTokens, 100, '指定したmaxOutputTokensがconfigに反映されるべき');
    t.equal(calledGenerationConfig.temperature, 0.8, 'chapter_writingのデフォルトtemperature (0.8) が設定されるべき'); // これはservice内のデフォルト値


    // --- テストケース3: JSONスキーマチェック ---
    t.comment('--- JSONスキーマチェックテスト ---');
    service.geminiPro.generateContent = async (payload) => { // 再度Proモデルをモック
        calledModelName = 'gemini-2.5-pro';
        return mockGenerateContent(payload);
    };

    try {
        await service.generateBookContent("test prompt", "plot_development", { responseMimeType: "application/json" /* schemaなし */ });
        t.fail('JSON出力要求時にresponseSchemaがない場合エラーをスローすべき');
    } catch (e) {
        t.ok(e.message.includes("responseSchemaの指定が必要"), 'JSON出力要求時にresponseSchemaがない場合、適切なエラーメッセージ');
    }

    const dummySchema = { type: "OBJECT", properties: { message: {"type": "STRING"} } };
    try {
        await service.generateBookContent("test prompt", "plot_development", { responseMimeType: "application/json", responseSchema: dummySchema });
        t.pass('JSON出力要求時にresponseSchemaがあればエラーをスローしない');
        t.ok(calledGenerationConfig.responseSchema, 'responseSchemaがconfigに渡されるべき');
    } catch (e) {
        t.fail('JSON出力要求時にresponseSchemaがあってもエラーになった: ' + e.message);
    }

    t.end();
});


// テスト終了後にconfig.jsonを元に戻す
test('Restore config.json after service tests', (t) => {
    if (originalConfigContent) {
        fs.writeFileSync(configPath, originalConfigContent, 'utf-8');
    } else {
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    }
    t.end();
});
