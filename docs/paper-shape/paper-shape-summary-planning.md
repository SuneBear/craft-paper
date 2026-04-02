# Paper Shape Summary Planning（Prompt + V1 + V2 合并版）

## 1. 文档目的

这是一份可直接交给其他平台实施的总纲文档，整合：

1. `paper-shape-prompt.md`（原始诉求）
2. `paper-shape-planning.md`（V1 架构与页面）
3. `paper-shape-planning-v2.md`（风格重构与验收）
4. 当前落地过程中的关键踩坑与修正

目标：让执行方在不了解本仓库上下文时，也能完整实施一版“童趣日式可爱手绘风”的 PaperShape 系统。

---

## 2. 原始需求摘要（来自 Prompt）

核心诉求：

1. 构建 `PaperShape + PaperPattern + Decorations + Composition` 四层系统。
2. 支持 shape 定制：`corner / edge / roughness / cutout / fold`。
3. 支持示例页 + playground + code generator（组件调用 + 独立 SVG/代码导出）。
4. 风格目标是“手帐风、有手工温度”，避免机械矩形。
5. 需要兼顾响应式、动态内容尺寸、性能。

典型目标形状：

1. 邮票（stamp）
2. 优惠券（coupon）
3. 门票/小票（ticket/receipt）
4. 吊牌/书签（tag/bookmark）
5. 撕纸/折角/叠纸/剪纸边缘/拼贴块/缝线边缘

---

## 3. V1 复盘（为何效果不达标）

V1 的主要问题：

1. 页面功能有了，但 preset 形状识别度不足。
2. 关键语义形状（齿边、打孔、锯齿、折角）不稳定或不明显。
3. 参数可调，但缺少视觉验收基线，导致“能用但不像参考图”。
4. 细节风格偏模板化，童趣日式可爱感不足。

经验结论：

1. 不能只按工程模块推进，必须“形状语义与视觉验收优先”。
2. 必须先定义不可妥协特征，再开发。

---

## 4. V2 核心策略（最终执行方向）

### 4.1 风格方向

1. 童趣
2. 日式可爱
3. 手绘纸张感
4. 真实可用的 UI 组件，不是纯插画

### 4.2 架构方向

1. 单页内核：`PaperShape`
2. 图层协同：`PaperPattern` + `Decorations`
3. 组合层：`Stack/Book`
4. 工具层：`Recipe/JSX/SVG` 导出

### 4.3 实施原则

1. 先做对形状，再扩功能页面。
2. preset 必须有几何规则、禁区规则、验收规则。
3. Random/Humanize 不得破坏 preset 主语义。

---

## 5. 最终页面信息架构

1. `/ui/paper-shape`：总览（介绍 + 导航 + 预览）
2. `/ui/paper-shape/examples`：完整示例库
3. `/ui/paper-shape/examples/[id]`：示例详情（微调 + 导出 + 复制）
4. `/ui/paper-shape/playground`：参数编辑器（含随机按钮）
5. `/ui/paper-shape/stack`：堆叠与书册组合
6. `/ui/paper-shape/performance`：性能测试

导航要求：所有子页面共享同一导航壳层。

---

## 6. 首批 preset 规范（执行版）

首批优先实现：`stamp / coupon / ticket / tag`

第二批补齐：`folded / torn / stitched / scalloped-edge`

并行业务补充：`receipt / basic-paper`

### 6.1 关键语义（不可妥协）

1. `stamp`：四边连续齿边，不能退化为普通圆角矩形。
2. `coupon`：左右半圆孔 + 顶部中缺口，孔位必须对轴。
3. `ticket`：票根切口语义清晰，不能做成 coupon 双孔。
4. `tag`：异形吊牌 + 单孔位，不能无孔。

---

## 7. 视觉 Token 基线

### 7.1 颜色

1. 主基调：奶油中性色 + 甜系浅彩（不是纯暖黄主导）
2. 纸底：奶白/云朵白/浅粉米/浅杏灰（浅牛皮纸仅少量辅助）
3. 描边：柔和棕灰/可可色，避免纯黑硬线
4. 点缀：蜜桃粉/薄荷绿/天空蓝/薰衣草紫/奶橘
5. 推荐占比：`base 60% / sweet accent 30% / contrast 10%`

### 7.2 线条

1. 主轮廓线宽：`1.4 ~ 2.4`
2. 允许轻微不均匀，但不破坏轮廓识别

### 7.3 材质

1. 低强度纸张颗粒
2. 轻渐变提亮层（不重滤镜）

### 7.4 装饰

1. 胶带/图钉/贴纸/缝线可用，但不得遮挡关键形状结构
2. 标签文字需可读（最小字号、最大行数）

---

## 8. Humanize 与 Random 规则

1. seed 可复现
2. 每个 preset 单独约束扰动上限
3. 不可扰动区域（如 coupon 孔位中线）必须锁定
4. Random 必须落在 preset 安全区间内

---

## 9. 可跨平台实施步骤

### 阶段 A：几何基线

1. 实现 `stamp/coupon/ticket/tag` 形状编译
2. 每个 preset 输出：标准图 + 参数区间 + 禁止项
3. 通过对照图验收后再进入下一阶段

### 阶段 B：渲染基线

1. 分层渲染：fill/stroke/shadow/pattern/decorations
2. 输出一致性：页面预览与导出 SVG 一致

### 阶段 C：示例与编辑器

1. 示例列表支持快速复制/导出
2. 示例详情支持微调并展示“不可妥协特征”
3. 参数编辑器支持 Random + 图层控制

### 阶段 D：组合与性能

1. Stack/Book 场景稳定
2. 性能测试矩阵与缓存策略

---

## 10. 验收标准

### 10.1 视觉

1. 肉眼可快速识别 preset
2. 与目标图核心结构一致
3. 风格统一为童趣日式可爱手绘风

### 10.2 几何

1. 关键结构稳定（齿边/孔位/切口/折角）
2. 尺寸变化不破型
3. seed 重现一致

### 10.3 工程

1. 示例库/详情/编辑器/性能页可用
2. 导出能力完整（Recipe/JSX/SVG）

---

## 11. 内置参考摘录（外部文档关键内容）

本节将外部参考的关键机制内置，方便离线实现。

### 11.1 augmented-ui（docs + css）摘录

核心思想：

1. Space Toggle：变量默认空值，启用时切到 `initial`，通过 `var()` fallback 拼装分支。
2. 双层位置模型：每个角/边有 `1/2` 两级（如 `tl1/tl2`, `t1/t2`），支持复合形状。
3. 统一参数维度：`width/height/inset/extend`。
4. 同几何多图层：`core / border / inlay` 复用同一几何坐标。

对本项目的直接要求：

1. 保留四角四边独立参数结构。
2. fill/stroke/inlay 独立控制。
3. 先计算几何，再分层渲染，不要每层各算一套路径。

### 11.2 experience-timeline 参考实现摘录

可复用策略：

1. 边缘 mask 语义：`zigzag / scalloped / wavy`
2. pattern 叠层：pattern 底层 + 轻提亮 overlay
3. 手工感布局：轻随机旋转 + 胶带外贴 + 装饰低透明点缀

### 11.3 craft-ui-spec 摘录

风格基调：

1. 手帐暖色主导，支持主题扩展（蓝/绿/雪白）
2. 中文手写字体体系（标题/正文分层）
3. 不规则线条 + 材质感 + 低透明叠层

---

## 12. 目标图基线（当前直接采用）

1. `docs/paper-shape/images/ui-refs/nano-banana-2-PaperShape-Grid1.png`
2. `docs/paper-shape/images/ui-refs/nano-banana-2-PaperShape-Grid2.png`
3. `docs/paper-shape/images/ui-refs/nano-banana-2-PaperShape-Grid3.png`
4. `docs/paper-shape/images/ui-refs/nano-banana-2-PaperShape-Grid4.png`

如需进一步收敛，可再新增 `targets-v2` 目录。

---

## 13. 交付清单（给外部平台）

1. 本文档：`paper-shape-summary-planning.md`
2. 目标图目录（上述 4 张）
3. preset 规范表（本文第 6 节）
4. 验收标准（本文第 10 节）
5. 内置参考摘录（本文第 11 节）
