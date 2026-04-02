import { Outlet } from 'react-router-dom';
import { PaperShapeNav } from './PaperShapeNav';

export function PaperShapeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-hand font-bold text-foreground tracking-wide">
              ✂️ Craft Paper Shape
            </h1>
            <p className="text-muted-foreground font-craft mt-1">
              童趣可爱手绘风纸张形状组件系统
            </p>
          </div>
          <a
            href="https://github.com/SuneBear/craft-paper"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-craft text-foreground/85 hover:bg-muted/60 transition"
          >
            <span aria-hidden>🔗</span>
            <span>Code · SuneBear/craft-paper</span>
          </a>
        </header>
        <PaperShapeNav />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
