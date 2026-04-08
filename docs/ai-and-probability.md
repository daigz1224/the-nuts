# AI 策略与概率分析模块

## 1. AI 人格系统

每手牌开始时，5 个 AI 对手会随机分配人格，模拟真实牌桌的风格多样性。

### 1.1 五种人格档案

| 人格 | 风格 | VPIP | PFR | 激进度 | 诈唬频率 | 面注弃牌率 |
|------|------|------|-----|--------|----------|-----------|
| **Rock** (岩石) | 紧-被动 | 0.16 | 0.55 | 0.35 | 0.05 | 0.65 |
| **TAG** (紧凶) | 紧-激进 | 0.23 | 0.70 | 0.60 | 0.15 | 0.55 |
| **LAG** (松凶) | 松-激进 | 0.30 | 0.65 | 0.55 | 0.20 | 0.40 |
| **CallingStation** (跟注站) | 松-被动 | 0.42 | 0.12 | 0.15 | 0.05 | 0.12 |
| **Maniac** (疯狂型) | 超松-激进 | 0.52 | 0.55 | 0.75 | 0.35 | 0.15 |

**参数说明：**
- **VPIP** (Voluntarily Put $ In Pot)：自愿入池率，越高越松
- **PFR** (Pre-Flop Raise)：翻前加注率
- **激进度** (aggression)：下注/加注的倾向，影响翻后行为
- **诈唬频率** (bluffFreq)：弱牌时诈唬下注的概率
- **面注弃牌率** (foldToBet)：面对下注时的弃牌基础概率

---

## 2. 手牌力评估

### 2.1 翻前评估 — `evaluatePreFlopStrength()`

返回 0~1 的手牌力分数。

**口袋对子：**
```
strength = 0.50 + ((rank - 2) / 12) × 0.50
```
- 22 → 0.50，AA → 1.00

**非对子：**
```
base = (highRank + lowRank - 4) / 24 × 0.70
```
- 加成：同花 +0.06，连张 +0.04，隔一张 +0.02
- 惩罚：大间隔 -0.05

**示例值：** AKs ≈ 0.85，AKo ≈ 0.79，22 = 0.50，72o ≈ 0.10

### 2.2 翻后评估 — `evaluatePostFlopStrength()`

基于最佳 5 张牌型，返回 0~1 分数。

| 牌型 | 基础分 |
|------|--------|
| 高牌 (HighCard) | 0.10 |
| 一对 (OnePair) | 0.30 |
| 两对 (TwoPair) | 0.52 |
| 三条 (ThreeOfAKind) | 0.65 |
| 顺子 (Straight) | 0.78 |
| 同花 (Flush) | 0.84 |
| 葫芦 (FullHouse) | 0.90 |
| 四条 (FourOfAKind) | 0.96 |
| 同花顺 (StraightFlush) | 0.98 |
| 皇家同花顺 (RoyalFlush) | 1.00 |

**微调修正：**
- 一对为公共牌对子（非手牌配对）：-0.10
- 超对（口袋对子 > 所有公共牌）：+0.08
- 顶对（手牌配中最大公共牌）：+0.05
- A 高牌：+0.04，K 高牌：+0.02

### 2.3 听牌检测 — `detectDraws()`

在翻牌和转牌阶段检测：

| 听牌类型 | 条件 | 加成 |
|----------|------|------|
| **同花听牌** (Flush Draw) | 4 张同花色且手牌参与 | +0.18 |
| **顺子听牌** (Straight Draw) | 4 张连续且手牌参与 | +0.12 |

**有效牌力 = 手牌力 + 听牌加成**（上限 1.0）

---

## 3. 位置修正系数

位置影响 VPIP 阈值，越靠后位置越松。

| 位置 | 修正系数 | 说明 |
|------|----------|------|
| UTG (枪口) | 0.60 | 最紧，只玩强牌 |
| MP (中位) | 0.75 | 较紧 |
| BB (大盲) | 1.00 | 基准 |
| SB (小盲) | 0.85 | 已投入半注，适度放松 |
| CO (关位) | 1.10 | 后位优势，适度放松 |
| BTN (庄位) | 1.30 | 最佳位置，最松 |

**应用方式：** `入池阈值 = 1 - (VPIP × 位置修正)`

---

## 4. 决策流程

### 4.1 翻前决策 — `preFlopDecision()`

```
1. 计算手牌力 strength (0~1)
2. 入池阈值 threshold = 1 - (vpip × posMod)
3. 面注压力修正 = +0.15 × max(0, callAmount / (BB×3) - 1)
4. 随机噪声 ±0.05

if strength > threshold:
    if random < pfr → 加注（计算下注量）
    else → 跟注/过牌
else:
    → 弃牌（或可过牌时过牌）
```

### 4.2 翻后决策 — `postFlopDecision()`

**可过牌时（无人下注）：**
```
strength > 0.65 → 价值下注 (prob = aggression)
strength > 0.40 → 偶尔下注 (prob = aggression × 0.3)
strength < 0.40 → 诈唬   (prob = bluffFreq)
默认 → 过牌
```

**面对下注时：**
```
strength > 0.55:
    random < aggression → 加注
    else → 跟注
else:
    foldProb = foldToBet × (1 - strength) × (0.5 + betPressure)
    random < foldProb → 弃牌
    random < bluffFreq × 0.3 → 诈唬加注
    默认 → 跟注（跟注站行为）
```

### 4.3 下注量计算 — `computeBetSize()`

**翻前：**
| 人格特征 | BB 倍数范围 |
|----------|-------------|
| Maniac | 3.5x ~ 5.0x |
| 高激进度 (>0.5) | 2.5x ~ 3.5x |
| 其他 | 2.5x ~ 3.0x |

**翻后（底池百分比）：**
| 人格特征 | 底池比例范围 |
|----------|-------------|
| Maniac | 65% ~ 100% |
| 高激进度 (>0.5) | 45% ~ 70% |
| 其他 | 33% ~ 50% |

### 4.4 短筹码处理

当玩家筹码不足以完成常规操作时：
- 无法跟注/过牌/下注/加注 → 基于手牌力决定弃牌或全下
- 全下阈值：strength > 0.3 时全下，否则弃牌

---

## 5. 概率分析工具

### 5.1 Monte Carlo 权益计算 — `equity.ts`

```typescript
calculateEquity(
  holeCards: [Card, Card],
  communityCards: Card[],
  numOpponents: number,
  simulations: number = 3000
): EquityResult
```

**算法流程：**
1. 构建剩余牌堆（排除已知牌）
2. 每次模拟：
   - 部分 Fisher-Yates 洗牌（仅打乱所需位置）
   - 随机补全公共牌至 5 张
   - 随机发对手手牌
   - 评估所有人最佳 5 张
   - 记录胜/平/负
3. 计算有效权益：`winRate + tieShare`
   - 平局按人数均分：`tieShare = 1 / 平局人数`

**返回结果：**
```typescript
{
  winRate: number      // 胜率
  tieRate: number      // 平局率
  lossRate: number     // 负率
  equity: number       // 有效权益（胜率 + 平局分摊）
  sampleSize: number   // 模拟次数
}
```

### 5.2 Outs 计算 — `outs.ts`

```typescript
calculateOuts(holeCards: [Card, Card], communityCards: Card[]): OutsResult
```

仅在翻牌（3 张公共牌）或转牌（4 张公共牌）时有效。

**算法：**
1. 评估当前手牌分数
2. 遍历剩余 46 张牌，逐张加入评估
3. 若新分数 > 当前分数，计为一个 out

**听牌类型检测：**
| 类型 | 中文 | 说明 |
|------|------|------|
| Flush Draw | 同花听牌 | 4 张同花色，差 1 张成同花 |
| Open-ended Straight | 两头顺听牌 | 4 张连续，两端可接 |
| Gutshot | 卡顺听牌 | 4 张中间缺 1 张 |
| No Draw | 无听牌 | 无明显听牌 |

**改善概率：** `improveProb = outsCount / remainingCards`

### 5.3 底池赔率与 EV — `pot-odds.ts`

```typescript
calculatePotOdds(pot: number, callAmount: number, equity: number): PotOddsResult
```

**核心公式：**
```
底池赔率 = callAmount / (pot + callAmount)
所需胜率 = 底池赔率（盈亏平衡点）
EV = equity × pot - (1 - equity) × callAmount
+EV 条件：equity >= 所需胜率
```

**输出示例：**
- `"+EV（+125）：权益 55.0% > 所需 45.0%"`
- `"-EV（-50）：权益 30.0% < 所需 45.0%"`

### 5.4 起手牌分层 — `hand-strength.ts`

```typescript
evaluatePreFlopStrength(holeCards: [Card, Card], position: Position): HandStrengthResult
```

**五级分层系统：**

| Tier | 中文标签 | 代表手牌 |
|------|----------|----------|
| 1 | 超强牌 | AA, KK, QQ, AKs |
| 2 | 强牌 | JJ, TT, AKo, AQs, KQs, KJs |
| 3 | 可玩牌 | 77-99, AQo, AJs, KQo, QJs, QTs, KTs |
| 4 | 投机牌 | 22-66, AJo, ATo, KJo, 同花连张/隔张 |
| 5 | 弱牌 | 其余所有手牌 |

**位置建议：**
- UTG (枪口)：仅 Tier 1-2
- MP (中位)：Tier 1-3
- CO/BTN/SB/BB：Tier 1-4

---

## 6. AI 决策完整流程图

```
getAIDecision(profile, context, available)
│
├── 计算手牌力
│   ├── 翻前 → evaluatePreFlopStrength()
│   └── 翻后 → evaluatePostFlopStrength() + detectDraws()
│
├── 计算位置修正 → POSITION_MODIFIERS[position]
│
├── 短筹码检查
│   └── 无法常规操作 → strength > 0.3 ? 全下 : 弃牌
│
├── 翻前 → preFlopDecision()
│   ├── 计算入池阈值 = 1 - (vpip × posMod)
│   ├── strength > 阈值 → 加注(pfr概率) 或 跟注
│   └── strength ≤ 阈值 → 弃牌 或 过牌
│
└── 翻后 → postFlopDecision()
    ├── 可过牌 → 价值下注 / 诈唬 / 过牌
    └── 面注 → 加注 / 跟注 / 弃牌
        └── 下注量 → computeBetSize(profile, pot, …)
```
