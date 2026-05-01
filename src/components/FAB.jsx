import React, { useState } from 'react';
import Icons from './shared/Icons';

const FAB = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'weight', label: '記錄體重', Icon: Icons.weight },
    { id: 'height', label: '記錄身高', Icon: Icons.ruler },
    { id: 'head', label: '記錄頭圍', Icon: Icons.head },
    { id: 'feeding', label: '記錄餵食', Icon: Icons.feeding },
    { id: 'sleep', label: '記錄睡眠', Icon: Icons.sleep },
    { id: 'milestone', label: '里程碑', Icon: Icons.milestone },
    { id: 'health', label: '健康記錄', Icon: Icons.health }
  ];

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-1.5 bg-black/50 backdrop-blur-xl rounded-xl p-2 border border-white/10 shadow-lg animate-slideInUp">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.id);
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 lg-sm px-3 py-2.5 rounded-lg text-sm text-white/85 hover:bg-white/10 whitespace-nowrap transition-colors"
            >
              <opt.Icon className="w-4 h-4 flex-shrink-0" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 flex items-center justify-center bg-rose text-white shadow-lg transition-all duration-200 active:scale-95 ${
          isOpen ? 'bg-rose-deep rotate-45' : 'hover:bg-rose-deep'
        }`}
      >
        <Icons.add className="w-7 h-7" />
      </button>
    </div>
  );
};

export default FAB;
