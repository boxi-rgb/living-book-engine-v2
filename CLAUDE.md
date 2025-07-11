# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Living Book Engine v2 is an AI-powered revolutionary book generation and publishing automation platform. The system generates disruptive, high-quality books that challenge industry conventions and automatically converts them for Kindle Direct Publishing (KDP).

## Core Architecture

### Revolutionary Generation System
- **Main Engine**: `revolutionary-content-engine.js` - Core revolutionary content generation
- **Quick Test**: `quick-revolutionary-test.js` - Rapid testing and validation
- **Full Generator**: `revolutionary-book-generator.js` - Complete book generation
- **AI Service**: `gemini-api-service.js` - Google Gemini API integration with model selection

### Key Design Principles
- **Industry Disruption**: Challenges conventional wisdom in target categories
- **Quality Over Quantity**: 90+ point revolutionary standards
- **AI Detection Avoidance**: Human-like writing depth and authenticity
- **Cognitive Dissonance Generation**: Reader worldview transformation

## Essential Development Commands

### Quick Revolutionary Testing (Recommended Start)
```bash
# Quick test with single chapter generation
npm run quick-revolution

# Test specific category
npm run quick-revolution self-help
```

### Full Revolutionary Generation
```bash
# Complete revolutionary book generation
npm run revolution

# Industry-specific destruction modes
npm run destroy-selfhelp    # Self-help industry complete destruction
npm run destroy-business    # Business industry complete destruction
npm run destroy-tech        # Technology industry complete destruction
```

### Traditional Generation (Legacy)
```bash
# Basic book generation
npm run generate-daily-book

# Full automation pipeline
npm run full-automation     # Generate + Convert to KDP
```

### Quality Control
```bash
# Code quality gates
npm run lint               # ESLint check and fix
npm run format             # Prettier formatting
npm run quality-gate       # Complete quality validation
```

### Development Server
```bash
# VitePress development server
npm run dev
npm run build
npm run preview
```

## Configuration & Customization

### Required Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
```

### Key Configuration Files
- `config.json` - Categories, AI models, output paths, quality thresholds
- `package.json` - npm scripts and dependencies
- `.env` - Environment variables (not committed)

### Category Configuration Pattern
Each category in `config.json` includes:
- Specific generation instructions
- Quality thresholds
- Revolutionary targets
- Industry-specific destruction parameters

## AI Service Integration

### Model Selection Strategy
- **gemini-2.5-flash**: Quick tasks (titles, summaries, keywords)
- **gemini-2.5-pro**: Complex tasks (chapters, plots, code generation)
- **Automatic Selection**: Based on task type parameter

### Task Types
```javascript
'title_suggestion'    // Uses Flash model, temp 0.5
'chapter_writing'     // Uses Pro model, temp 0.8
'plot_development'    // Uses Pro model, temp 0.8
'short_summary'       // Uses Flash model, temp 0.5
```

## Revolutionary Quality Standards

### Five-Dimensional Scoring System
- **Paradigm Destruction Score**: 90/100 (industry convention breaking)
- **Cognitive Dissonance Index**: 85/100 (reader discomfort generation)
- **Industry Differentiation**: 95/100 (uniqueness from competitors)
- **Truth Excavation Depth**: 92/100 (surface-level insight avoidance)
- **Transformational Catalyst**: 88/100 (reader worldview change)

### Content Validation
- Minimum 8000 characters per chapter
- No template variable remnants (`{variable_name}`)
- No mechanical AI phrases (`について考えてみましょう`)
- Industry expert backlash potential assessment

## Output Structure

### Generated Books Location
```
docs/generated-books/         # Traditional generation
docs/revolutionary-books/     # Revolutionary generation
```

### File Organization
```
category-title-date/
├── index.md                 # Book homepage with metadata
├── chapter-1.md             # Individual chapters
├── chapter-2.md
└── quality-report.json      # Quality assessment data
```

## Development Workflow

### Adding New Categories
1. Update `config.json` categories section
2. Define category-specific revolutionary targets
3. Test with `npm run quick-revolution category-name`
4. Validate quality scores meet standards

### Debugging Generation Issues
1. Check `GEMINI_API_KEY` environment variable
2. Run `npm run quick-revolution` for isolated testing
3. Review logger output for API errors
4. Verify category exists in `config.json`

### Quality Improvement
1. Analyze generated `quality-report.json` files
2. Adjust revolutionary standards in content engine
3. Modify category-specific prompts
4. Test with different temperature settings

## Error Recovery System

### Built-in Fallbacks
- **API Failures**: Automatic retry with exponential backoff
- **Generation Errors**: Emergency simplified generation mode
- **Quality Issues**: Automatic re-generation with adjusted parameters
- **Network Issues**: Graceful degradation to basic generation

## Legacy System Status

### Removed Components (Destroyed for Quality)
- `title-psychology-engine.js` - Deleted (template pollution)
- `differentiated-content-engine.js` - Deleted (mechanical output)
- `human-style-engine.js` - Deleted (artificial emotion injection)
- `satisfaction-guarantee-system.js` - Deleted (false quality claims)

### Migration Notes
If encountering references to removed files, use the revolutionary system instead:
- Use `quick-revolutionary-test.js` for testing
- Use `revolutionary-book-generator.js` for production
- All quality assurance now handled by revolutionary engine

## Technical Stack
- **Runtime**: Node.js 18+ with ES modules
- **AI Provider**: Google Gemini API (2.5-pro/flash)
- **Documentation**: VitePress
- **Format Conversion**: Python KDP pipeline
- **Languages**: JavaScript (primary), Python (conversion)

## Important Notes
- Always test with `npm run quick-revolution` before full generation
- Monitor quality scores - below 75 indicates system issues
- Revolutionary content may generate industry expert criticism (this is intentional)
- All content is designed to challenge conventional publishing wisdom

Last Updated: 2025-07-11 (Post-Revolution Implementation)