# 前端视觉风格

## 1. 设计主题

当前实现采用**深色赌场暖木风**，以琥珀/金色为主强调色，Hearthstone 风格的操作按钮配色。整体氛围偏向经典德州扑克厅，暖色调搭配深绿牌桌，视觉上舒适且沉浸。

---

## 2. 配色系统

### 2.1 CSS 自定义属性（`src/index.css` @theme）

**背景色：**
| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-bg-primary` | `#1A0E0A` | 页面主背景（深木色） |
| `--color-bg-secondary` | `#2C1810` | 侧边栏、面板 |
| `--color-bg-surface` | `#3D2317` | 中层表面 |
| `--color-bg-table` | `#1B5E20` | 牌桌毛毡（深绿） |
| `--color-bg-card` | `#4A2C1A` | 卡片背景 |

**文字色：**
| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-text-primary` | `#F5E6D0` | 主文字（暖羊皮纸色） |
| `--color-text-secondary` | `#BFA77A` | 次要文字（哑金） |
| `--color-text-accent` | `#FFD700` | 强调文字（亮金，主角名称等） |
| `--color-text-muted` | `#7A6248` | 弱化文字 |

**操作按钮色（Hearthstone 风格）：**
| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-action-fold` | `#8B2020` | 弃牌（暗红） |
| `--color-action-call` | `#1565C0` | 跟注（深蓝） |
| `--color-action-raise` | `#C8860A` | 加注（琥珀金） |
| `--color-action-check` | `#2E7D32` | 过牌（暗绿） |

**花色：**
| 花色 | 色值 |
|------|------|
| 黑桃 ♠ / 梅花 ♣ | `#1a1a2e`（深海军蓝） |
| 红心 ♥ / 方块 ♦ | `#D32F2F`（亮红） |

**边框与强调：**
| 变量 | 色值 | 用途 |
|------|------|------|
| `--color-border-default` | `#8B6914` | 默认边框（铜色） |
| `--color-border-active` | `#FFD700` | 激活边框（金色） |
| `--color-border-highlight` | `#FFA000` | 高亮边框（亮琥珀） |
| `--color-chip` | `#FFD700` | 筹码（金色） |
| `--color-pot` | `#FFB300` | 底池（琥珀金） |

### 2.2 Tailwind 扩展色

大量使用 Tailwind 内建色：
- **amber** 系列 (50~950)：核心强调色，按钮、边框、卡牌
- **emerald** (600, 700)：跟注按钮、正 EV 指示
- **red** (400~900)：弃牌、全下指示
- **yellow** (300~900)：摊牌赢家高亮
- **green** (400~900)：赢家、正 EV
- **stone** (300~700)：中性元素

---

## 3. 排版系统

### 3.1 字体栈

```css
--font-sans:  'Inter', 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif
--font-mono:  'JetBrains Mono', 'Roboto Mono', monospace
--font-title: Georgia, 'Noto Serif SC', 'PingFang SC', serif
```

- **无衬线** (`font-sans`)：界面文本、标签
- **等宽** (`font-mono`)：筹码数值、概率、位置徽章
- **衬线** (`font-title`)：标题 "The Nuts"

### 3.2 字号层级

| Tailwind 类 | 像素 | 用途 |
|-------------|------|------|
| `text-[8px]` | 8px | 对手位置徽章 |
| `text-[9px]` | 9px | Tier 标签 |
| `text-[10px]` | 10px | 位置徽章、状态文本 |
| `text-[11px]` | 11px | 紧凑标签、HUD 详情 |
| `text-xs` | 12px | 玩家名称、筹码量 |
| `text-sm` | 14px | 正文、常规标签 |
| `text-base` | 16px | 卡牌点数（中号） |
| `text-lg` | 18px | 卡牌花色、较大元素 |
| `text-3xl` | 30px | 主标题 |

### 3.3 字重

- `font-medium`：常规强调（玩家名称）
- `font-bold`：强强调（牌力值、操作按钮）
- `font-mono`：数据展示（筹码、金额）

---

## 4. 圆角 Token

```css
--radius-card:    6px    /* 卡牌、小 UI 元素 */
--radius-button:  8px    /* 按钮元素 */
--radius-surface: 10px   /* 较大容器、玩家座位 */
```

实际使用中还用到：
- `rounded-xl` (12px)：操作按钮、面板
- `rounded-2xl` (24px)：主角区域
- `rounded-full`：位置徽章、预设按钮

---

## 5. 布局系统

### 5.1 AppShell 结构

```
┌────────────────────────────────────────┐
│  TopHud (shrink-0, h-[28vh], max 200px) │
├──────────┬─────────────────────────────┤
│ Sidebar  │       PokerTable            │
│ (280px)  │  ┌─────────────────────┐    │
│ lg+ only │  │   OpponentRow ×5    │    │
│          │  │   CommunityCards    │    │
│          │  │       Pot           │    │
│          │  │     HeroArea        │    │
│          │  └─────────────────────┘    │
├──────────┴─────────────────────────────┤
│  MobileHud (lg:hidden)                  │
│  ShowdownResult (条件显示)               │
│  ControlPanel (shrink-0, safe-area)     │
└────────────────────────────────────────┘
```

**关键布局类：**
- 容器：`flex flex-col h-dvh`（全视口高度）
- 牌桌：`max-w-[600px]`（限制最大宽度）
- 侧边栏：`hidden lg:flex w-[280px]`（桌面端才显示）

### 5.2 响应式策略

**移动优先 (Mobile-First)：**
- 默认样式适配移动端 (< 640px)
- `sm:` (640px+) 增加桌面增强
- `lg:` (1024px+) 显示侧边栏，隐藏移动端 HUD

**间距递进：**
```
gap-1 → sm:gap-2 → sm:gap-3
px-2 → sm:px-4 → sm:px-8
py-1.5 → sm:py-2
```

**卡牌尺寸：**
| 场景 | size 属性 | 尺寸 |
|------|-----------|------|
| 对手牌 | `xs` | 28×40px |
| 主角牌 | `sm` | 40×56px |
| 公共牌 | `sm` | 40×56px |
| HUD outs | `xxs` | 更小 |

**iOS 安全区域：**
```css
paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))'
```

---

## 6. 组件视觉模式

### 6.1 Button 组件 — 5 种变体

| 变体 | 用途 | 配色特征 |
|------|------|----------|
| `fold` | 弃牌 | 暗红系 |
| `call` | 跟注 | 翡翠绿系 |
| `raise` | 加注 | 琥珀金系 |
| `allin` | 全下 | 红色系 |
| `neutral` | 通用 | 灰色系 |

**共享样式：** `rounded-xl px-3 sm:px-5 py-2.5 transition-all duration-150`
**交互反馈：** `active:scale-95`（按下缩放）、`hover:bg-*`（悬停变色）
**禁用状态：** `disabled:opacity-40 disabled:cursor-not-allowed`

### 6.2 CardFace 组件

- 背景：`amber-50`（奶油色）
- 边框：`border-2 border-amber-600`
- 阴影：`shadow-md shadow-amber-900/30`
- 点数：等宽粗体
- 花色：大号符号，按花色着色

### 6.3 CardBack 组件

- 渐变：`from-amber-800 to-amber-950`（木质感）
- 边框：`amber-600`

### 6.4 PlayerSeat 组件

- 位置徽章：`text-[10px] font-mono bg-bg-surface rounded`
- 紧凑布局：`gap-0.5 p-1` 或 `gap-1 p-2`

### 6.5 HUD 面板

- 胜率条：`h-1.5 bg-bg-card rounded-full`，动态填充色
  - >= 50%：绿色
  - >= 30%：黄色
  - < 30%：红色
- Tier 标签：`text-[9px] px-1.5 rounded-full`，5 种颜色（琥珀/蓝/绿/石/红）

---

## 7. 视觉状态

### 7.1 当前回合（Active Turn）

```css
ring-2 ring-amber-400
bg-amber-900/30
shadow-[0_0_12px_rgba(255,215,0,0.3)]  /* 金色光晕 */
```

### 7.2 赢家（Winner）

```css
border-yellow-500/60
bg-gradient-to-b from-yellow-900/25 to-yellow-950/10
shadow-[0_0_24px_rgba(255,215,0,0.3)]  /* 更大光晕 */
```

### 7.3 已弃牌（Folded）

```css
opacity-30                /* 玩家座位透明度降低 */
grayscale opacity-40      /* 主角卡牌灰度+透明 */
```

### 7.4 全下（All-In）

```css
text-action-raise font-bold  /* 琥珀金粗体文字 */
```

### 7.5 AI 思考中

```css
text-[10px] text-text-muted animate-pulse  /* 脉冲动画 */
```

---

## 8. 动效与过渡

### 8.1 当前状态

Framer Motion 已安装 (`framer-motion ^12.38.0`) 但**尚未在组件中使用**，留作 Phase 4 动画打磨。

当前动效全部基于 Tailwind CSS：

| 动效 | 类 | 用途 |
|------|-----|------|
| 脉冲 | `animate-pulse` | AI 思考中指示 |
| 颜色过渡 | `transition-colors` | 预设按钮悬停 |
| 通用过渡 | `transition-all duration-150` | 按钮状态变化 |
| 座位过渡 | `transition-all duration-200` | 玩家光晕变化 |
| 胜率条 | `transition-all duration-500` | 权益条填充动画 |
| 按压反馈 | `active:scale-95` | 按钮按下缩放 |

### 8.2 静态视觉效果

- 标题光影：`drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]`
- 当前玩家光晕：`shadow-[0_0_12px_rgba(255,215,0,0.3)]`
- 赢家光晕：`shadow-[0_0_24px_rgba(255,215,0,0.3)]`
- 卡牌深度阴影：`shadow-md shadow-amber-900/30`
- 移动端 HUD：`backdrop-blur-sm`

---

## 9. 后续迭代方向

以下为可基于实际体验灵活推进的优化点：

1. **Framer Motion 动画**：发牌、筹码移动、摊牌翻牌等关键交互引入流畅动效
2. **毛玻璃效果扩展**：将 `backdrop-blur` 从移动端 HUD 推广到更多面板与浮层
3. **牌桌视觉丰富**：毛毡纹理、筹码堆叠 3D 感、公共牌翻转动画
4. **响应式精调**：平板端专属布局优化、大屏幕宽桌面模式
5. **暗色主题变体**：提供冷色调/科技风备选主题供用户切换
