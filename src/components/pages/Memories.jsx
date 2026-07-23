import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { genId } from '../../utils/id';
import { BADGES, calcBadgeStatus, CATEGORY_LABELS } from '../../data/badges';

const EMOJI_LIST = [
  '😊', '🎉', '👶', '🍼', '👣', '🦷', '🚶', '🗣️', '🎨', '🎵',
  '📚', '🏃', '💤', '🍎', '🐾', '⭐', '💪', '👀', '🤝', '❤️',
  '🌟', '🎈', '🎁', '🌈', '🦋', '🐣', '🎂', '🏆', '💫', '✨'
];

const Memories = () => {
  const { user, milestones, diaryEntries, growthRecords, vaccineRecords, sleepRecords, diaperRecords, medications, doctorVisits, addMilestone, deleteMilestone, addDiaryEntry, deleteDiaryEntry } = useApp();
  const [activeTab, setActiveTab] = useState('milestones');
  const [selectedBadge, setSelectedBadge] = useState(null);

  // 計算徽章狀態
  const badges = useMemo(() => calcBadgeStatus({
    user, milestones, diaryEntries, growthRecords, vaccineRecords, sleepRecords, diaperRecords, medications, doctorVisits,
  }), [user, milestones, diaryEntries, growthRecords, vaccineRecords, sleepRecords, diaperRecords, medications, doctorVisits]);

  const unlockedCount = badges.filter(b => b.unlocked).length;

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
    <div className="p-4 space-y-4" style={{ paddingBottom: '100px' }}>
      <h2 className="section-title" style={{ marginBottom: '8px' }}>🌟 回憶與成就</h2>

      {/* 📍 1. 單行三等分 Segmented Control 切換欄 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: 'var(--muted)',
        padding: '4px',
        borderRadius: 'var(--wobbly-sm)',
        border: '2.5px solid var(--fg)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '16px',
      }}>
        <button
          onClick={() => setActiveTab('milestones')}
          style={{
            background: activeTab === 'milestones' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'milestones' ? 'var(--blue)' : 'var(--fg)',
            fontWeight: activeTab === 'milestones' ? 700 : 400,
            border: activeTab === 'milestones' ? '2px solid var(--fg)' : 'none',
            borderRadius: 'var(--wobbly-sm)',
            padding: '8px 0',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'milestones' ? '2px 2px 0px 0px var(--fg)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          🎉 里程碑
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          style={{
            background: activeTab === 'diary' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'diary' ? 'var(--blue)' : 'var(--fg)',
            fontWeight: activeTab === 'diary' ? 700 : 400,
            border: activeTab === 'diary' ? '2px solid var(--fg)' : 'none',
            borderRadius: 'var(--wobbly-sm)',
            padding: '8px 0',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'diary' ? '2px 2px 0px 0px var(--fg)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          📝 日記
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          style={{
            background: activeTab === 'badges' ? 'var(--card-bg)' : 'transparent',
            color: activeTab === 'badges' ? 'var(--blue)' : 'var(--fg)',
            fontWeight: activeTab === 'badges' ? 700 : 400,
            border: activeTab === 'badges' ? '2px solid var(--fg)' : 'none',
            borderRadius: 'var(--wobbly-sm)',
            padding: '8px 0',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'badges' ? '2px 2px 0px 0px var(--fg)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          🏆 徽章 ({unlockedCount}/{badges.length})
        </button>
      </div>

      {/* ====== 里程碑 Tab ====== */}
      {activeTab === 'milestones' && (
        <div className="space-y-5">
          <form onSubmit={handleAddMilestone} className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 12 }}>🎉 新增里程碑</h3>
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

                      {/* 📍 5. 時間軸拉開 12px 間距 & 內容卡片 */}
                      <div style={{ marginLeft: '12px' }}>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: '0.78rem', opacity: 0.6,
                          marginBottom: '4px',
                        }}>
                          {new Date(m.date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        <div className="card-sm" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{m.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700 }}>{m.title}</h4>
                            {m.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7, marginTop: 2 }}>{m.note}</p>}
                          </div>
                          {/* 📍 7. 刪除二次確認 */}
                          <button
                            onClick={() => {
                              if (window.confirm(`確定要刪除里程碑「${m.title}」嗎？此操作無法撤銷。`)) {
                                deleteMilestone(m.id);
                              }
                            }}
                            className="btn-sm"
                            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}
                            title="刪除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== 日記 Tab ====== */}
      {activeTab === 'diary' && (
        <div className="space-y-5">
          <form onSubmit={handleAddDiary} className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 12 }}>✍️ 寫成長日記</h3>
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
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem' }}>{entry.title}</h4>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.6 }}>{entry.date}</p>
                      </div>
                      {/* 📍 7. 刪除二次確認 */}
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除日記「${entry.title}」嗎？此操作無法撤銷。`)) {
                            deleteDiaryEntry(entry.id);
                          }
                        }}
                        className="btn-sm"
                        style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== 徽章 Tab ====== */}
      {activeTab === 'badges' && (
        <div className="space-y-5">
          {/* 進度卡片 */}
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 4 }}>🏆</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
              成就進度
            </h3>
            <p style={{ fontFamily: 'var(--font-number)', fontSize: '2rem', fontWeight: 600, color: 'var(--accent)', marginTop: 4 }}>
              {unlockedCount} <span style={{ fontSize: '1rem', opacity: 0.6 }}>/ {badges.length}</span>
            </p>
            <div style={{ background: 'var(--muted)', borderRadius: '20px', height: '12px', overflow: 'hidden', marginTop: 8, border: '2px solid var(--fg)' }}>
              <div style={{
                background: 'linear-gradient(90deg, var(--accent), #ff8c66)',
                height: '100%',
                width: `${(unlockedCount / badges.length) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7, marginTop: 6 }}>
              {unlockedCount === 0 ? '還沒有徽章，繼續加油！' :
               unlockedCount === badges.length ? '🎊 所有徽章都收集到了！' :
               `已解鎖 ${Math.round(unlockedCount / badges.length * 100)}% 的成就`}
            </p>
          </div>

          {/* 分類顯示徽章 */}
          {Object.keys(CATEGORY_LABELS).map(category => {
            const categoryBadges = badges.filter(b => b.category === category);
            if (categoryBadges.length === 0) return null;
            const categoryUnlocked = categoryBadges.filter(b => b.unlocked).length;

            return (
              <div key={category}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 400 }}>
                    {categoryUnlocked}/{categoryBadges.length}
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {categoryBadges.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBadge(b)}
                      className={`badge-card ${b.unlocked ? 'unlocked' : 'locked'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="badge-emoji">{b.emoji}</div>
                      {/* 📍 2. 增強未解鎖徽章的文字對比度 */}
                      <div className="badge-title" style={{ color: 'var(--fg)', opacity: b.unlocked ? 1 : 0.9 }}>
                        {b.title}
                      </div>
                      <div className="badge-desc" style={{ color: 'var(--fg)', opacity: b.unlocked ? 0.75 : 0.65 }}>
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📍 3. 點擊徽章跳出 Popover 顯示【解鎖進度條與說明】 */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="card animate-in"
            style={{
              width: '100%',
              maxWidth: '360px',
              textAlign: 'center',
              padding: '20px',
              background: 'var(--card-bg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3.2rem', marginBottom: 4 }}>{selectedBadge.emoji}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
              {selectedBadge.title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.7, marginTop: 2 }}>
              {selectedBadge.description}
            </p>

            <div style={{ marginTop: 14, padding: '12px', background: 'var(--bg)', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--fg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 4 }}>
                <span>{selectedBadge.unlocked ? '🎉 已達成成就' : '🔒 解鎖進度'}</span>
                <span>{selectedBadge.progress?.percent || 0}%</span>
              </div>
              <div style={{ background: 'var(--muted)', height: '10px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--fg)' }}>
                <div style={{
                  height: '100%',
                  width: `${selectedBadge.progress?.percent || 0}%`,
                  background: selectedBadge.unlocked ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, var(--blue), #60a5fa)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', marginTop: 8, color: selectedBadge.unlocked ? '#10b981' : 'var(--fg)', fontWeight: selectedBadge.unlocked ? 700 : 400 }}>
                {selectedBadge.progress?.remainingText || (selectedBadge.unlocked ? '已成功解鎖此徽章！' : '尚未滿足解鎖條件')}
              </p>
            </div>

            <button
              className="btn btn-sm w-full"
              style={{ marginTop: 16 }}
              onClick={() => setSelectedBadge(null)}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memories;
