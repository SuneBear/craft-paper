# Paper Shape 定制 Planning

## 1. 目标与范围

基于 `paper-shape-prompt.md`，本期目标是落地一个可扩展的手帐风异形系统，核心由四部分组成：

1. `PaperShape`：异形纸张主体（角、边、粗糙度、裁切、折角、分层样式）。
2. `PaperPattern`：纸张纹理/底纹（横线、方格、点阵、乐谱、儿童涂鸦等）。
3. `Decorations`：装饰叠层（图钉、胶带、回形针、贴纸、缝线、有机边缘、几何装饰、文字标签）。
4. `PaperComposition`：多页组合（纸堆、书本、封面、装订结构、页序状态）。

并提供：

1. `Paper Shape Hub` 汇总页面：介绍 `paper-shape` 能力边界、实施路线与入口导航。
2. `示例库` 页面：集中展示完整示例列表（场景组合可直接浏览）。
3. `示例详情` 页面：每个示例可进入详情页进行微调、导出、复制。
4. `参数编辑器` 页面（Playground）：提供完整参数调节与随机生成。
5. `Stack 堆叠` 页面：展示纸堆、书册、封面、装订等结构组合。
6. `性能测试` 页面：进行 benchmark 与数据观测（替代原“质量”页）。
7. Code Generator：导出组件调用代码与独立 SVG/React 代码。

导航一致性约束：

1. `paper-shape` 所有子页面（`/ui/paper-shape/***`）必须共享同一套导航壳层。
2. 子页面仅负责自身内容区，不重复定义一套新的顶部导航，避免跳转时导航抖动与认知切换。

### 1.1 页面信息架构（新版）

统一保留 5 个核心导航入口：

1. `/ui/paper-shape`：总览页（介绍 + 导航 + 部分示例预览）。
2. `/ui/paper-shape/examples`：完整示例库。
3. `/ui/paper-shape/playground`：参数编辑器（支持 Random 随机生成）。
4. `/ui/paper-shape/stack`：Stack 堆叠与书册组合。
5. `/ui/paper-shape/performance`：性能测试。

示例详情路由：

1. `/ui/paper-shape/examples/[id]`：单个示例的微调、导出、复制。

## 2. 架构决策（先回答“一个组件还是多个组件”）

建议采用“**单页能力内核 + 组合层组件 + 轻包装预设组件**”：

1. 单页内核：`<PaperShape />` 作为单页统一 API，承载几何与图层。
2. 组合层：`<PaperStack />`、`<PaperBook />` 负责多页布局、层级、状态编排。
3. 插件化内核：几何生成、图层渲染、纹理、装饰、导出分模块实现，避免巨型组件失控。
4. 轻包装预设：提供 `<PaperCoupon />`、`<PaperStamp />` 等语义组件，本质只是 preset + token。

不建议：

1. 只做一个超级组件：后期参数爆炸，维护困难。
2. 每种形状都做独立组件且无统一内核：复用率低，行为不一致。
3. 把 `Stack/Book` 强塞进 `PaperShape`：会把单页几何和多页状态耦合在一起。

## 3. 技术路线建议（对“有没有更好实现方式”的结论）

结论：**SVG Path + 分层渲染**作为主方案，CSS `clip-path` 作为辅助手段。

1. 主体异形：用 SVG 路径生成（更适合不规则、粗糙、折角、裁切、多层轮廓）。
2. 手工感：用 seed 驱动噪声/扰动，保证“可复现随机”。
3. 阴影与高光：优先路径复制偏移 + 渐变，谨慎使用大半径 blur/drop-shadow。
4. 动态尺寸：通过 `ResizeObserver + viewBox` 保持内容自适应。
5. 导出代码：导出“参数化 recipe”而不是仅导出静态 path，兼顾二次编辑。
6. 组合场景：`Stack/Book` 通过组合层计算页偏移、厚度、装订，不侵入单页几何内核。

`augmented-ui` 可借鉴其“变量化拼装思路”，但它偏几何科技风；你的手帐风需要更高的有机不规则度，核心仍应在 SVG 几何内核。

### 3.1 augmented-ui 实现拆解（基于 `docs/paper-shape/augmented-ui.css`）

下面是可直接迁移的关键机制：

1. Space Toggle 开关体系：大量变量默认是空值 `;`，启用时写成 `initial`，再通过 `var()` fallback 拼接逻辑分支。
2. 双层位置模型：每个方位有 `1/2` 两级（如 `tl1/tl2`、`t1/t2`），支持单点和复合切角。
3. 统一参数维度：每个位置都可调 `width/height/inset/extend`，边位额外支持 `center/offset`。
4. 派生计算层：通过 `--aug__*` 派生变量把基础参数换算为 join 点、中心点、内外边界坐标。
5. 形状“退化片段”拼装：`step/rect/clip/round/scoop` 各自产生点片段，再合并到一个 polygon 路径。
6. 圆角近似策略：用预定义三角函数常量（9°~81°）生成多段点，逼近圆弧。
7. 图层复用：`core / border / inlay` 共用同一套几何坐标，只替换 deg 偏移和渲染层。
8. 伪元素/委托层：`::after` 渲染 border、`::before` 渲染 inlay，也支持 delegated 子元素承接图层。
9. Mixin token API：通过 `data-augmented-ui~="tl-clip"` 这类 token 映射到变量组合，形成声明式语法。

对本项目的落地建议：

1. 继承它的“语法层 + 计算层 + 渲染层”分层思想，但把核心计算迁移到 TypeScript 的 shape compiler，避免 CSS 变量复杂度失控。
2. 保留它“同几何多图层复用”的机制，用于 `fill/stroke/shadow/fold` 与后续 `border/inlay` 扩展。
3. 把 `mixin token` 转换为我们的 `preset recipe`，例如 `coupon/stamp/ticket/receipt` 对应一组标准组合参数。
4. 手帐风有机变化通过 `seed + humanize` 在 path 点集阶段处理，不依赖 texture 才能保证结构稳定。

### 3.2 Noise / Humanize 设计补充（path-first）

目标：在不依赖 texture 的前提下，为 path 结构注入“可复现的手工变化”。

1. 可插拔管线：`base path -> humanize passes -> stabilized path -> layers`。
2. 变化通道：边缘抖动、角点偏移、切口偏移、折角扰动、描边不匀。
3. seed 固定策略：同一 `recipe + size + seed` 必须产出同一几何结果。
4. 作用范围：优先几何级（points/segments），避免仅视觉滤镜级 noise。
5. 强度分层：`global amount` + `channel weights` + `edge masks`。
6. 稳定性约束：人化扰动后仍需满足 `constraints`（最小边长、最小角尺寸）。
7. 性能策略：按 seed + recipe 做 memo/cache，hover/active 优先复用点集。
8. 降级策略：低性能模式仅保留主通道（edge jitter + corner warp）。

### 3.3 视觉达标缺口补齐（必须补）

当前已具备“可运行的系统架构”，但要达到目标手帐风效果，必须补齐以下约束：

1. `Preset 形状规范表`：每个 preset 需要几何定义与禁区定义，而不是仅名称。
2. `视觉 Token 基线`：描边、纸色、阴影、pattern、装饰比例必须有统一范围。
3. `Humanize 结构约束`：随机只能在安全区扰动，不能破坏 preset 识别特征。
4. `视觉验收标准`：每个 preset 需要“通过/失败”判定规则。
5. `Golden Set` 目标图：每个 preset 必须有目标图作为实现对照。
6. `形状驱动实施顺序`：先做对核心 preset，再扩展页面和编辑器能力。

### 3.4 Preset 规范表（模板）

每个 preset 至少补齐以下字段：

| preset | 核心轮廓特征 | 四角规则 | 四边规则 | cutout 规则 | 响应式规则 | 禁止项 |
| --- | --- | --- | --- | --- | --- | --- |
| stamp | 齿边邮票外轮廓 | 四角通常 round，size 范围固定 | 四边 `stamp`，齿距/齿深按边长缩放 | 默认无 cutout | 小尺寸降低齿数，保齿深比例 | 禁止出现直边占主导 |
| coupon | 双侧半圆打孔票券 | 角可小圆角 | 上下平直、左右可轻微变化 | 左右各 1 个半圆孔（subtract） | 孔半径随短边比例缩放 | 禁止孔位偏离中线 |
| ticket | 票卡切角 + 缝线边感 | 四角 notch | 上下缝线，左右平直 | 可选无孔 | 小尺寸优先保切角 | 禁止出现 stamp 齿边 |
| receipt | 小票底边锯齿 | 上角小圆，下角通常直 | 上/左/右平直，底边锯齿 | 默认无孔 | 底边齿数随宽度缩放 | 禁止上边出现锯齿 |
| tag | 吊牌 + 穿孔 | 圆角为主 | 边缘平稳 | 左上/上侧单孔 | 孔半径下限固定 | 禁止双侧 coupon 半孔 |
| folded | 折角便签 | 指定一角 `fold` | 其余边平稳或轻波动 | 默认无孔 | 折角尺寸有上限 | 禁止折角穿出主体 |
| torn | 撕纸拼贴 | 角较弱化 | 至少一边 tear | 可选 | 小尺寸降低撕裂振幅 | 禁止规则化齿边 |

补充说明：

1. 以上为模板，落地时每个字段要写可计算区间（例如 amplitude/density/min-max）。
2. 所有 preset 必须定义“禁止项”，用于防止随机参数把形状做歪。

### 3.5 视觉 Token 基线（手帐风）

建议在文档固化 `token` 范围，避免页面各写各的：

1. 轮廓描边：色值范围（暖棕系）+ 粗细区间（例如 `1.2~2.2`）。
2. 填充底色：纸色主色板（奶白/米黄/牛皮纸）与可选偏移。
3. 阴影策略：默认偏移阴影，不用大半径 blur。
4. Pattern 强度：默认透明度范围（例如 `0.06~0.18`）。
5. 装饰比例：pin/tape/clip 默认缩放与安全位置区间。
6. 标签文字：字体、字号、行数上限、边缘安全区。

### 3.6 Humanize 约束策略（结构优先）

1. 每个 preset 单独给出 `humanize channel caps`（不是全局一套）。
2. 定义 `不可扰动区域`：例如 coupon 的孔位中线、receipt 顶边。
3. `seed` 只影响细节，不影响 preset 主识别结构。
4. 扰动后必须通过几何约束检查（最小边长、最小角距、孔位不出界）。

### 3.7 验收标准（视觉 + 几何）

除了 deterministic/perf，还需加入视觉验收：

1. 形状识别度：肉眼 1 秒可辨认为对应 preset（stamp/receipt 等）。
2. 结构正确率：禁区规则 100% 不触发。
3. 风格一致性：描边、阴影、pattern 强度不偏离 token 基线。
4. 导出一致性：页面预览与导出 SVG 外观一致。

### 3.8 Golden Set（目标图）与分工

1. 每个 preset 至少准备 `2` 张目标图：标准款 + 变化款（共 `14` 张起）。
2. 每张图附一句“不可妥协特征”（例如“receipt 顶边必须平直”）。
3. 目标图来源优先级：产品/设计确认图 > 参考图 > 临时占位图。
4. 开发侧用目标图做并排对照（Example 页 + 详情页）。

分工建议：

1. 你（产品/设计）提供目标图与关键特征说明。
2. 我们负责把图转换为参数区间、验收规则与快照基线。
3. 如目标图未齐，可先用占位图推进，但最终必须替换为确认版。

## 4. 模块拆分（建议目录）

```txt
components/craft/paper-shape/
  paper-shape.tsx
  paper-shape.types.ts
  paper-shape.tokens.ts
  engine/
    geometry/
      corners.ts
      edges.ts
      cutouts.ts
      fold.ts
      roughness.ts
      shape-compiler.ts
    layers/
      fill-layer.tsx
      stroke-layer.tsx
      shadow-layer.tsx
      fold-shading-layer.tsx
      overlay-layer.tsx
  presets/
    coupon.ts
    stamp.ts
    ticket.ts
    receipt.ts
    tag.ts
    bookmark.ts
    torn-paper.ts
    collage.ts
    stitched.ts
  generator/
    export-react.ts
    export-svg.ts
    serialize-recipe.ts

components/craft/paper-pattern/
  paper-pattern.tsx
  pattern-presets.ts

components/craft/paper-decorations/
  paper-decoration.tsx
  paper-decoration-label.tsx
  decoration-presets.ts

components/craft/paper-composition/
  paper-stack.tsx
  paper-book.tsx
  book-cover.tsx
  book-binding.tsx
  composition.types.ts
  composition-presets.ts
```

## 5. 实施顺序（按架构自底向上）

### 5.0 执行节奏修正（形状优先）

在“自底向上”基础上增加一条硬约束：先做对形状，再扩展功能页面。

1. 第一阶段：先完成 `stamp/coupon/receipt/ticket` 的几何与视觉达标（按 Golden Set 验收）。
2. 第二阶段：补齐 `tag/folded/torn`，统一 token 与 humanize 约束。
3. 第三阶段：再继续扩展编辑器高级面板、组合能力和导出体验。

未通过阶段验收时，不进入下一阶段。

### 5.1 底层引擎
1. 定义 shape recipe schema、参数边界、冲突解析与 fallback 规则。
2. 实现几何编译器：`corner/edge/cutout/fold` -> path points/path string。
3. 实现 humanize 引擎：seeded 随机流、通道扰动、约束回写、缓存策略。
4. 提供 path 调试工具（仅轮廓/锚点/约束提示）。
5. 新增引擎 Example：实时展示 path 变化（参数->路径），用于边做边校准。
6. 搭建 Playground 最小壳：先提供预览区 + 核心参数面板（不含完整导出）。

交付标准：同 `recipe + size + seed` 结果稳定复现，尺寸变化不破型。

### 5.2 渲染层
1. 实现图层管线：`fill/stroke/shadow/foldShading`。
2. 打通 `PaperPattern` 叠加与裁切对齐。
3. 打通 `Decorations` 锚点定位与 `label text` 文字装饰。
4. 新增渲染 Example：图层开关、混合模式、文本标签可读性验证。
5. 增量扩展参数编辑器：加入图层控制、装饰面板、随机参数生成。

交付标准：图层组合稳定，文字不穿帮，避免重 blur 也有层次。

### 5.3 组件层
1. 落地 `PaperShape` 主组件与 preset 组件（如 `PaperCoupon`/`PaperStamp`/`PaperReceipt`）。
2. 落地 `PaperPattern` 与 `PaperDecoration` 组件 API。
3. 整合核心属性/微调属性分组，统一参数入口。
4. 新增组件 Example：按业务调用方式展示（内容驱动尺寸、固定尺寸、混合布局）。
5. 增量扩展参数编辑器：加入 preset 切换与参数分组（核心/微调）。

交付标准：业务页面可直接调用组件，不需要理解底层几何细节。

### 5.4 组合层
1. 落地 `PaperComposition`。
2. 实现 `PaperStack`。
3. 实现 `PaperBook = BookCover + PaperPages + BookBinding`。
4. 新增 Stack 页面：纸堆、书本、标签册页等场景验证。
5. 增量扩展参数编辑器：加入组合场景配置（页数、偏移、装订、封面）。

交付标准：可稳定构建纸堆与书本场景，结构可扩展。

### 5.5 输出与工具层
1. 实现导出：`Recipe / JSX / SVG`。
2. 完善示例库 + 示例详情页（场景化样例 + 配方查看/复制 + 详情微调）。
3. 完善参数编辑器（参数面板、实时预览、随机生成、代码导出），与前序增量能力汇总整合。

交付标准：可在 Playground 组合样式并导出到业务代码。

### 5.6 质量与性能
1. 建立快照矩阵（preset × size × state × seed）。
2. 建立约束测试与边界参数测试。
3. 建立性能预算（单页实例、组合页数、重算频率）。

交付标准：交互稳定、性能可控、回归可追踪。

## 6. API 草案（MVP）

说明：当前主线优先 path 结构能力；`roughness/texture/material` 相关参数先保留接口位，不作为首批必须实现项。

### 6.1 属性分组策略（Playground 同步分组）

核心属性（默认展开，优先调）：

1. `preset`
2. `size`：`width`/`height`/`aspectMode`
3. `corner`
4. `edge`
5. `cutout`
6. `fold`
7. `layers`
8. `seed`

微调属性（高级面板）：

1. `edgeContinuity`
2. `tearDirectionality`
3. `fold` 明暗与倾角
4. `cutoutBoolean`
5. `strokeAlign`
6. `layerBlend`
7. `roughness` / `roughnessMap`（To-do）
8. `stateMorph`（hover/active）
9. `constraints`
10. `exportRecipe`

### 6.2 尺寸解析规则（执行基线）

`size` 在外部 API 保持可选，编译前统一解析为最终像素尺寸：

1. `width` + `height` 都传：使用固定尺寸。
2. 仅传 `width` 或仅传 `height`：按 `aspectMode` 推导另一边。
3. 两者都不传：走 `content-fit`，由内容尺寸 + 内边距解析。
4. 所有尺寸最终进入同一 `resolvedSize`，供 path 编译、humanize、图层渲染复用。
5. seed 派生使用解析后的尺寸，避免动态布局下结果漂移。

```ts
type PaperShapePreset =
  | "stamp"
  | "coupon"
  | "ticket"
  | "receipt"
  | "tag"
  | "bookmark"
  | "torn"
  | "folded";

interface PaperShapeProps {
  preset?: PaperShapePreset;
  width?: number | string;
  height?: number | string;
  aspectMode?: "fixed" | "fluid" | "content-fit";
  seed?: number;
  corner?: { style: "round" | "notch" | "fold"; size: number };
  edge?: { style: "straight" | "wave" | "tear" | "stitch" | "stamp"; amplitude?: number; density?: number; strokeWidth?: number };
  edgeContinuity?: number;
  tearDirectionality?: "x" | "y" | "random";
  cutouts?: Array<{ kind: "circle" | "slot"; x: number; y: number; w?: number; h?: number; r?: number }>;
  cutoutBoolean?: "union" | "subtract" | "intersect";
  fold?: { size?: number; angle?: number; highlight?: number; shadow?: number };
  // To-do: 先占位，后续在手工感模块落地
  roughness?: number;
  roughnessMap?: Array<{ anchor: "top" | "right" | "bottom" | "left"; intensity: number }>;
  humanize?: {
    enabled?: boolean;
    amount?: number; // 0~1
    channels?: {
      edgeJitter?: number;
      cornerWarp?: number;
      cutoutDrift?: number;
      foldSkew?: number;
      strokeVariance?: number;
    };
    edgeMask?: Array<"top" | "right" | "bottom" | "left">;
    preserveCorners?: boolean;
  };
  layers?: {
    fill?: boolean;
    stroke?: boolean;
    shadow?: boolean;
    foldShading?: boolean;
  };
  strokeAlign?: "inner" | "center" | "outer";
  layerBlend?: { mode?: "normal" | "multiply" | "screen" | "overlay"; opacity?: number };
  constraints?: { minEdgePx?: number; minCornerPx?: number; maxRoughness?: number };
  stateMorph?: {
    hover?: Partial<PaperShapeProps>;
    active?: Partial<PaperShapeProps>;
  };
  exportRecipe?: "component" | "jsx" | "svg";
}

interface PaperDecorationLabelProps {
  text: string;
  maxWidth?: number;
  maxLines?: number;
  autoScale?: boolean;
  overflow?: "clip" | "ellipsis";
  align?: "left" | "center" | "right";
  anchor?: { x: number; y: number };
  rotate?: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    letterSpacing?: number;
    lineHeight?: number;
  };
}

interface PaperStackProps {
  pages: Array<PaperShapeProps>;
  offsetStep?: { x: number; y: number };
  jitter?: number;
  depthShadow?: number;
}

interface PaperBookProps {
  cover: {
    frontColor?: string;
    backColor?: string;
    spineWidth?: number;
    cornerRadius?: number;
    texture?: "cloth" | "kraft" | "plain";
  };
  pages: Array<PaperShapeProps>;
  binding?: {
    type?: "thread" | "staple" | "glue";
    density?: number;
    color?: string;
  };
  openRatio?: number; // 0~1，用于书本开合状态
}

interface HumanizeSeedPolicy {
  baseSeed: number;
  // 推荐：hash(recipe + width + height + instanceId)
  derivePerInstance?: boolean;
  instanceId?: string;
}
```

## 7. 风险与规避

1. 风险：形状参数自由度过高导致组合失真。  
   规避：每个 preset 设参数边界与推荐区间。
2. 风险：阴影过重导致性能抖动。  
   规避：默认使用 path 偏移阴影，blur 仅用于少量装饰层。
3. 风险：参数编辑器配置过于复杂。  
   规避：先“预设优先”，高级参数折叠展示。
4. 风险：多页组合导致 DOM/SVG 层数膨胀。  
   规避：组合层设置页数上限、远层降级细节、按需关闭装饰层。
5. 风险：文字标签在异形边缘出现溢出或可读性差。  
   规避：标签区域约束 + 自动缩放 + 最大行数 + 溢出策略（clip/ellipsis）。

## 8. 实施共识

1. `Stack/Book` 作为组合层能力，不并入 `PaperShape` 单页能力。
2. 引入 `PaperComposition`，首批组件包含 `PaperStack` 与 `PaperBook`。
3. `PaperBook` 采用 `BookCover + PaperPages + BookBinding` 三段式结构。
4. `BookCover` 独立建模，不作为普通页面处理。
5. 高级翻页动画先不进入当前主线，先保证静态结构与轻交互质量。
6. 属性面板分为“核心属性 / 微调属性”两组，默认优先核心。
7. Decorations 增加文字标签能力，用于票签/吊牌/标记类场景。
8. 规划按“架构实施顺序”组织，不做版本划分与更新日志。
9. 手工感粗糙度与材质感先进入后续扩展，当前主线先聚焦 path 构造能力。
10. `Recipe` 当前冻结核心字段，预留 `extensions` 扩展位；导出结构包含 `schemaVersion`。
11. 首批 preset 固定为：`stamp/coupon/ticket/receipt/tag/folded/torn`。
12. 导出协议固定为：`Recipe + JSX + SVG`。
13. 参数编辑器首批范围：核心参数 + 导出 + Random；高级参数可折叠或后置。
14. 快照基线矩阵先固定：`7 preset × 3 size × 3 state × 2 seed`。
15. `size` 允许可选；最终统一走尺寸解析规则（见 `6.2`）。
16. Humanize 默认配置基线：
    `amount=0.18`，
    `edgeJitter=0.5`，
    `cornerWarp=0.25`，
    `cutoutDrift=0.15`，
    `foldSkew=0.2`，
    `strokeVariance=0.3`。
17. seed 派生规则基线：`hash(baseSeed + recipe + resolvedWidth + resolvedHeight + instanceId)`。
18. `receipt` 形状定义：默认强调“底边锯齿”，上边与两侧保持较平直；锯齿强度由底边 `edge` 参数控制，优先保证小票识别度。
19. `Paper Shape Hub` 作为汇总入口页必须长期保留，并且与所有子页共享同一导航壳层。
20. 页面结构以“总览 -> 示例库 -> 示例详情 -> 参数编辑器 -> Stack/性能测试”为主线，减少次级入口造成的认知负担。

## 9. 模块清单（按依赖顺序）

1. Path 几何模块：corner/edge/cutout/fold 的可组合 path 生成器。
2. 形状语法模块：Recipe schema、参数边界、冲突解析、fallback 规则。
3. 边缘工艺模块：邮票齿孔、撕纸边、折角、打孔、缝线边等构造器。
4. 组合编排模块：`PaperStack`、`PaperBook`、`BookCover`、`BookBinding`。
5. 装饰与标签模块：装饰锚点、图层混合、文字标签（排版/溢出/安全区）。
6. 导出模块：`Recipe / JSX / SVG` 三种输出形态。
7. 示例与参数编辑器模块：参数面板、随机生成、预设加载、代码复制、场景示例。
8. 质量保障模块：快照矩阵、边界参数测试、性能预算验证。
9. Humanize 模块：seeded noise 通道、约束回写、缓存与低性能降级。

## 10. 后续扩展

1. 手工感与粗糙度高级模型：全局 + 局部 + 方向性噪声。
2. 材质感与厚度模型：纸张纤维、边缘厚度、封面材质与光影策略。
3. Humanize 参数自动推荐：按 preset 自动给出通道权重模板。
