import { PaperShape } from '@/components/paper-shape/PaperShape';
import { PosterTitle } from '@/components/paper-shape/PosterTitle';
import { useMemo, useState } from 'react';

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  note: string;
}

type MapMode = 'terrain' | 'satellite' | 'night';

const travelTabs = [
  { key: 'plan', label: '行程表' },
  { key: 'journal', label: '游记' },
  { key: 'packing', label: '打包清单' },
] as const;

const panelContent = {
  plan: [
    '08:20 抵达黄山北站，乘景区巴士进山。',
    '10:10 云谷索道上山，先走始信峰，再去黑虎松。',
    '13:00 西海大峡谷午后徒步，拍云海延时。',
    '18:30 回汤口镇，夜市吃毛豆腐和笋干烧肉。',
  ],
  journal: [
    '今天的风比预报里更温柔，山路拐角处全是湿润的松香。',
    '中午雾层突然被掀开，远处山脊像层层折纸。',
    '傍晚回到镇上，把车票和叶片贴在手帐里，刚好拼出一页。',
  ],
  packing: [
    '轻量冲锋衣 + 速干内搭',
    '便携雨披、保温杯、头灯',
    '创可贴、止痛贴、一次性毛巾',
    '相机电池 2 块 + 储存卡 1 张',
  ],
} as const;

const initialTodos: TodoItem[] = [
  { id: 'todo-1', title: '订往返高铁', done: true, note: '已锁定 4 月 18 日去程' },
  { id: 'todo-2', title: '酒店续住确认', done: false, note: '再确认是否可延迟退房' },
  { id: 'todo-3', title: '准备徒步补给', done: false, note: '能量胶、坚果、水盐片' },
  { id: 'todo-4', title: '整理相机参数预设', done: true, note: '日出和夜景各一套' },
];

const mapModeOptions: Array<{
  key: MapMode;
  label: string;
  emoji: string;
  gradient: string;
  desc: string;
}> = [
  {
    key: 'terrain',
    label: '地形',
    emoji: '🗺️',
    gradient: 'bg-[linear-gradient(130deg,#f5eec8_0%,#f1dcb6_48%,#d7e8d3_100%)]',
    desc: '突出山脊和高差，适合徒步规划。',
  },
  {
    key: 'satellite',
    label: '卫星',
    emoji: '🛰️',
    gradient: 'bg-[linear-gradient(130deg,#cfd8cf_0%,#a8c0ad_45%,#8da6a1_100%)]',
    desc: '查看林线和云层，便于判断观景位。',
  },
  {
    key: 'night',
    label: '夜景',
    emoji: '🌙',
    gradient: 'bg-[linear-gradient(130deg,#cdd6f3_0%,#a4b3d8_50%,#7a89b4_100%)]',
    desc: '强化夜间路线与回撤路径。',
  },
];

const menuEntries = [
  { title: '路线总览', note: '今日步行约 9.4km', emoji: '🧭' },
  { title: '站点清单', note: '补给点 4 / 观景点 6', emoji: '📍' },
  { title: '预算分配', note: '交通 42% · 食宿 38%', emoji: '💸' },
  { title: '天气窗口', note: '13:00-16:00 云层最薄', emoji: '⛅' },
  { title: '离线地图', note: '已缓存 3 个片区', emoji: '📡' },
] as const;

function getActiveTabPreset(tab: (typeof travelTabs)[number]['key']) {
  if (tab === 'plan') return 'basic-paper' as const;
  if (tab === 'journal') return 'torn' as const;
  return 'folded' as const;
}

export default function PaperShapeContainers() {
  const [activeTab, setActiveTab] = useState<(typeof travelTabs)[number]['key']>('journal');
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [menuOpen, setMenuOpen] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>('terrain');
  const [saveVersion, setSaveVersion] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const progress = useMemo(() => {
    const done = todos.filter((item) => item.done).length;
    return Math.round((done / todos.length) * 100);
  }, [todos]);

  const activeMapMode = useMemo(
    () => mapModeOptions.find((mode) => mode.key === mapMode) ?? mapModeOptions[0],
    [mapMode]
  );

  const handleSavePlan = () => {
    const now = new Date();
    const timeText = now.toLocaleTimeString('zh-CN', { hour12: false });
    setSaveVersion((prev) => prev + 1);
    setSavedAt(timeText);
  };

  const handleToggleMapMode = () => {
    const idx = mapModeOptions.findIndex((mode) => mode.key === mapMode);
    const nextIdx = (idx + 1) % mapModeOptions.length;
    setMapMode(mapModeOptions[nextIdx].key);
  };

  const activePanel = panelContent[activeTab];

  return (
    <div className="space-y-8 pb-4">
      <section>
        <PaperShape
          layoutMode="fill"
          contentAlign="start"
          preset="basic-paper"
          paperColor="cloud"
          className="w-full"
          minHeight={210}
          contentPadding={{ x: 18, y: 16 }}
          presetParams={{
            cornerRadius: 16,
            edgeWobble: 1.8,
            edgeWobbleBottom: 2.2,
            edgeWobbleTop: 1.4,
            shadowOpacity: 0.14,
          }}
        >
          <div className="w-full space-y-4">
            <div >
              <p className="font-craft text-xs uppercase tracking-[0.2em] text-muted-foreground">Paper Shape Container Lab</p>
              <PosterTitle
                className="mt-1"
                align="left"
                kicker="容器示例："
                quote={true}
                lines={[
                  {
                    size: 'lg',
                    tokens: [
                      { text: '' },
                      { text: 'PaperShape', highlight: true, highlightStyle: 'lower', rotate: -0.6 },
                      { text: ' 手账拼贴页' },
                    ],
                  },
                ]}
                emojis={[
                  { value: '✨', x: 96, y: 164, size: 16, rotate: 10 },
                ]}
                symbols={[
                  { kind: 'dash', x: 22, y: 88, size: 20, rotate: -3, opacity: 0.45 },
                ]}
              />
              <p className="mt-3 max-w-3xl font-craft text-sm leading-relaxed text-muted-foreground">
                这个页面重点验证三件事：一是内容驱动的自适应尺寸；二是不同语义组件（button/card/menu/tab/article/control）的承载能力；
                三是容器可嵌套，且内容自动避让切角、打孔、撕边等安全区。
              </p>
            </div>

            <PaperShape
              layoutMode="fill"
              contentAlign="start"
              preset="basic-paper"
              paperColor="cream"
              className="w-full"
              contentPadding={{ x: 12, y: 10 }}
              presetParams={{
                cornerRadius: 12,
                edgeWobble: 2.2,
                edgeWobbleTop: 1.6,
                edgeWobbleBottom: 2.4,
                shadowOpacity: 0.12,
              }}
            >
              <p className="w-full font-craft text-xs leading-relaxed text-amber-900/90">
                ⚠️ 实验性说明：当前容器方案仍有不少边界问题（布局、间距、嵌套一致性等），这里只是非常初步的尝试。
                后续会做重大调整，参数与行为可能变化，请勿将本页能力视为稳定 API。
              </p>
            </PaperShape>
          </div>
        </PaperShape>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <PaperShape
                onClick={handleSavePlan}
                layoutMode="content"
                preset="folded"
                seed={22}
                paperColor="apricot"
                className="cursor-pointer select-none transition duration-150 hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0 active:brightness-[0.97]"
                contentPadding={8}
                minWidth={160}
                minHeight={56}
                presetParams={{
                  foldCorners: 2,
                  foldSize: 18,
                  edgeWobble: 1.05,
                  shadowOpacity: 0.26,
                  shadowOffsetY: 2,
                }}
              >
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-craft text-sm font-medium text-foreground/90">
                  <span>保存行程</span>
                  <span className="text-xs opacity-70">⌘S</span>
                </div>
              </PaperShape>

              <PaperShape
                onClick={handleToggleMapMode}
                layoutMode="content"
                preset="tag"
                seed={43}
                paperColor="mint"
                className="cursor-pointer select-none transition duration-150 hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0 active:brightness-[0.97]"
                contentPadding={{ x: 8, top: 10, bottom: 6 }}
                minWidth={190}
                minHeight={56}
                presetParams={{
                  holeRadius: 7,
                  cornerRadius: 12,
                  edgeWobble: 0.75,
                  shadowOpacity: 0.24,
                  shadowOffsetY: 2,
                }}
              >
                <div className="mt-0.5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-craft text-sm font-medium text-foreground/90">
                  <span>地图模式：{activeMapMode.label}</span>
                  <span aria-hidden>{activeMapMode.emoji}</span>
                </div>
              </PaperShape>
            </div>
            <p className="px-1 font-craft text-xs text-muted-foreground">
              {savedAt ? `已保存 v${saveVersion} · ${savedAt}` : '尚未保存最新更改'}
            </p>
          </div>

          <PaperShape
            layoutMode="fill"
            contentAlign="start"
            preset="stamp"
            seed={68}
            paperColor="cloud"
            className="w-full"
            minHeight={188}
            maxWidth={760}
            contentPadding={{ x: 14, y: 12, bottom: 24 }}
            presetParams={{ perforationRadius: 8.8, stampArcDirection: 1, edgeWobble: 0.8 }}
          >
            <article className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <p className="font-craft text-xs uppercase tracking-[0.18em] text-muted-foreground">Article Card · 旅行速记</p>
                <PosterTitle
                  className="!h-auto"
                  align="left"
                  quote={false}
                  adaptive={false}
                  lines={[
                    {
                      size: 'lg',
                      tokens: [
                        { text: '黄山' },
                        { text: '两日慢游', highlight: true, highlightStyle: 'lower', rotate: -0.8 },
                        { text: '手记' },
                      ],
                    },
                  ]}
                  emojis={[{ value: '🧷', x: 94, y: 18, size: 15, rotate: 8 }]}
                  symbols={[{ kind: 'dash', x: 22, y: 84, size: 22, rotate: -4, opacity: 0.44 }]}
                />
                <p className="font-craft text-sm leading-relaxed text-foreground/85">
                  早晨从云谷索道上山，午后钻进西海大峡谷。雾气把山体切成一层层纸片，
                  每走一步都像翻下一页折叠的地图。
                </p>
                <p className="font-craft text-xs text-muted-foreground">
                  当前地图：{activeMapMode.label} {activeMapMode.desc}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 !mb-4">
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-craft text-[11px] text-foreground/75">#云海窗口</span>
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-craft text-[11px] text-foreground/75">#石阶缓行</span>
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-craft text-[11px] text-foreground/75">#胶片色温</span>
                </div>
              </div>
              <div className={`h-20 w-full rounded-2xl border border-foreground/15 sm:w-44 ${activeMapMode.gradient}`} />
            </article>
          </PaperShape>

          <PaperShape
            layoutMode="fill"
            contentAlign="start"
            preset="receipt"
            seed={97}
            paperColor="peach"
            className="w-full"
            minHeight={176}
            maxWidth={760}
            contentPadding={12}
            presetParams={{
              zigzagHeight: 8,
              zigzagEdge: 4,
              edgeWobble: 1.2,
              edgeWobbleTop: 0.9,
              edgeWobbleBottom: 1.8,
            }}
          >
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-hand text-2xl text-foreground">待办控制台 ✍️</h3>
                <span className="rounded-full bg-foreground/10 px-2.5 py-1 font-craft text-xs text-foreground/75">完成度 {progress}%</span>
              </div>
              <div className="space-y-2">
                {todos.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTodos((prev) => prev.map((todo) => (
                        todo.id === item.id ? { ...todo, done: !todo.done } : todo
                      )));
                    }}
                    className="flex w-full items-start gap-3 rounded-xl border border-foreground/10 bg-background/45 px-3 py-2 text-left transition hover:bg-background/70"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.35rem] border text-[11px] font-bold leading-none transition ${
                        item.done
                          ? 'border-foreground/45 bg-foreground/85 text-background shadow-[0_1px_0_rgba(0,0,0,0.18)]'
                          : 'border-foreground/28 bg-background/85 text-transparent'
                      }`}
                    >
                      {item.done ? '✓' : ''}
                    </span>
                    <span>
                      <span className={`block font-craft text-sm ${item.done ? 'text-foreground/55 line-through' : 'text-foreground/88'}`}>{item.title}</span>
                      <span className="block font-craft text-xs text-muted-foreground">{item.note}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </PaperShape>
        </div>

        <div className="space-y-5">
          <PaperShape
            layoutMode="fill"
            contentAlign="start"
            preset="stitched"
            seed={71}
            paperColor="lavender"
            className="w-full"
            minHeight={146}
            maxWidth={620}
            contentPadding={{ x: 20, y: 20, bottom: 32 }}
            presetParams={{ stitchStyle: 3, stitchWidth: 1.4, edgeWobble: 0.55 }}
          >
            <div className="w-full space-y-0">
              <div className="flex flex-wrap gap-2">
                {travelTabs.map((tab) => (
                  <PaperShape
                    key={tab.key}
                    layoutMode="content"
                    preset="basic-paper"
                    seed={tab.key.length * 29}
                    paperColor={tab.key === activeTab ? 'cream' : 'cloud'}
                    minWidth={88}
                    minHeight={42}
                    contentPadding={6}
                    presetParams={tab.key === activeTab
                      ? {
                        cornerRadius: 12,
                        edgeWobble: 0.95,
                        shadowOpacity: 0.24,
                        shadowOffsetY: 2,
                      }
                      : {
                        cornerRadius: 10,
                        edgeWobble: 0.55,
                        shadowOpacity: 0.12,
                        shadowOffsetY: 1,
                      }}
                  >
                    <button
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-full px-3 py-1 font-craft text-xs transition ${tab.key === activeTab ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'}`}
                    >
                      {tab.label}
                    </button>
                  </PaperShape>
                ))}
              </div>

              <PaperShape
                layoutMode="fill"
                contentAlign="start"
                preset={getActiveTabPreset(activeTab)}
                seed={activeTab.length * 17 + 9}
                paperColor="cloud"
                className="w-full -mt-1"
                minHeight={150}
                contentPadding={12}
                presetParams={{ edgeWobble: 1.15, edgeWobbleBottom: 1.5, cornerRadius: 11 }}
              >
                <div className="w-full space-y-2">
                  <p className="font-craft text-xs uppercase tracking-[0.16em] text-muted-foreground">Tab Panel · 手帐页签</p>
                  <div className="space-y-2 font-craft text-sm leading-relaxed text-foreground/85">
                    {activePanel.map((line, idx) => (
                      <p key={idx}>
                        <span className="mr-1.5 text-xs opacity-70">{idx % 2 === 0 ? '✧' : '•'}</span>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </PaperShape>
            </div>
          </PaperShape>

          <PaperShape
            layoutMode="fill"
            contentAlign="start"
            preset="scalloped-edge"
            seed={133}
            paperColor="cream"
            className="w-full"
            minHeight={menuOpen ? 204 : 108}
            maxWidth={620}
            contentPadding={12}
            presetParams={{ scallopRadius: 10, scallopDepth: 8, scallopGap: 20, edgeWobble: 0.6 }}
          >
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-hand text-2xl text-foreground">菜单容器 🧭</h3>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-lg bg-foreground/10 px-2 py-1 font-craft text-xs text-foreground/80 hover:bg-foreground/15"
                >
                  {menuOpen ? '收起' : '展开'}
                </button>
              </div>

              {menuOpen && (
                <nav className="grid gap-2">
                  {menuEntries.map((item) => {
                    const isStationItem = item.title === '站点清单';
                    return (
                      <button
                        key={item.title}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                          isStationItem
                            ? 'border-foreground/30 bg-[linear-gradient(135deg,rgba(121,95,71,0.18)_0%,rgba(121,95,71,0.09)_100%)] text-foreground shadow-[0_2px_0_rgba(60,45,35,0.18)]'
                            : 'border-foreground/10 bg-background/35 text-foreground/85 hover:bg-background/62 hover:border-foreground/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`font-craft text-sm font-semibold ${isStationItem ? 'tracking-[0.03em]' : ''}`}>
                            {item.title}
                          </span>
                          <span className="text-sm opacity-90" aria-hidden>{isStationItem ? '📌' : item.emoji}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="font-craft text-[11px] text-foreground/62">{item.note}</p>
                          {isStationItem && (
                            <span className="rounded-full bg-foreground/12 px-1.5 py-0.5 font-craft text-[10px] text-foreground/72">
                              当前查看
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          </PaperShape>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-hand text-2xl text-foreground">嵌套容器组合</h3>
        <PaperShape
          layoutMode="fill"
          contentAlign="start"
          preset="scalloped-edge"
          seed={212}
          paperColor="sky"
          className="w-full"
          maxWidth={1100}
          contentPadding={16}
          presetParams={{ cornerRadius: 16, edgeWobble: 1.4, edgeWobbleBottom: 1.9 }}
        >
          <div className="w-full grid gap-4 sm:grid-cols-2">
            <PaperShape
              layoutMode="fill"
              contentAlign="start"
              preset="tag"
              seed={219}
              paperColor="cloud"
              minHeight={150}
              contentPadding={13}
              contentClassName="pt-1"
              presetParams={{ holeRadius: 8, cornerRadius: 10 }}
            >
              <div className="space-y-2">
                <p className="font-craft text-xs uppercase tracking-[0.18em] text-muted-foreground mt-6">Nested: Weather</p>
                <p className="font-hand text-2xl text-foreground">多云 17°C</p>
                <p className="font-craft text-sm text-foreground/80">下午 3 点后有短时阵雨，建议先走高海拔线路。</p>
              </div>
            </PaperShape>

            <PaperShape
              layoutMode="fill"
              contentAlign="start"
              preset="folded"
              seed={236}
              paperColor="apricot"
              className="sm:w-[calc(100%-14px)] sm:justify-self-end"
              minHeight={150}
              contentPadding={10}
              presetParams={{ foldCorners: 10, foldSize: 16, edgeWobble: 1.2 }}
            >
              <div className="space-y-2">
                <p className="font-craft text-xs uppercase tracking-[0.18em] text-muted-foreground">Nested: Budget</p>
                <p className="font-hand text-2xl text-foreground">¥ 1,320 / ¥ 1,800</p>
                <div className="h-2 rounded-full bg-foreground/12">
                  <div className="h-full w-[73%] rounded-full bg-foreground/55" />
                </div>
                <p className="font-craft text-xs text-foreground/75">住宿和交通已确认，餐饮预算保留弹性。</p>
              </div>
            </PaperShape>
          </div>
        </PaperShape>
      </section>
    </div>
  );
}
