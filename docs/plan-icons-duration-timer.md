# 执行计划：卡通图标 + 时长自由选择 + 全屏计时器

> 交给 Codex 执行。全部改动集中在单文件 `App.tsx`。`react-native-svg@15.15.4` 已在依赖中，无需装包。
> 本文档给出**目标设计 + 参考实现代码 + 验证标准**。大部分代码已由上游草拟并写入 `App.tsx`；Codex 的职责是：**核对是否落地正确 → `npx tsc --noEmit` 跑通并修复 → web 预览截图验证 → 必要时按本文档修正**。

## 背景

当前 `App.tsx` 所有"图标"都是文本符号拼的：道具/保护用 `AphroditeMiniIcon`（`◡◔●✊▰◠`）、姿势用 `◒◐◉`、心情用 `×_×` 颜文字，观感粗糙。同时"持续时间"只有固定步进+预设，不够自由，且缺少计时器。

## 已确认的设计选择

- 图标风格：**填充双色卡通**（用主题色做双色调，随主题自适应）
- 姿势图标：**抽象双人剪影**（两个圆润小人，含蓄不露骨）
- 时长输入：**滚轮(0–180分) + 手动输入 都要**，并保留快捷预设
- 计时器：**独立全屏计时页**，完成后自动按分钟回填时长

---

## Part 0 — 引入 react-native-svg

`App.tsx` 顶部 import 区加入：

```ts
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
```

---

## Part 1 — 卡通 SVG 图标系统（18 个图标）

用 `CartoonIcon` 组件统一提供 18 个图标，viewBox `0 0 32 32`，填充双色随主题：
`main = active ? colors.primary : '#7d70b0'`，`soft = active ? colors.primaryLight : '#cdc4e8'`，心情脸另传 `color`。

- 自慰道具(3)：`hand` 手掌、`cup` 飞机杯、`wand` 女用玩具（棒状按摩器）
- 保护措施(3)：`noProtect` 盾牌+斜杠、`condom` 方形包装+圆形、`pill` 避孕药板
- 姿势(7) 抽象双人剪影：`sideLying` 侧躺、`rear` 后入、`cowgirl` 骑乘、`kneel` 跪姿、`embrace` 拥抱、`standing` 站立、`prone` 俯卧
- 心情(5)：`moodBad` 难受、`moodMeh` 一般、`moodCalm` 平静、`moodHappy` 开心、`moodJoy` 愉悦

### 参考实现（替换掉旧的 `AphroditeMiniIcon`）

```tsx
type IconName =
  | 'hand' | 'cup' | 'wand'
  | 'noProtect' | 'condom' | 'pill'
  | 'sideLying' | 'rear' | 'cowgirl' | 'kneel' | 'embrace' | 'standing' | 'prone'
  | 'moodBad' | 'moodMeh' | 'moodCalm' | 'moodHappy' | 'moodJoy';

// 抽象小人：圆头 + 椭圆身，dir 控制横躺/竖立
function Figure({ x, y, dir, fill }: { x: number; y: number; dir: 'h' | 'v'; fill: string }) {
  if (dir === 'h') {
    return (
      <G>
        <Circle cx={x - 5.5} cy={y} r={3} fill={fill} />
        <Ellipse cx={x + 1.5} cy={y} rx={5.5} ry={3} fill={fill} />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={x} cy={y - 5.5} r={3} fill={fill} />
      <Ellipse cx={x} cy={y + 1.5} rx={3} ry={5.5} fill={fill} />
    </G>
  );
}

function CartoonIcon({ name, size = 27, active = false, color }: { name: IconName; size?: number; active?: boolean; color?: string }) {
  const main = active ? colors.primary : '#7d70b0';
  const soft = active ? colors.primaryLight : '#cdc4e8';
  const ink = '#4a4368';
  const svg = (children: ReactNode) => (
    <Svg width={size} height={size} viewBox="0 0 32 32">{children}</Svg>
  );

  switch (name) {
    case 'hand':
      return svg(<>
        <Rect x={9} y={14} width={14} height={12} rx={5} fill={main} />
        <Rect x={10} y={7} width={2.6} height={10} rx={1.3} fill={soft} />
        <Rect x={13.3} y={5.5} width={2.6} height={11.5} rx={1.3} fill={soft} />
        <Rect x={16.6} y={6} width={2.6} height={11} rx={1.3} fill={soft} />
        <Rect x={19.8} y={8} width={2.6} height={9} rx={1.3} fill={soft} />
        <Rect x={5.4} y={15.6} width={6} height={2.8} rx={1.4} fill={soft} transform="rotate(42 8 17)" />
      </>);
    case 'cup':
      return svg(<>
        <Rect x={10} y={8} width={12} height={18} rx={3} fill={soft} />
        <Ellipse cx={16} cy={8} rx={6} ry={2.6} fill={main} />
        <Ellipse cx={16} cy={8} rx={3.2} ry={1.3} fill={soft} />
        <Rect x={12.6} y={12} width={2.2} height={9} rx={1.1} fill="rgba(255,255,255,0.55)" />
      </>);
    case 'wand':
      return svg(<>
        <Rect x={13.8} y={12} width={4.4} height={15} rx={2.2} fill={main} />
        <Circle cx={16} cy={9} r={6} fill={soft} />
        <Circle cx={16} cy={9} r={2.6} fill={main} />
      </>);
    case 'noProtect':
      return svg(<>
        <Path d="M16 4 L26 8 V15 C26 21 21 26 16 28 C11 26 6 21 6 15 V8 Z" fill={soft} />
        <Line x1={9} y1={9} x2={23} y2={24} stroke={main} strokeWidth={3.2} strokeLinecap="round" />
      </>);
    case 'condom':
      return svg(<>
        <Rect x={6} y={8} width={20} height={16} rx={3} fill={soft} />
        <Circle cx={16} cy={16} r={5.4} fill={main} />
        <Circle cx={16} cy={16} r={2.4} fill={soft} />
      </>);
    case 'pill':
      return svg(<>
        <Rect x={6} y={6} width={20} height={20} rx={4} fill={soft} />
        {[11, 21].map((cx) => [11, 16, 21].map((cy) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.4} fill={main} />
        )))}
      </>);
    case 'sideLying':
      return svg(<><Figure x={18} y={13} dir="h" fill={soft} /><Figure x={15} y={19} dir="h" fill={main} /></>);
    case 'prone':
      return svg(<><Figure x={16} y={13} dir="h" fill={soft} /><Figure x={16} y={20} dir="h" fill={main} /></>);
    case 'rear':
      return svg(<><Figure x={21} y={16} dir="h" fill={soft} /><Figure x={13} y={16} dir="h" fill={main} /></>);
    case 'cowgirl':
      return svg(<><Figure x={16} y={22} dir="h" fill={soft} /><Figure x={16} y={11} dir="v" fill={main} /></>);
    case 'kneel':
      return svg(<><Figure x={20} y={17} dir="v" fill={soft} /><Figure x={12} y={17} dir="v" fill={main} /></>);
    case 'embrace':
      return svg(<><Figure x={19} y={16} dir="v" fill={soft} /><Figure x={13} y={16} dir="v" fill={main} /></>);
    case 'standing':
      return svg(<><Figure x={21} y={16} dir="v" fill={soft} /><Figure x={11} y={16} dir="v" fill={main} /></>);
    default: { // 心情脸
      const face = color || soft;
      const eye = (cx: number) => <Circle cx={cx} cy={14} r={1.6} fill={ink} />;
      let features: ReactNode = null;
      if (name === 'moodBad') {
        features = (<>
          <Line x1={9.6} y1={13} x2={13} y2={14.4} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Line x1={22.4} y1={13} x2={19} y2={14.4} stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M11 22 Q16 18 21 22" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>);
      } else if (name === 'moodMeh') {
        features = (<>{eye(11.5)}{eye(20.5)}<Line x1={11.5} y1={21} x2={20.5} y2={21} stroke={ink} strokeWidth={1.8} strokeLinecap="round" /></>);
      } else if (name === 'moodCalm') {
        features = (<>{eye(11.5)}{eye(20.5)}<Path d="M12 20 Q16 22.5 20 20" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" /></>);
      } else if (name === 'moodHappy') {
        features = (<>{eye(11.5)}{eye(20.5)}<Path d="M11 19.5 Q16 25 21 19.5" stroke={ink} strokeWidth={1.9} fill="none" strokeLinecap="round" /></>);
      } else { // moodJoy
        features = (<>
          <Path d="M9.5 14.5 Q11.5 12 13.5 14.5" stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
          <Path d="M18.5 14.5 Q20.5 12 22.5 14.5" stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
          <Path d="M10 18.5 Q16 27 22 18.5" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />
        </>);
      }
      return svg(<><Circle cx={16} cy={16} r={12} fill={face} />{features}</>);
    }
  }
}
```

### 替换调用点

1. **`IconChoiceGrid`**：`options` 的 `icon` 字段类型改为 `IconName`；内部 `<AphroditeMiniIcon .../>` → `<CartoonIcon name={option.icon} active={active} size={30} />`。
2. **保护措施** 选项（partneredSex）：`{ label: '无保护措施', icon: 'noProtect' }`, `{ '安全套', 'condom' }`, `{ '药物', 'pill' }`。
3. **自慰道具** 选项（soloSex）：`{ 'Hand Job', 'hand' }`, `{ '飞机杯', 'cup' }`, `{ '女用玩具', 'wand' }`。
4. **姿势 `MiniChoiceRail`**：删掉 `◒◐◉` 字符，加映射并渲染图标：

```tsx
const positionIconMap: Record<string, IconName> = {
  侧躺: 'sideLying', 后入: 'rear', 骑乘: 'cowgirl', 跪姿: 'kneel',
  拥抱: 'embrace', 站立: 'standing', 俯卧: 'prone',
};
// 列表项内：<CartoonIcon name={positionIconMap[option] || 'embrace'} active={active} size={30} />
```

5. **`MoodPicker`**：圆脸背景不再用 backgroundColor；改为渲染 `<CartoonIcon name={option.name} color={option.color} size={46} />`，并在脸下加一行 `moodLabel` 文案。选项：
```
{难受 moodBad #ffb9bd} {一般 moodMeh #ffeaa7} {平静 moodCalm #a9c7fb} {开心 moodHappy #8fe0dd} {愉悦 moodJoy #d0b6ff}
```

6. 删除旧的文本版 `AphroditeMiniIcon`。旧样式 `aphroditeIconText / miniChoiceGlyph / miniChoiceGlyphActive / moodFaceText` 变为未使用（可删可留，删更干净）。

---

## Part 2 — 持续时间自由选择（滚轮 + 手动 + 预设）

改造 `DurationField`：步进 **±1**；中间数值区**可点击**打开 `DurationPickerModal`；保留预设 chips；新增"用计时器记录"按钮打开全屏计时页。上限 600 分钟。

```tsx
function DurationField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const current = Number(value) || 0;
  const presets = [10, 15, 20, 30, 45, 60, 90];
  const [showPicker, setShowPicker] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  function setValue(next: number) {
    const clamped = Math.max(0, Math.min(600, next));
    onChange(clamped > 0 ? String(clamped) : '');
  }
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.durationStepper}>
        <Pressable style={styles.stepperButton} onPress={() => setValue(current - 1)}><Text style={styles.stepperButtonText}>−</Text></Pressable>
        <Pressable style={styles.stepperValueBox} onPress={() => setShowPicker(true)}>
          <Text style={styles.stepperValue}>{current > 0 ? current : '未设置'}</Text>
          <Text style={styles.stepperUnit}>{current > 0 ? '分钟 · 点击调整' : '点击选择'}</Text>
        </Pressable>
        <Pressable style={styles.stepperButton} onPress={() => setValue(current + 1)}><Text style={styles.stepperButtonText}>＋</Text></Pressable>
      </View>
      <View style={styles.sheetChipGroup}>
        {presets.map((preset) => (
          <Pressable key={preset} style={[styles.sheetChip, current === preset && styles.sheetChipActive]} onPress={() => setValue(preset)}>
            <Text style={[styles.sheetChipText, current === preset && styles.sheetChipTextActive]}>{preset}分</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.timerLaunchButton} onPress={() => setShowTimer(true)}>
        <Clock color={colors.primary} size={17} strokeWidth={2.6} />
        <Text style={styles.timerLaunchText}>用计时器记录</Text>
      </Pressable>
      <DurationPickerModal visible={showPicker} value={current}
        onCancel={() => setShowPicker(false)}
        onConfirm={(m) => { setValue(m); setShowPicker(false); }} />
      <TimerModal visible={showTimer}
        onClose={() => setShowTimer(false)}
        onDone={(m) => { setValue(m); setShowTimer(false); }} />
    </View>
  );
}
```

`DurationPickerModal`：复用时间选择器的列样式（`timeOption/timeOptionActive/timeOptionText/timeOptionTextActive`）与日期弹层面板样式（`datePickerModalRoot/datePickerBackdrop/datePickerPanel/datePickerTitleBox/datePickerTitle/datePickerActions/datePickerGhostButton/...`）。一列 0–180 分钟滚轮 + 一个 `TextInput`(number-pad) 手动输入；打开时 `scrollTo({ y: value*44 - 64 })` 定位到当前值（行高 40+marginBottom 4 = 44，与时间选择器一致）。手动输入可超过 180（上限 600），以 `draft` 为准 `onConfirm`。

`TimerModal`：全屏 `<Modal animationType="slide">`。`useRef` 存 `startedAt` 时间戳 + `accumulated` 秒；running 时 `setInterval(…,250)` 刷新；**开始/暂停/继续、重置、完成、右上角关闭**；`visible` 变 false 时清 interval 并重置。**完成**：`total>0 ? Math.max(1, Math.round(total/60)) : 0`，>0 才 `onDone(minutes)`，否则 `onClose()`。运行时环境允许 `Date.now()`。

> 完整的 `DurationPickerModal` / `TimerModal` 参考实现已写入 `App.tsx`，Codex 核对即可；关键行为见上。

---

## 需要新增的样式（`createStyles` 内）

- `timerLaunchButton`(soft 底、居中 row、gap 8、圆角 16、高 46)、`timerLaunchText`(primary 900)
- `durationManualRow`/`durationManualLabel`/`durationManualInput`(number-pad、右对齐)/`durationScroll`(height 176)
- 计时页：`timerRoot`(flex1 居中 gap26 bg)、`timerClose`(绝对右上)、`timerHeading`、`timerRing`(250×250 圆、渐变)、`timerDisplay`(54 号、`fontVariant: ['tabular-nums']`)、`timerSub`、`timerControls`(row gap14)、`timerGhostButton`/`timerGhostText`、`timerPrimaryButton`/`timerPrimaryGradient`/`timerPrimaryText`、`timerHint`
- `MoodPicker`：`moodButton` 加 `gap:5`；删 `moodFaceText`；加 `moodLabel`(sub 11 800)/`moodLabelActive`(primary)

---

## 验证（Codex 必做）

1. `npx tsc --noEmit` 必须通过（`tsconfig` strict）。修复所有类型错误。
2. `npm run web:preview`（端口 8090）起服务，用 `tools/` 下 Playwright 脚本（Edge 路径 `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`，viewport 430×932）截图核对：
   - 自慰表单：道具 hand/cup/wand + 心情脸卡通图标
   - 做爱表单：保护措施 noProtect/condom/pill、姿势双人剪影、心情图标
   - 时长：±1 步进；点数值弹出「滚轮 + 手动输入」；「用计时器记录」按钮
   - 全屏计时页：开始→暂停→完成，完成后时长自动回填
3. **确认 `react-native-svg` 在 web(react-native-web) 正常渲染**；若个别图元在 web 有差异，用 `Path` 兜底重画。
4. 计时器边界：未启动就"完成"不写值；<1 分钟按 1 分钟；切页/关闭清理 interval 不泄漏。

## 约束

- 只改 `App.tsx`；不改数据结构（`duration` 仍存分钟字符串，向后兼容）。
- 图标全部用主题色变量绘制，切 原版/薄荷/蓝色 主题自动适配。
- 不要杀 node 进程（会误杀开发者的终端）。

## 当前实现状态（供 Codex 参考）

上游已将以上全部改动写入 `App.tsx`（import、`CartoonIcon`+`Figure`、四处调用点替换、`DurationField`/`DurationPickerModal`/`TimerModal`、相关样式），但**尚未跑通 `tsc` 与截图验证**（环境限制）。Codex 请以「核对 + 跑通 + 修复 + 截图」为主，避免重复造轮子；若发现与本文档不符或类型报错，按本文档为准修正。
