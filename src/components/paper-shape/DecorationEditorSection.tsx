import { decorationCatalog, type DecorationType } from './decorations';

interface DecorationEditorSectionProps {
  activeType: DecorationType;
  onChangeType: (type: DecorationType) => void;
  onAdd: (type: DecorationType, variant: string) => void;
  count: number;
  onClear?: () => void;
}

export function DecorationEditorSection({
  activeType,
  onChangeType,
  onAdd,
  count,
  onClear,
}: DecorationEditorSectionProps) {
  const activeCategory = decorationCatalog.find((c) => c.type === activeType) ?? decorationCatalog[0];

  return (
    <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between">
        <label className="text-xs font-craft font-semibold text-foreground block">🎨 装饰元素</label>
        {count > 0 && onClear && (
          <button onClick={onClear} className="text-[10px] font-craft text-destructive hover:underline">
            清空全部
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {decorationCatalog.map((cat) => (
          <button
            key={cat.type}
            onClick={() => onChangeType(cat.type)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-craft transition ${
              activeType === cat.type
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {activeCategory.variants.map((v) => (
          <button
            key={v.key}
            onClick={() => onAdd(activeType, v.key)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-craft bg-background text-foreground border border-border hover:border-primary hover:bg-primary/5 transition"
            title={`添加 ${v.label}`}
          >
            + {v.label}
          </button>
        ))}
      </div>

      {count > 0 && (
        <p className="text-[10px] text-muted-foreground font-craft">
          已添加 {count} 个装饰
        </p>
      )}
    </div>
  );
}

