import React from 'react';

const StatCard = ({ title, value, unit, icon, onClick, trend }) => {
  return (
    <div
      onClick={onClick}
      className="glass-card cursor-pointer hover:scale-[1.02] transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/28 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white/85 mt-1">
            {value}{unit && <span className="text-sm ml-1">{unit}</span>}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.change >= 0 ? 'text-sage' : 'text-coral'}`}>
              {trend.change >= 0 ? '↑' : '↓'} {Math.abs(trend.change).toFixed(2)}{unit} ({trend.percentage}%)
            </p>
          )}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
};

export default StatCard;
