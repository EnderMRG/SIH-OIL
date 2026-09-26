import { HeaderBar } from "@/components/HeaderBar";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <HeaderBar />
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
