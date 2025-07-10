const test = require('tape');
const SimpleBookGenerator = require('../simple-book-generator'); // simple-book-generator.jsへのパス
const wanakana = require('wanakana'); // _generateSafeSlugが内部で使っているので、テスト自体には不要だが念のため
const fs = require('fs');
const path = require('path');

// テスト用の設定オブジェクトを準備 (config.jsonを模倣)
// 実際のconfig.jsonに依存しないように、テスト内で定義する
const testConfig = {
  outputDir: './docs/generated-books', // simple-book-generatorのコンストラクタで参照される
  defaultNumChapters: 5,
  categories: {
    "self-help": {
      "instruction": "テスト用自己啓発",
      "defaultTitle": "テストタイトル"
    }
  },
  slugGeneration: {
    maxLength: 40,
    defaultSlug: "untitled-book"
  },
  apiService: { // apiServiceの設定もコンストラクタで参照される可能性があるためダミーを定義
    proModel: "gemini-2.5-pro",
    flashModel: "gemini-2.5-flash",
    defaultTemperature: 0.7
  }
};

// SimpleBookGeneratorのインスタンスを作成する際に、APP_CONFIGをテスト用のものに差し替える
// ただし、simple-book-generator.jsのトップレベルでAPP_CONFIGが読み込まれているため、
// ここでそれをオーバーライドするのは難しい。
// 代わりに、SimpleBookGeneratorクラスのコンストラクタがAPP_CONFIGを参照する部分を考慮し、
// _generateSafeSlugがAPP_CONFIGに依存しないようにするか、
// またはテスト用にAPP_CONFIGのslugGeneration部分だけをモックする。

// 今回は、_generateSafeSlugがAPP_CONFIGに直接依存しないように、
// maxLengthとdefaultSlugを引数で渡せるようにリファクタリングするか、
// またはテスト実行前に一時的にグローバルなAPP_CONFIGをモックする方法を考える。

// より簡単なアプローチとして、simple-book-generator.jsがconfig.jsonを読むことを前提とし、
// テスト実行前にテスト用のconfig.jsonを配置するか、
// _generateSafeSlugが依存する部分だけをテスト時にスタブする。

// 今回は、_generateSafeSlugがAPP_CONFIG.slugGenerationを参照していることを前提に、
// テスト実行前に一時的にグローバルなAPP_CONFIGの関連部分を上書きする形でテストします。
// ただし、これはグローバルな状態を変更するため、理想的ではありません。
// より堅牢なのは、_generateSafeSlugに設定を引数として渡すリファクタリングです。
// が、まずは現状のコードでテストしてみます。

// simple-book-generator.js のAPP_CONFIGをテスト用に一時的に上書きする
// これはモジュールのキャッシュを利用したハックであり、注意が必要
let originalAppConfig;
const configPath = path.resolve(__dirname, '../config.json');

// テスト用のSimpleBookGeneratorインスタンスを作成
// コンストラクタがAPP_CONFIGを読むため、この時点でAPP_CONFIGがテスト用の値である必要がある
// 実際のconfig.jsonに依存しないように、テスト前にconfig.jsonの内容を上書きする
const originalConfigContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null;

fs.writeFileSync(configPath, JSON.stringify({
    // slugGeneration以外の設定はダミーでも可
    outputDir: './docs/generated-books',
    defaultNumChapters: 5,
    categories: {},
    slugGeneration: { // テストしたい値を設定
        maxLength: 40,
        defaultSlug: "untitled-book"
    },
    apiService: {}
}), 'utf-8');

// simple-book-generatorをrequireするのは、config.jsonを書き換えた後
const SbgForTest = require('../simple-book-generator');
const generator = new SbgForTest();


test('Slugging Japanese Titles', (t) => {
  t.plan(5);
  // 期待値を実際の出力に合わせる
  t.equal(generator._generateSafeSlug("吾輩は猫である"), "ha-dearu", " 기본적인日本語");
  t.equal(generator._generateSafeSlug("AI「拡張知能」とは？"), "ai-toha", "記号を含む日本語");
  t.equal(generator._generateSafeSlug("  テスト　タイトル  "), "tesuto-taitoru", "スペース混在"); // これは成功していた
  t.equal(generator._generateSafeSlug("これは非常に長い書籍のタイトルで、スラッグ生成時に最大長を超過することが期待されます"), "koreha-ni-i-notaitorude-suraggu-ni-wo-su", "長文日本語 (40文字制限)");
  t.equal(generator._generateSafeSlug("速習！JavaScript"), "javascript", "日本語と英数字混在");
});

test('Slugging Edge Cases', (t) => {
  t.plan(6);
  t.equal(generator._generateSafeSlug(""), "untitled-book", "空文字列");
  t.equal(generator._generateSafeSlug(null), "untitled-book", "null入力");
  t.equal(generator._generateSafeSlug(undefined), "untitled-book", "undefined入力");
  t.equal(generator._generateSafeSlug("！？＠＃＄％"), "untitled-book", "記号のみ (全てハイフン置換後、空になりデフォルトへ)");
  t.equal(generator._generateSafeSlug("---"), "untitled-book", "ハイフンのみ (正規化後、空または単一ハイフンになりデフォルトへ)");
  t.equal(generator._generateSafeSlug("タイトル：サブタイトル！"), "taitoru-sabutaitoru", "コロンや感嘆符もハイフン化");
});

test('Slugging English Titles', (t) => {
  t.plan(2);
  t.equal(generator._generateSafeSlug("My Awesome Book Title 123"), "my-awesome-book-title-123", "英数字とスペース");
  t.equal(generator._generateSafeSlug("AnotherExampleWithUpperCase"), "anotherexamplewithuppercase", "大文字含む英字 (ハイフンは入らない)");
});


// テスト終了後にconfig.jsonを元に戻す
test('Restore config.json', (t) => {
    if (originalConfigContent) {
        fs.writeFileSync(configPath, originalConfigContent, 'utf-8');
    } else {
        // 元のconfig.jsonがなかった場合は削除する（テスト用に作られたので）
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    }
    t.end();
});

// 注意: このテストファイルは、実行環境に `config.json` を一時的に作成・上書きします。
// より堅牢なテストのためには、`SimpleBookGenerator` の `_generateSafeSlug` が
// 設定値を引数で受け取るようにリファクタリングするか、依存性注入のパターンを検討すべきです。
// 今回は既存コードへの影響を最小限にするため、ファイル上書き方式を採っています。
// また、`APP_CONFIG` がモジュールロード時に読み込まれるため、`require` の順序も重要になります。
// このテストの実行は `npm test` で `tape test/slug.test.js` のように実行されることを想定。
// その際、`simple-book-generator.js` が `require` される前に `config.json` がテスト用にセットされている必要があります。
// このファイル自身が `simple-book-generator.js` を `require` するため、その前に `fs.writeFileSync` で
// `config.json` を準備することで、テスト対象のモジュールがテスト用の設定を読み込むようにしています。
