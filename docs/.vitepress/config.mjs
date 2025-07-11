import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Living Book Engine v2",
  description: "AI-Powered Publishing Platform",
  cleanUrls: true,
  ignoreDeadLinks: true,
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Books', link: '/generated-books/' }
    ],
    
    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Overview', link: '/README' },
          { text: 'API', link: '/api/' }
        ]
      }
    ],
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/boxi-rgb/living-book-engine-v2' }
    ]
  }
})