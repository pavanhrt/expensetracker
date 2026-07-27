import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, ListChecks, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/expenses", label: "Expenses", icon: ListChecks, testid: "nav-expenses" },
  { to: "/summary", label: "Summary", icon: Sparkles, testid: "nav-summary" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <header className="border-b border-[#E5E3DB] bg-[#F7F6F3] sticky top-0 z-30" data-testid="app-header">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-baseline gap-2" data-testid="brand-link">
              <span className="font-editorial text-3xl tracking-tight leading-none">Vartā</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#72706A]">Ledger</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map(({ to, label, icon: Icon, testid }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    data-testid={testid}
                    className={`px-4 py-2 rounded-md text-sm hover-lift flex items-center gap-2 ${active ? "bg-[#2C3627] text-[#F7F6F3]" : "text-[#1C1B1A] hover:bg-[#EDEBE4]"}`}
                  >
                    <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#72706A]" data-testid="user-name">{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { logout(); navigate("/login"); }}
              data-testid="logout-btn"
              className="text-[#1C1B1A] hover:bg-[#EDEBE4]"
            >
              <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
              <span className="ml-2 hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        {/* mobile nav */}
        <div className="md:hidden border-t border-[#E5E3DB] flex">
          {nav.map(({ to, label, icon: Icon, testid }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-testid={`m-${testid}`}
                className={`flex-1 py-3 text-center text-xs flex flex-col items-center gap-1 ${active ? "text-[#2C3627] font-semibold" : "text-[#72706A]"}`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">{children}</main>
    </div>
  );
}
