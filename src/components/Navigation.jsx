import React from 'react';
import Icons from './shared/Icons';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const pages = [
    { id: 'home', label: '首頁', Icon: Icons.home },
    { id: 'growth', label: '成長', Icon: Icons.growth },
    { id: 'daily', label: '日常', Icon: Icons.daily },
    { id: 'health', label: '健康', Icon: Icons.health },
    { id: 'memories', label: '回憶', Icon: Icons.memories }
  ];

  return (
    <nav className="lg-nav fixed bottom-0 left-0 right-0 flex justify-around p-2 pb-4 z-40">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => setCurrentPage(page.id)}
          aria-label={page.label}
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all hover:-translate-y-0.5 min-w-[56px] ${
            currentPage === page.id
              ? 'text-rose'
              : 'text-white/50 hover:text-white/85'
          }`}
        >
          <page.Icon className="w-5 h-5 mb-1" />
          <span className="text-[10px]">{page.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
