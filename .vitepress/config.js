import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Living Book Engine v2 - KDP自動化',
  description: 'AI技術を活用した1日1冊自動出版システム',
  
  // サイト設定
  lang: 'ja-JP',
  base: '/',
  
  // テーマ設定
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '生成書籍', link: '/generated-books/' },
      { text: '統計', link: '/stats/' },
      { text: 'ドキュメント', link: '/docs/' }
    ],
    
    sidebar: {
      '/generated-books/': 'auto',
      '/docs/': [
        {
          text: 'システム',
          items: [
            { text: '概要', link: '/docs/overview' },
            { text: 'AI執筆システム', link: '/docs/ai-writing' },
            { text: 'KDP変換', link: '/docs/kdp-conversion' },
            { text: '品質管理', link: '/docs/quality-control' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/boxi-rgb/living-book-engine-v2' }
    ],
    
    footer: {
      message: 'AI技術とコミュニティで革新する出版プラットフォーム',
      copyright: 'Copyright © 2025 Living Book Engine v2'
    }
  },
  
  // Markdown設定
  markdown: {
    lineNumbers: true,
    toc: { level: [1, 2, 3] }
  },
  
  // ビルド設定
  buildEnd: async (siteConfig) => {
    console.log('📚 VitePress ビルド完了 - KDP変換準備中...')
  },
  
  // Head設定
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['meta', { name: 'author', content: 'Living Book Engine v2' }],
    ['meta', { name: 'keywords', content: 'AI, KDP, 自動出版, VitePress, 書籍生成' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
  ]
})

// Last Updated: 2025-06-29 04:29:00 JST