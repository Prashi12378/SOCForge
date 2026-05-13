import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, Image as ImageIcon, Settings, Globe, PieChart } from 'lucide-react';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Data', path: '/upload', icon: UploadCloud },
    { name: 'OSINT Triage', path: '/osint', icon: Globe },
    { name: 'Graph Builder', path: '/graph-builder', icon: PieChart },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Evidence', path: '/evidence', icon: ImageIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-cyber-bg text-cyber-text overflow-hidden print:h-auto print:overflow-visible print:block">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center justify-center border-b border-cyber-border/50">
          <h1 className="text-2xl font-black text-cyber-primary tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">SOCForge</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-3 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                      isActive
                        ? 'bg-cyber-primary/15 text-cyber-primary shadow-[inset_0_0_20px_rgba(0,240,255,0.1)] border border-cyber-primary/30'
                        : 'text-cyber-muted hover:bg-cyber-border/40 hover:text-cyber-text border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyber-primary shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                    )}
                    <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : ''}`} />
                    <span className="font-semibold tracking-wide">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-5 border-t border-cyber-border/50 bg-black/20">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-cyber-bg border-2 border-cyber-border group-hover:border-cyber-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors">
              <span className="font-bold text-cyber-primary text-lg">A</span>
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide text-cyber-text group-hover:text-cyber-primary transition-colors">Analyst User</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                <p className="text-xs font-medium text-cyber-muted">Offline Mode</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible print:h-auto">
        <header className="h-16 flex-shrink-0 glass-panel border-b border-cyber-border/50 border-x-0 border-t-0 flex items-center px-8 z-10 sticky top-0 print:hidden">
          <h2 className="text-xl font-bold tracking-wide capitalize text-cyber-text drop-shadow-md">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8 z-10 print:overflow-visible print:h-auto print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
