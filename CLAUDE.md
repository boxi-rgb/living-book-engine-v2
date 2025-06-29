# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Living Book Engine v2 - A Community-Driven, Zero-Cost, Self-Evolving Publishing Engine built on VitePress. This platform enables collaborative book creation where readers can directly contribute and improve content through GitHub's collaboration tools.

## Architecture
- **Platform**: VitePress-based documentation/publishing system
- **Language**: JavaScript (100% of codebase)
- **Structure**: `.github/`, `.vitepress/`, `docs/` directories
- **Package Management**: npm
- **Content Format**: Markdown with VitePress extensions
- **Collaboration**: GitHub-based workflow

## Common Development Commands

### Setup and Installation
```bash
# Clone the repository
git clone https://github.com/boxi-rgb/living-book-engine-v2.git

# Install dependencies
npm install
```

### Development Workflow
```bash
# Start development server with hot reload
npm run dev

# Build static files for production
npm run build
```

### Content Management
- All content is written in Markdown format
- Files follow `.markdownlint.jsonc` linting rules
- VitePress configuration handles rendering and structure

## Key Configuration Files
- `package.json`: Project dependencies and npm scripts
- `.vitepress/`: VitePress-specific configuration
- `.markdownlint.jsonc`: Markdown linting and style rules
- `.gitignore`: Version control exclusions
- `.claude/settings.local.json`: Claude Code permissions (allows WebFetch for github.com)

## Content Contribution Workflow
1. Content is managed through GitHub collaboration
2. Markdown files in `docs/` directory
3. Community-driven editing and improvement process
4. Self-evolving content through collaborative contributions

## Development Notes
- No explicit testing framework currently configured
- Focus on collaborative content creation rather than traditional software testing
- VitePress handles build optimization and static site generation

# Last Updated: 2025-06-29 04:20:00 JST