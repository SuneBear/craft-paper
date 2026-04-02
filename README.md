# ✂️ Craft Paper Shape

手绘风纸张形状组件系统，基于 React + Vite + TypeScript。  
项目内置多种纸张预设、纹理、折角/裁剪/缝线等参数编辑能力，以及装饰物（贴纸/胶带/订书钉）交互编辑。
该项目最初通过 [Lovable](https://lovable.dev/) 生成并初始化，在此基础上持续迭代开发。

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
- `/ui/paper-shape/stack`：卡牌堆叠与拼贴展示页（支持四种堆叠模式、随机旋转、可调 hover 收拢，以及后层深度/色彩贴近/透明度调节）

---

## 3. 核心组件：`PaperShape`

主组件定义在 [src/components/paper-shape/PaperShape.tsx](src/components/paper-shape/PaperShape.tsx)。

### 3.1 最小用法

```tsx
import { PaperShape } from '@/components/paper-shape/PaperShape';

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
- `PosterTitle` 的引号装饰会自动避让正文区域，并在视觉层级上保持可见，避免右侧引号被标题内容遮挡。

已知优化点：

- `PaperShapeSvg.tsx` 内有 TODO：`cutout` 与外轮廓若要彻底消除亚像素接缝，可考虑合并为单轮廓描边流程。

---

## 9. 许可证

当前仓库未单独声明许可证，请按团队/项目约定使用。
