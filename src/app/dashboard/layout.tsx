import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto w-full flex gap-8 z-10 relative">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
