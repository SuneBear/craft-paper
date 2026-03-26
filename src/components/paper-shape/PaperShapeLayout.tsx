import { Outlet } from 'react-router-dom';
import { PaperShapeNav } from './PaperShapeNav';

export function PaperShapeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-4xl font-hand font-bold text-foreground tracking-wide">
            📐 Paper Shape
          </h1>
          <p className="text-muted-foreground font-craft mt-1">
            童趣日式可爱手绘风纸张形状组件系统
          </p>
        </header>
        <PaperShapeNav />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
