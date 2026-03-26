import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PaperShapeLayout } from "./components/paper-shape/PaperShapeLayout";
import PaperShapeOverview from "./pages/paper-shape/PaperShapeOverview";
import PaperShapeExamples from "./pages/paper-shape/PaperShapeExamples";
import PaperShapePlayground from "./pages/paper-shape/PaperShapePlayground";
import PaperShapeStack from "./pages/paper-shape/PaperShapeStack";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ui/paper-shape" element={<PaperShapeLayout />}>
            <Route index element={<PaperShapeOverview />} />
            <Route path="examples" element={<PaperShapeExamples />} />
            <Route path="playground" element={<PaperShapePlayground />} />
            <Route path="stack" element={<PaperShapeStack />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
