import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import EditModal from '../shared/EditModal';
import EmptyState from '../shared/EmptyState';

const Memories = ({ onOpenQuickRecord }) => {
  const { milestones, letters } = useApp();
  const [activeTab, setActiveTab] = useState('milestones');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editType, setEditType] = useState('');

  const MilestonesTab = () => (
    <div className="space-y-4">
      <button
        onClick={() => onOpenQuickRecord('milestone')}
        className="w-full glass-card p-3 text-rose font-bold hover:bg-white/5"
      >
        + 新增里程碑
      </button>
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="還沒有里程碑"
            description="記錄 Louise 的第一次微笑、翻身、走路等重要時刻"
          />
        ) : (
          [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
            <div
              key={m.id}
              className="glass-card p-3 border-l-4 border-rose cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => { setEditingRecord(m); setEditType('milestone'); }}
            >
              <div className="flex gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <h4 className="text-white/85 font-bold">{m.title}</h4>
                  <p className="text-white/28 text-xs">{m.date}</p>
                  {m.note && <p className="text-white/50 text-sm mt-1">{m.note}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const LettersTab = () => (
    <div className="space-y-4">
      <button
        onClick={() => onOpenQuickRecord('letter')}
        className="w-full glass-card p-3 text-rose font-bold hover:bg-white/5"
      >
        ✍️ 寫給 Louise 的信
      </button>
      <div className="space-y-3">
        {letters.length === 0 ? (
          <EmptyState
            icon="💌"
            title="還沒有信件"
            description="寫給 Louise 的信，等她長大後看"
          />
        ) : (
          [...letters].sort((a, b) => new Date(b.date) - new Date(a.date)).map(letter => (
            <div
              key={letter.id}
              className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => { setEditingRecord(letter); setEditType('letter'); }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-white/85 font-bold mb-2">{letter.title}</h4>
                  <p className="text-white/28 text-xs mb-3">{letter.date}</p>
                  <p className="text-white/50 text-sm line-clamp-3">{letter.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto pb-24 p-4">
      <h2 className="text-3xl font-bold text-white/85 mb-4">回憶</h2>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'milestones'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          🎉 里程碑
        </button>
        <button
          onClick={() => setActiveTab('letters')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'letters'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          💌 信件
        </button>
      </div>

      {/* 內容 */}
      {activeTab === 'milestones' ? <MilestonesTab /> : <LettersTab />}

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

export default Memories;
