import React from 'react';
import { FilePlus2, FileSpreadsheet, Users, Settings } from 'lucide-react';

export type NavTab = 'tambah' | 'rekap' | 'pelanggan' | 'pengaturan';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'tambah' as NavTab, label: 'Tambah Surat', icon: FilePlus2 },
    { id: 'rekap' as NavTab, label: 'Rekap Surat', icon: FileSpreadsheet },
    { id: 'pelanggan' as NavTab, label: 'Data Pelanggan', icon: Users },
    { id: 'pengaturan' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-15 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-150 select-none ${
                isActive
                  ? 'text-[#0b223d]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100/90 text-blue-900 shadow-xs scale-105'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none ${
                  isActive ? 'font-bold text-[#0b223d]' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
