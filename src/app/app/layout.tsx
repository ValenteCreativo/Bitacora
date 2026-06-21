import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import QuickCaptureButton from "@/components/layout/QuickCaptureButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — hidden on mobile, fixed left on md+ */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on md+ */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation — visible below md */}
      <MobileNav />

      {/* Quick Capture floating button — accessible from all pages */}
      <QuickCaptureButton />
    </div>
  );
}
