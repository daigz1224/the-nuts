# 整体架构设计

## 1. 项目概述

**The Nuts** 是一款单人无限注德州扑克概率训练器，纯前端教学工具。

| 项目 | 说明 |
|------|------|
| 游戏规格 | 6 人桌 (6-max)，1 玩家 + 5 AI 对手 |
| 技术栈 | Vite + React 19 + TypeScript 6 + Tailwind CSS v4 + Zustand + Framer Motion |
| 测试 | Vitest + @testing-library/react |
| 部署 | 静态托管（Vercel / GitHub Pages），无后端/数据库/API |
| 界面语言 | 中文 (zh-CN) |

---

## 2. 分层架构

项目采用三层分离架构，核心原则：**Engine 层零 React 依赖**，保证可测试性与未来 Web Worker 兼容。

```
┌─────────────────────────────────────────────┐
│                 Components                   │
│  layout / table / cards / actions / hud      │
│           (React + Tailwind CSS)             │
├─────────────────────────────────────────────┤
│                   Store                      │
│        Zustand game-store.ts                 │
│   (桥接 Engine ↔ React，管理异步 AI 轮次)     │
├─────────────────────────────────────────────┤
│                  Engine                      │
│  纯 TypeScript，零 React 导入                 │
│  card / deck / evaluator / game / ai / …     │
│  (所有游戏逻辑、概率计算、AI 决策)              │
└─────────────────────────────────────────────┘
```

**数据流向：**

```
用户操作 → ActionBar 组件
  → store.playerAct(action, amount)
    → engine.handleAction(state, …)  // 纯函数，返回新 state
    → store 更新 gameState
    → store.processAITurns()          // 异步循环，600ms/步
      → engine.getAIDecision(…)
      → engine.handleAction(…)
      → … 直到轮到玩家或牌局结束
  → React 重渲染
```

---

## 3. Engine 模块清单

Engine 位于 `src/engine/`，共 16 个文件（含测试），约 2,084 行代码。

### 3.1 基础数据层

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **card** | `card.ts` | 92 | Card/Suit/Rank 类型定义，`createDeck()`，字符串记法（如 `"As"` = 黑桃A） |
| **deck** | `deck.ts` | 54 | Deck 类，Fisher-Yates 洗牌，发牌/烧牌，内部索引指针 |
| **shuffle** | `shuffle.ts` | 9 | 通用 Fisher-Yates 数组洗牌工具函数 |

### 3.2 手牌评估层

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **hand-rank** | `hand-rank.ts` | 54 | HandCategory 枚举（HighCard=0 … RoyalFlush=9），`encodeScore()` 15 进制编码 |
| **evaluator** | `evaluator.ts` | 218 | `evaluateFive()` 5 张评估，`bestOfSeven()` 7 选 5（C(7,5)=21 组合），中文牌型描述 |

### 3.3 规则层

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **positions** | `positions.ts` | 109 | 6-max 位置系统（BTN/SB/BB/UTG/MP/CO），翻前/翻后行动顺序 |
| **betting** | `betting.ts` | 121 | ActionType 枚举，`getAvailableActions()`，`resolveActionAmount()` |

### 3.4 核心状态机

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **game** | `game.ts` | 467 | GameState 状态机：`startNewHand()`、`handleAction()`、摊牌结算，全纯函数 |

### 3.5 AI 决策层

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **ai** | `ai.ts` | 406 | 5 种 AI 人格，翻前/翻后决策逻辑，位置修正，下注量计算 |

### 3.6 训练工具层

| 模块 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **hand-strength** | `hand-strength.ts` | 150 | 起手牌 5 级分层（超强牌→弱牌），位置建议 |
| **equity** | `equity.ts` | 108 | Monte Carlo 权益计算（默认 3000 次模拟） |
| **outs** | `outs.ts` | 131 | Outs 检测，听牌类型识别（同花/两头顺/卡顺） |
| **pot-odds** | `pot-odds.ts` | 47 | 底池赔率、所需胜率、EV 计算 |

---

## 4. Store 层

### `src/store/game-store.ts`（101 行）

Zustand store 桥接 Engine 与 React：

```typescript
interface GameStore {
  gameState: GameState        // 完整游戏状态
  isProcessingAI: boolean     // AI 轮次进行中标记
  startNewHand: () => void    // 开始新一手
  playerAct: (action, amount?) => void  // 玩家操作
  processAITurns: () => Promise<void>   // 异步 AI 循环
}
```

**AI 轮次处理机制：**
- `playerAct()` → 更新 state → 触发 `processAITurns()`
- `processAITurns()` 异步循环：每步 600ms 延迟 → `getAIDecision()` → `handleAction()` → 直到轮到人类或牌局结束
- `isProcessingAI` 标记防止人类在 AI 思考时操作

---

## 5. Components 层

组件位于 `src/components/`，约 1,289 行，按功能分 6 个子目录。

### 5.1 目录结构

```
src/components/
├── layout/          # 顶层布局
│   ├── AppShell.tsx      # 主容器，组合所有区域
│   ├── ControlPanel.tsx  # 底部操作区
│   └── Sidebar.tsx       # 桌面端侧边栏（lg+ 可见）
├── table/           # 牌桌可视化
│   ├── PokerTable.tsx    # 牌桌容器
│   ├── PlayerSeat.tsx    # 玩家座位
│   ├── HeroArea.tsx      # 主角（人类玩家）区域
│   ├── OpponentRow.tsx   # 对手行
│   ├── CommunityCards.tsx # 公共牌
│   ├── Pot.tsx           # 底池显示
│   └── ShowdownResult.tsx # 摊牌结果
├── cards/           # 扑克牌渲染
│   ├── CardFace.tsx      # 牌面（CSS 渲染）
│   └── CardBack.tsx      # 牌背
├── actions/         # 操作控件
│   ├── ActionBar.tsx     # 弃牌/跟注/加注按钮
│   └── BetSlider.tsx     # 下注滑块
├── hud/             # 数据面板
│   ├── TopHud.tsx        # 顶部信息栏
│   ├── HudPanel.tsx      # 分析面板（胜率/Outs/赔率）
│   └── MobileHud.tsx     # 移动端 HUD
└── common/          # 通用组件
    ├── Button.tsx        # 通用按钮（5 种变体）
    └── ChipStack.tsx     # 筹码显示
```

### 5.2 入口链路

```
main.tsx → App.tsx → AppShell.tsx
  ├── TopHud          (顶部：阶段、当前行动玩家)
  ├── Sidebar         (桌面端：分析面板)
  ├── PokerTable      (中央：牌桌)
  │   ├── OpponentRow → PlayerSeat × 5
  │   ├── CommunityCards + Pot
  │   └── HeroArea
  ├── MobileHud       (移动端：折叠分析面板)
  ├── ShowdownResult   (摊牌时显示)
  └── ControlPanel → ActionBar + BetSlider
```

---

## 6. 关键设计决策

### 6.1 纯函数 Engine
所有 Engine 函数为纯函数（输入 state → 输出新 state），无副作用。好处：
- 可单元测试，无需 mock
- 未来可迁移至 Web Worker 实现非阻塞计算
- 状态可序列化，便于手牌回放

### 6.2 单数值评分系统
手牌评分采用 15 进制单一数值编码：
```
score = category × 15⁵ + k₁×15⁴ + k₂×15³ + k₃×15² + k₄×15 + k₅
```
直接 `a.score > b.score` 比大小，`===` 为平局。无需复杂的多字段比较。

### 6.3 Seat 0 = 人类玩家
座位 0 始终为人类玩家，固定在桌面底部。简化 UI 布局逻辑。

### 6.4 不可变状态更新
所有 state 更新使用对象展开与 Map 拷贝，配合 Zustand 实现可预测的 React 重渲染。

### 6.5 中文本地化
所有牌型名称、位置名称、HUD 术语均为中文，如：
- 牌型：皇家同花顺、葫芦、顺子、两对
- 位置：枪口 (UTG)、关位 (CO)、庄位 (BTN)
- 分析：同花听牌、两头顺听牌、底池赔率

---

## 7. 实现进度

| 阶段 | 状态 | 内容 |
|------|------|------|
| **Phase 1** | 已完成 | 核心逻辑 + 基础渲染 + 位置感知 AI + 概率工具 |
| **Phase 2** | 待开发 | 边池系统 |
| **Phase 3** | 待开发 | Monte Carlo 引擎优化 + HUD 增强 + 答题系统 + 手牌历史 + localStorage |
| **Phase 4** | 待开发 | 动画 + 毛玻璃效果 + 响应式优化 + 视觉打磨 |
