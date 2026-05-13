import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { genId } from '../../utils/id';

const EMOJI_LIST = [
  '😊', '🎉', '👶', '🍼', '👣', '🦷', '🚶', '🗣️', '🎨', '🎵',
  '📚', '🏃', '💤', '🍎', '🐾', '⭐', '💪', '👀', '🤝', '❤️',
  '🌟', '🎈', '🎁', '🌈', '🦋', '🐣', '🎂', '🏆', '💫', '✨'
];

const Memories = () => {
  const { milestones, diaryEntries, addMilestone, deleteMilestone, addDiaryEntry, deleteDiaryEntry } = useApp();
  const [activeTab, setActiveTab] = useState('milestones');

  // 里程碑表單
  const [milestoneForm, setMilestoneForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], emoji: '🎉', note: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 日記表單
  const [diaryForm, setDiaryForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], content: '' });

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!milestoneForm.title || !milestoneForm.date) return;

    addMilestone({
      id: genId(),
      ...milestoneForm,
    });

    setMilestoneForm({ title: '', date: new Date().toISOString().split('T')[0], emoji: '🎉', note: '' });
    setShowEmojiPicker(false);
  };

  const handleAddDiary = (e) => {
    e.preventDefault();
    if (!diaryForm.title || !diaryForm.date || !diaryForm.content) return;

    addDiaryEntry({
      id: genId(),
      ...diaryForm,
    });

    setDiaryForm({ title: '', date: new Date().toISOString().split('T')[0], content: '' });
  };

  const sortedMilestones = [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedDiaries = [...diaryEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '80px' }}>
      <h2 className="section-title">🌟 回憶</h2>

      {/* Tab 切換 */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('milestones')} className={`btn ${activeTab === 'milestones' ? 'btn-blue' : ''}`}>
          🎉 里程碑
        </button>
        <button onClick={() => setActiveTab('diary')} className={`btn ${activeTab === 'diary' ? 'btn-blue' : ''}`}>
          📝 日記
        </button>
      </div>

      {/* ====== 里程碑 Tab (內聯，非內部函數) ====== */}
      {activeTab === 'milestones' && (
        <div className="space-y-5">
          <form onSubmit={handleAddMilestone} className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>🎉 新增里程碑</h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>Emoji</label>
                <div className="relative">
                  <button type="button" className="btn text-2xl" style={{ padding: '8px 16px' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    {milestoneForm.emoji}
                  </button>
                  {showEmojiPicker && (
                    <div className="card" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 10, background: '#fff', boxShadow: 'var(--shadow-lg)' }}>
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJI_LIST.map(emoji => (
                          <button key={emoji} type="button" className="text-2xl p-1 hover:scale-125 transition-transform"
                            onClick={() => { setMilestoneForm(prev => ({ ...prev, emoji })); setShowEmojiPicker(false); }}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>標題</label>
                <input type="text" value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：第一次微笑" required />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>日期</label>
                <input type="date" value={milestoneForm.date}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, date: e.target.value }))} required />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>備註（選填）</label>
                <input type="text" value={milestoneForm.note}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="額外的回憶或感受..." />
              </div>
              <button type="submit" className="btn w-full">✅ 新增里程碑</button>
            </div>
          </form>

          <div>
            <h3 className="section-title">里程碑 ({milestones.length} 個)</h3>
            {sortedMilestones.length === 0 ? (
              <div className="card text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有里程碑，記錄 Louise 的第一次吧！</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '28px' }}>
                {/* 垂直線 */}
                <div style={{
                  position: 'absolute', left: '13px', top: 0, bottom: 0,
                  width: '2px', background: 'var(--muted)', borderRadius: '1px',
                }} />

                <div className="space-y-4">
                  {sortedMilestones.map((m, idx) => (
                    <div key={m.id} style={{ position: 'relative' }} className="animate-in">
                      {/* 時間軸節點 */}
                      <div style={{
                        position: 'absolute', left: '-18px', top: '16px',
                        width: '14px', height: '14px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--accent)' : '#fff',
                        border: `2px solid ${idx === 0 ? 'var(--accent)' : 'var(--fg)'}`,
                        zIndex: 1,
                      }} />

                      {/* 日期標籤 */}
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5,
                        marginBottom: '4px', marginLeft: '0',
                      }}>
                        {new Date(m.date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>

                      {/* 內容卡片 */}
                      <div className="card-sm" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{m.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{m.title}</h4>
                          {m.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.6, marginTop: 2 }}>{m.note}</p>}
                        </div>
                        <button onClick={() => deleteMilestone(m.id)} className="btn-sm" style={{ color: 'var(--accent)', flexShrink: 0 }} title="刪除">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== 日記 Tab (內聯，非內部函數) ====== */}
      {activeTab === 'diary' && (
        <div className="space-y-5">
          <form onSubmit={handleAddDiary} className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>✍️ 寫成長日記</h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>標題</label>
                <input type="text" value={diaryForm.title}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="今天的成長記錄..." required />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>日期</label>
                <input type="date" value={diaryForm.date}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, date: e.target.value }))} required />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>內容</label>
                <textarea value={diaryForm.content}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="今天 Louise 學會了新技能..." rows="4" required style={{ resize: 'none' }} />
              </div>
              <button type="submit" className="btn w-full">✅ 保存日記</button>
            </div>
          </form>

          <div>
            <h3 className="section-title">成長日記 ({diaryEntries.length} 篇)</h3>
            {sortedDiaries.length === 0 ? (
              <div className="card text-center">
                <p className="text-4xl mb-2">📝</p>
                <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有日記，開始記錄每天的成長吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedDiaries.map(entry => (
                  <div key={entry.id} className="card p-4 animate-in">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem' }}>{entry.title}</h4>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.6 }}>{entry.date}</p>
                      </div>
                      <button onClick={() => deleteDiaryEntry(entry.id)} className="btn-sm" style={{ color: 'var(--accent)' }} title="刪除">🗑️</button>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Memories;
