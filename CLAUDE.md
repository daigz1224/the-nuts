# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"The Nuts" — 单人无限注德州扑克概率训练器。纯前端教学工具，非博彩应用。界面语言为中文 (zh-CN)。

- **游戏规格：** 6人桌 (6-max)，无限注德州扑克，1个玩家 + 5个AI对手
- **架构：** 纯前端，无后端/数据库/API，所有逻辑在浏览器运行
- **部署：** 静态托管（Vercel / GitHub Pages）
- **完整规格书：** `program.md`

## Commands

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建 (tsc -b && vite build)
npm run lint         # ESLint
npm test             # 运行所有测试 (vitest run)
npm run test:watch   # 测试 watch 模式
npx vitest run src/engine/__tests__/evaluator.test.ts  # 运行单个测试文件
```

## Tech Stack

- **Vite + React + TypeScript** (TS6, `ignoreDeprecations: "6.0"` for path aliases)
- **Tailwind CSS v4** — `@tailwindcss/vite` plugin, design tokens in `src/index.css` via `@theme`
- **Framer Motion** — installed, used in Phase 4
- **Zustand** — game state store
- **Vitest + @testing-library/react** — test runner

## Architecture

`src/engine/` is pure TypeScript with **zero React imports** — all game logic lives here, trivially testable and future Web Worker compatible. `src/store/` bridges engine to React via Zustand.

### Engine modules (`src/engine/`)
- **card.ts** — Card/Suit/Rank types, `createDeck()`, string notation (e.g. "As" = Ace of spades)
- **deck.ts** — Deck class with Fisher-Yates shuffle, deal, burn
- **hand-rank.ts** — HandCategory enum, score encoding (base-15 single number comparison)
- **evaluator.ts** — `evaluateFive()`, `bestOfSeven()` (7-choose-5), Chinese descriptions
- **positions.ts** — 6-max position rotation (BTN/SB/BB/UTG/MP/CO), pre-flop and post-flop action order
- **betting.ts** — ActionType, `getAvailableActions()`, `resolveActionAmount()`
- **game.ts** — GameState machine: `startNewHand()`, `handleAction()`, showdown resolution. All pure functions.
- **ai.ts** — Simple AI (Phase 1): 60% call, 25% raise, 15% fold

### Store (`src/store/`)
- **game-store.ts** — Zustand store wrapping engine. Handles async AI turns with 600ms delays.

### UI (`src/components/`)
- **layout/** — AppShell (main layout), Sidebar (placeholder), ControlPanel
- **table/** — PokerTable (oval with 6 seats), PlayerSeat, CommunityCards, Pot
- **cards/** — CardFace (CSS-rendered), CardBack
- **actions/** — ActionBar (弃牌/跟注/加注), BetSlider

### Key design decisions
- **Seat 0 = human player**, always at bottom of table
- **Single numeric hand score** — `a.score > b.score` determines winner, `===` means split pot
- **Path alias** — `@/` maps to `src/` (configured in both tsconfig.app.json and vite.config.ts)

## Implementation Status

- [x] **Phase 1**: Core logic + basic rendering (complete)
- [ ] **Phase 2**: Position-aware AI with 3 styles + side pots
- [ ] **Phase 3**: Monte Carlo engine + HUD + quiz system + hand history + localStorage
- [ ] **Phase 4**: Animations + glass effects + responsive layout + visual polish
