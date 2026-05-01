import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import EditModal from '../shared/EditModal';
import EmptyState from '../shared/EmptyState';

const Daily = ({ onOpenQuickRecord }) => {
  const { feedingRecords, sleepRecords } = useApp();
  const [activeTab, setActiveTab] = useState('feeding');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editType, setEditType] = useState('');

  const FeedingTab = () => (
    <div className="space-y-4">
      <button
        onClick={() => onOpenQuickRecord('feeding')}
        className="w-full glass-card p-3 text-rose font-bold hover:bg-white/5"
      >
        + 新增餵食記錄
      </button>
      <div className="space-y-2">
        {feedingRecords.length === 0 ? (
          <EmptyState
            icon="🍼"
            title="還沒有餵食記錄"
            description="記錄每次餵食的時間和奶量"
          />
        ) : (
          [...feedingRecords].reverse().map(record => (
            <div
              key={record.id}
              className="glass-card p-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => { setEditingRecord(record); setEditType('feeding'); }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white/50">{record.date} {record.time || ''}</span>
                <span className="text-white/85 font-bold">
                  {record.type === 'breastfeeding' ? `${record.duration}分鐘` : record.type === 'formula' ? `${record.amount}ml` : ''}
                </span>
              </div>
              <p className="text-xs text-white/28 mt-1">
                {record.type === 'breastfeeding' ? '母乳' : record.type === 'formula' ? '配方奶' : '副食品'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const SleepTab = () => (
    <div className="space-y-4">
      <button
        onClick={() => onOpenQuickRecord('sleep')}
        className="w-full glass-card p-3 text-rose font-bold hover:bg-white/5"
      >
        + 新增睡眠記錄
      </button>
      <div className="space-y-2">
        {sleepRecords.length === 0 ? (
          <EmptyState
            icon="😴"
            title="還沒有睡眠記錄"
            description="記錄寶寶的睡眠時長和品質"
          />
        ) : (
          [...sleepRecords].reverse().map(record => (
            <div
              key={record.id}
              className="glass-card p-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => { setEditingRecord(record); setEditType('sleep'); }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white/50">{record.date}</span>
                <span className="text-white/85 font-bold">
                  {Math.floor(record.duration / 60)}小時 {record.duration % 60}分
                </span>
              </div>
              <p className="text-xs text-white/28 mt-1">
                品質: {record.quality === 'good' ? '😊 很好' : record.quality === 'normal' ? '😌 正常' : '😣 不佳'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto pb-24 p-4">
      <h2 className="text-3xl font-bold text-white/85 mb-4">日常記錄</h2>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('feeding')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'feeding'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          🍼 餵食
        </button>
        <button
          onClick={() => setActiveTab('sleep')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'sleep'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          😴 睡眠
        </button>
      </div>

      {/* 內容區域 */}
      {activeTab === 'feeding' ? <FeedingTab /> : <SleepTab />}

      {/* 編輯模態 */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          type={editType}
          onClose={() => { setEditingRecord(null); setEditType(''); }}
        />
      )}
    </div>
  );
};

export default Daily;
