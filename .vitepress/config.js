import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Living AI Books",
  description: "A Community-Driven Publishing Engine.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Strategy', link: './KDP_BlueOcean_Strategy' }
    ],

    sidebar: [
      {
        text: 'Blue Ocean Strategy',
        items: [
          { text: 'The Core Idea', link: './KDP_BlueOcean_Strategy' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' } // TODO: Replace with actual repo link
    ]
  }
})
