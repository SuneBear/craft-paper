# ✂️ Craft Paper Shape

手绘风纸张形状组件系统，基于 React + Vite + TypeScript。
项目内置多种纸张预设、纹理、折角/裁剪/缝线等参数编辑能力，以及装饰物（贴纸/胶带/订书钉）交互编辑。
该项目最初通过 [Lovable](https://lovable.dev/) 生成并初始化，在此基础上持续迭代开发。

Prompt 原文档已整理在 [docs/paper-shape](docs/paper-shape)：
- 主要入口：[docs/paper-shape/paper-shape-prompt.md](docs/paper-shape/paper-shape-prompt.md)
- 规划文档：[docs/paper-shape/paper-shape-planning.md](docs/paper-shape/paper-shape-planning.md) / [docs/paper-shape/paper-shape-planning-v2.md](docs/paper-shape/paper-shape-planning-v2.md)

## Craft Paper 核心设计思路

在 Box 的秩序里，注入手工质感与温度。

核心实现思路：

- 几何先行，不做纯贴图：先定义 shape 轮廓与语义特征（折角、锯齿、打孔、撕边），再叠加纹理和装饰。
- 受控伪随机：通过 `seed + noise + humanize` 生成「看起来随机、实际可复现」的细节，避免每次渲染都失控漂移。
- 不完美要有边界：抖动、扭曲、旋转、阴影都在可调区间内，确保仍然可读、可排版、可用于真实内容。
- 语义化预设 + 参数化扩展：预设负责风格起点，参数负责风格变体，兼顾上手速度与创作自由度。
- 内容优先：形状变化必须让位于内容可读性，包含安全内边距、自动避让、标题装饰避让等机制。
- 分割票券双区承载：`coupon/ticket` 示例默认主区 + 副联区都放内容，避免窄区留白。
- 层次可调：堆叠中的深度、透明度、色彩贴近、收拢强度都可配置，支持从规整到随性的一组表达谱系。
- 可复用与可导出：编辑器、示例与导出链路统一，保证一套视觉结果可被复制、分享和二次开发。

---

## 1. 快速开始

```bash
npm install
npm run dev
```

常用脚本：

- `npm run dev`：开发模式
- `npm run build`：生产构建
- `npm run preview`：预览构建产物
- `npm run test`：运行测试
- `npm run lint`：代码检查

---

## 2. 页面入口（内置 Demo）

路由定义在 [src/App.tsx](src/App.tsx)：

- `/`：首页入口
- `/ui/paper-shape`：Paper Shape 模块主页
- `/ui/paper-shape/examples`：预设示例列表
- `/ui/paper-shape/containers`：容器示例页（实验性质，当前为初步尝试，后续会有重大调整）
- `/ui/paper-shape/preset/:preset`：预设详情编辑页
- `/ui/paper-shape/playground`：自由编辑器
- `/ui/paper-shape/stack`：卡牌堆叠与拼贴展示页（支持四种堆叠模式；控制面板分为风格预设 + 基础控制 + 可折叠高级控制，降低多滑杆操作负担）

---

## 3. 核心组件：`PaperShape`

主组件定义在 [src/components/paper-shape/PaperShape.tsx](src/components/paper-shape/PaperShape.tsx)。

### 3.0 发布与迁移说明

- 当前 **未发布 npm 包**，请按「源码复制」方式接入。
- 推荐最小复制目录：`src/components/paper-shape`（整目录复制）。

外部项目接入时，至少需要安装：
- `react`
- `react-dom`

可选依赖（仅当你需要装饰交互编辑）：
- `react-moveable`（用于装饰元素拖拽/缩放/旋转编辑）

`PaperShape` 现已改为按需动态加载 `react-moveable`：未安装时，普通形状渲染不受影响，只是不会显示装饰编辑手柄。

可选复制（仅当你要复用本项目配套页面能力）：
- 示例内容：`src/pages/paper-shape/support/PaperShapeSampleContent.tsx`
- 分享/导出/随机参数：`src/lib/paper-shape-share.ts`、`src/lib/paper-shape-export.ts`、`src/lib/paper-shape-random.ts`

### 3.1 最小用法

```tsx
import { PaperShape } from '@/components/paper-shape';

export function Demo() {
  return (
    <PaperShape preset="basic-paper" width={280} height={200}>
      <div style={{ textAlign: 'center' }}>Hello Craft Paper</div>
    </PaperShape>
  );
}
```

### 3.2 主要 Props

- `preset?: PaperPreset`：预设类型（默认 `basic-paper`）
- `width?: number` / `height?: number`：画布尺寸
- `layoutMode?: 'fixed' | 'content' | 'fill'`：布局模式（固定尺寸/内容自适应/父容器宽度自适应）
- `minWidth?` / `maxWidth?` / `minHeight?` / `maxHeight?`：`layoutMode` 下的尺寸约束
- `canvasPadding?: number`：外层画布留白（默认 `0`，外边贴合；需要外扩时手动设置）
- `seed?: number` / `roughness?: number`：随机种子与粗糙度
- `paperColor?: string`：纸张颜色（支持内置 key 或 CSS 颜色）
- `strokeColor?: string` / `strokeWidth?: number`：描边设置
- `shapeParams?: ShapeCommonParams`：通用风格参数（跨预设复用，推荐放高频样式）
- `presetParams?: PresetParams`：预设专属参数
- `showPattern?: boolean` / `patternType?: PaperPatternType` / `patternParams?: PatternParams`：纹理开关与参数
- `decorations?: DecorationItem[]`：装饰数据
- `interactiveDecorations?: boolean`：是否可拖拽/旋转/缩放装饰
- `onDecorationChange?` / `onDecorationRemove?`：装饰编辑回调
- 非交互态（无装饰交互且未绑定 `onClick`）时，`svg` 会自动使用 `pointer-events: none`，减少事件遮挡
- `contentPadding?: number | { all?; x?; y?; top?; right?; bottom?; left? }`：内容安全内边距（`all` 为基础值，其余字段可覆盖）
- `contentAlign?: 'center' | 'start'`：内容层对齐方式（居中/左上起始）
- `contentClassName?: string`：内容层容器 className
- `contentInteractive?: boolean`：内容层是否可交互
- `children?: ReactNode`：内容层

### 3.3 作为 UI 容器（无需新组件名）

```tsx
<PaperShape
  preset="basic-paper"
  layoutMode="fill"
  minHeight={180}
  maxWidth={680}
  contentAlign="start"
  contentPadding={{ all: 12, x: 14, top: 16, bottom: 12 }}
>
  <div className="w-full">
    <h3>游记面板</h3>
    <p>内容会自动避让打孔/切角安全区。</p>
  </div>
</PaperShape>
```

说明：
- SSR 首屏使用 `width` / `height` 初始值渲染；
- 客户端会基于内容和父容器宽度做自适应微调（避免新建 `PaperShapeContainer` API）。
- 对 `coupon/ticket` 这类有打孔分割语义的形状，建议在 `children` 内采用双区布局，并给打孔线附近留出 `keep-out band`（内容禁入带）以保证可读性。
- `coupon` 示例内容会跟随 `perforationOffset` 自动调整主券/副券区域比例，避免副券宽度写死。

### 3.4 双区内容子组件：`PaperShapeSplitContent`

用于 `coupon/ticket` 这类「主区 + 副区 + 中间禁入带」的可复用布局，不再把分区逻辑写死在示例页。

```tsx
import { PaperShape, PaperShapeSplitContent } from '@/components/paper-shape';

<PaperShape preset="coupon" width={280} height={200}>
  <PaperShapeSplitContent
    axis="vertical"
    splitRatio={0.62}
    secondarySide="end"
    keepOutBand={10}
    minSecondaryRatio={0.28}
    maxSecondaryRatio={0.42}
    minPrimaryRatio={0.44}
    primary={<MainCouponBlock />}
    secondary={<SideCouponBlock />}
  />
</PaperShape>
```

常用参数：
- `axis: 'vertical' | 'horizontal'`：竖向分栏或横向分栏
- `splitRatio`：分割线在内容盒中的相对位置（0~1）
- `secondarySide`：副区在起始侧或结束侧
- `keepOutBand`：分割线禁入带宽度（px）
- `primaryVerticalAlign` / `secondaryVerticalAlign`：分区内容垂直对齐（`start | center | end | stretch`）

---

## 4. 预设类型（`PaperPreset`）

定义在 [src/components/paper-shape/geometry.ts](src/components/paper-shape/geometry.ts)：

- `stamp`
- `coupon`
- `ticket`
- `tag`
- `folded`
- `torn`
- `stitched`
- `scalloped-edge`
- `receipt`
- `basic-paper`

---

## 5. 常见参数（`PresetParams`）

同样定义在 [src/components/paper-shape/geometry.ts](src/components/paper-shape/geometry.ts)。

为了避免“通用参数”和“预设语义参数”混在一起，现在类型层已拆分：

- `ShapeCommonParams`：通用样式参数（圆角/阴影/裁剪/直边扭曲等）
- `PresetSpecificParams`：预设语义参数（coupon/ticket/stamp/folded 等）

组件层支持：

- `shapeParams`：推荐放通用样式
- `presetParams`：放预设语义参数（兼容老代码，仍可混用）

高频参数示例：

- 圆角与角形：`cornerRadius` / `cornerRadiusTL/TR/BR/BL` / `cornerShape`
- 折角：`foldSize` / `foldCorners` / `foldCurve` / `foldColor`
- 裁剪：`cutoutEdges` / `cutoutShape` / `cutoutRadius` / `cutoutDepth` / `cutoutOffset`
- 阴影：`shadowEnabled` / `shadowOffsetX/Y` / `shadowOpacity` / `shadowColor`
- 直边扭曲：`edgeWobble`（全局）+ `edgeWobbleTop/Right/Bottom/Left`（单边覆盖）
- 票券分割线：`perforationOffset`（`coupon` 默认右偏，约 +12）

示例：

```tsx
<PaperShape
  preset="basic-paper"
  width={300}
  height={210}
  presetParams={{
    cornerRadius: 10,
    edgeWobble: 2.2,
    edgeWobbleBottom: 2.8,
    shadowOpacity: 0.18,
  }}
/>
```

---

## 6. 装饰系统（Decorations）

相关文件：

- 类型与工厂：[src/components/paper-shape/decorations.ts](src/components/paper-shape/decorations.ts)
- 渲染器：[src/components/paper-shape/DecorationRenderer.tsx](src/components/paper-shape/DecorationRenderer.tsx)
- 交互层：[src/components/paper-shape/DraggableDecoration.tsx](src/components/paper-shape/DraggableDecoration.tsx)

装饰类型：

- `washi-tape`
- `staple`
- `sticker`

创建装饰：

```tsx
import { createDecoration } from '@/components/paper-shape/decorations';

const sticker = createDecoration('sticker', 'heart', 160, 90, {
  rotation: -8,
  scale: 1.05,
});
```

当画布尺寸变化时，可用 `resizeDecorationsForCanvas(...)` 重排装饰位置（已在示例页和编辑页使用）。

---

## 7. 编辑器相关页面

- 预设详情页：[src/pages/paper-shape/PaperShapePresetDetail.tsx](src/pages/paper-shape/PaperShapePresetDetail.tsx)
- Playground：[src/pages/paper-shape/PaperShapePlayground.tsx](src/pages/paper-shape/PaperShapePlayground.tsx)
- 示例页：[src/pages/paper-shape/PaperShapeExamples.tsx](src/pages/paper-shape/PaperShapeExamples.tsx)
- 堆叠页：[src/pages/paper-shape/PaperShapeStack.tsx](src/pages/paper-shape/PaperShapeStack.tsx)（多种堆叠模式、随机旋转、可调 hover 收拢、后层深度/色彩贴近/透明度控制）
- 容器示例页：[src/pages/paper-shape/PaperShapeContainers.tsx](src/pages/paper-shape/PaperShapeContainers.tsx)
- 页面配套（layout/nav/panel/sample/deco）：[src/pages/paper-shape/support](src/pages/paper-shape/support)

---

## 8. 给后续 AI Agent 的维护提示

如果要继续扩展 PaperShape，优先从以下文件入手：

1. 几何生成：`src/components/paper-shape/geometry.ts`
2. 主入口（参数编排、布局与组装）：`src/components/paper-shape/PaperShape.tsx`
3. SVG 渲染层（mask/pattern/描边/装饰）：`src/components/paper-shape/PaperShapeSvg.tsx`
4. 纯计算模型（cutout/perforation/safe-insets/padding）：`src/components/paper-shape/paperShapeModel.ts`
5. 共享类型与工具：`src/components/paper-shape/paperShapeTypes.ts`、`src/components/paper-shape/paperShapeUtils.ts`
6. 装饰交互状态：`src/components/paper-shape/usePaperDecorationSelection.ts`
7. 装饰 Moveable 控件：`src/components/paper-shape/PaperShapeDecorationMoveable.tsx`
8. 自适应布局逻辑：`src/components/paper-shape/usePaperAutoLayout.ts`
9. 可复用标题组件：`src/components/paper-shape/PosterTitle.tsx`
10. 页面配套模块（layout/nav/panel/sample/deco）：`src/pages/paper-shape/support/*`
11. 示例数据：`src/pages/paper-shape/PaperShapeExamples.tsx`
12. 容器示例：`src/pages/paper-shape/PaperShapeContainers.tsx`
13. 随机参数策略：`src/lib/paper-shape-random.ts`

补充：
- `PaperShape` 对外导出入口（barrel）：`src/components/paper-shape/index.ts`
- `PosterTitle` 的引号装饰会自动避让正文区域，并在视觉层级上保持可见，避免右侧引号被标题内容遮挡。

已知优化点：

- `PaperShapeSvg.tsx` 内有 TODO：`cutout` 与外轮廓若要彻底消除亚像素接缝，可考虑合并为单轮廓描边流程。
- 目前 `PaperShape` 作为容器时，在整体尺寸策略、安全区域计算与使用方式（替代 `div` / `button` 的易用性）上还不够理想；该部分需要继续优化，才能更稳定地承接常规容器语义。

---

## 9. 材质风格 TODO

- 当前仓库暂不启用新的“材质风格”实现（保持现有扁平风）。
- 后续计划再独立评估并设计：`paper-emboss`（纸张压纹）与 `collage-raised`（拼贴抬起）两条方向。
- 新方案落地时，需同步更新组件 API、编辑器面板、示例页与分享/导出协议。

---

## 10. 许可证

当前仓库未单独声明许可证，请按团队/项目约定使用。
