import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext';
import { calculateMonthAge, formatAgeDetailed, calculateWeightTrend } from '../../utils/calculations';
import Icons from '../shared/Icons';
import EmptyState from '../shared/EmptyState';

const Home = ({ onOpenQuickRecord }) => {
  const { user, growthRecords, feedingRecords, sleepRecords, milestones, exportData, importData } = useApp();
  const { success, error } = useToast();

  const weightRecords = growthRecords.filter(r => r.type === 'weight');
  const heightRecords = growthRecords.filter(r => r.type === 'height');
  const headRecords = growthRecords.filter(r => r.type === 'headCircumference');

  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const latestHeight = heightRecords.length > 0 ? heightRecords[heightRecords.length - 1] : null;
  const latestHead = headRecords.length > 0 ? headRecords[headRecords.length - 1] : null;

  const ageDisplay = user.birthDate ? formatAgeDetailed(user.birthDate) : '未記錄';

  const lastFeeding = feedingRecords.length > 0
    ? new Date(feedingRecords[feedingRecords.length - 1].date)
    : null;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Hero Section — growth poster style */}
      <div className="px-4 pt-6 pb-8">
        {/* Louise's name as hero — big, bold, central */}
        <h1 className="text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          {user.name}
        </h1>
        <p className="text-white/50 text-lg mb-8 caption">{ageDisplay}</p>

        {/* Stats — integrated poster layout, not card grid */}
        <div className="flex gap-4 mb-6">
          {latestWeight && (
            <div className="flex-1 glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icons.weight className="w-4 h-4 text-white/50" />
                <span className="text-white/50 text-xs caption">體重</span>
              </div>
              <p className="text-3xl font-bold text-white/85">
                {latestWeight.value}<span className="text-sm text-white/50 ml-1">kg</span>
              </p>
            </div>
          )}
          {latestHeight && (
            <div className="flex-1 glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icons.ruler className="w-4 h-4 text-white/50" />
                <span className="text-white/50 text-xs caption">身高</span>
              </div>
              <p className="text-3xl font-bold text-white/85">
                {latestHeight.value}<span className="text-sm text-white/50 ml-1">cm</span>
              </p>
            </div>
          )}
          {latestHead && (
            <div className="flex-1 glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icons.head className="w-4 h-4 text-white/50" />
                <span className="text-white/50 text-xs caption">頭圍</span>
              </div>
              <p className="text-3xl font-bold text-white/85">
                {latestHead.value}<span className="text-sm text-white/50 ml-1">cm</span>
              </p>
            </div>
          )}
        </div>

        {/* If no data yet, show empty state */}
        {!latestWeight && !latestHeight && !latestHead && (
          <EmptyState
            icon="🌱"
            title="開始記錄 Louise 的成長"
            description="添加第一筆數據，查看成長曲線對比"
            actionLabel="添加第一筆記錄"
            onAction={() => onOpenQuickRecord('weight')}
          />
        )}
      </div>

      {/* Recent activity */}
      <div className="px-4 mb-6">
        <div className="glass-card">
          <h3 className="text-white/85 font-bold text-sm mb-3 caption">最近活動</h3>
          {lastFeeding || growthRecords.length > 0 ? (
            <div className="space-y-2 text-sm">
              {lastFeeding && (
                <div className="flex items-center gap-3">
                  <Icons.feeding className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-white/50">最後餵食</span>
                  <span className="text-white/85 ml-auto">{lastFeeding.toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Icons.growth className="w-4 h-4 text-white/50 flex-shrink-0" />
                <span className="text-white/50">總記錄</span>
                <span className="text-white/85 ml-auto">{growthRecords.length} 筆</span>
              </div>
              {milestones.length > 0 && (
                <div className="flex items-center gap-3">
                  <Icons.milestone className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-white/50">里程碑</span>
                  <span className="text-white/85 ml-auto">{milestones.length} 個</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/28 text-sm">還沒有活動記錄</p>
          )}
        </div>
      </div>

      {/* Quick actions — horizontal scroll, not grid */}
      <div className="px-4 mb-6">
        <h3 className="text-white/85 font-bold text-sm mb-3 caption">快速記錄</h3>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { id: 'weight', label: '體重', Icon: Icons.weight },
            { id: 'height', label: '身高', Icon: Icons.ruler },
            { id: 'head', label: '頭圍', Icon: Icons.head },
            { id: 'feeding', label: '餵食', Icon: Icons.feeding },
            { id: 'milestone', label: '里程碑', Icon: Icons.milestone },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onOpenQuickRecord(item.id)}
              className="flex flex-col items-center gap-2 glass-card p-4 min-w-[80px] hover:bg-white/10 transition-all hover:-translate-y-0.5 flex-shrink-0"
            >
              <item.Icon className="w-6 h-6 text-rose" />
              <span className="text-xs text-white/85 caption">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data management */}
      <div className="px-4">
        <div className="pt-4 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={() => {
                exportData();
                success('數據已備份');
              }}
              className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-sm text-white/85 hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              <Icons.backup className="w-4 h-4" />
              備份
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  try {
                    const file = e.target.files?.[0];
                    if (!file) {
                      error('未選擇文件');
                      return;
                    }

                    const reader = new FileReader();

                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result;
                        if (typeof content !== 'string') {
                          error('文件內容無效');
                          return;
                        }

                        const data = JSON.parse(content);

                        if (!data.user || !Array.isArray(data.growthRecords)) {
                          throw new Error('無效的備份文件格式');
                        }

                        if (importData(data)) {
                          success('數據導入成功！');
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          error('數據導入失敗，請檢查文件格式');
                        }
                      } catch (parseError) {
                        console.error('解析JSON失敗:', parseError);
                        error(`導入失敗: ${parseError.message}`);
                      }
                    };

                    reader.onerror = () => {
                      console.error('文件讀取失敗');
                      error('無法讀取文件，請重試');
                    };

                    reader.readAsText(file);
                  } catch (err) {
                    console.error('文件上傳錯誤:', err);
                    error('操作失敗: ' + err.message);
                  }
                };
                input.click();
              }}
              className="flex-1 glass-card p-3 flex items-center justify-center gap-2 text-sm text-white/85 hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              <Icons.restore className="w-4 h-4" />
              恢復
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
