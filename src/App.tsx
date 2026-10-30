import { Toaster } from "@/components/ui/sonner";
import { AppRouter } from "@/app/routes/AppRouter";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <TooltipProvider delay={0}>
      <AppRouter />

      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
