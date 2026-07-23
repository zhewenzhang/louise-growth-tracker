import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatDueDate } from '../../data/vaccines';

const VaccinePanel = () => {
  const { vaccineRecords, toggleVaccine, addCustomVaccine, updateVaccine, updateVaccineDate, deleteVaccine, user } = useApp();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [editDose, setEditDose] = useState('');
  const [vaccineSubTab, setVaccineSubTab] = useState('todo'); // 'todo' | 'done'
  const [customForm, setCustomForm] = useState({ name: '', dose: '1劑', ageMonths: '', dueDate: '' });

  const ageMonths = useMemo(() => {
    if (!user?.birthDate) return 0;
    const now = new Date();
    const birth = new Date(user.birthDate);
    const days = (now - birth) / (1000 * 60 * 60 * 24);
    return days / 30.44;
  }, [user?.birthDate]);

  const alerts = useMemo(() => {
    const overdue = [];
    const upcoming = [];
    const todayStr = new Date().toISOString().split('T')[0];
    for (const v of vaccineRecords) {
      if (v.completed) continue;
      let isOverdue;
      if (v.dueDate) {
        isOverdue = v.dueDate < todayStr;
      } else {
        isOverdue = v.ageMonths !== undefined && ageMonths >= v.ageMonths;
      }
      if (isOverdue) {
        overdue.push({ ...v, overdue: true });
      } else {
        upcoming.push({ ...v, upcoming: true });
      }
    }
    const sortKey = (v) => v.dueDate || '9999-12-31';
    upcoming.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    
    const limitDateStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 45);
      return d.toISOString().split('T')[0];
    })();
    
    const upcomingFiltered = upcoming.filter(v => {
      if (!v.dueDate) return true;
      return v.dueDate <= limitDateStr;
    });

    const displayUpcoming = upcomingFiltered.length >= 5 ? upcomingFiltered : upcoming.slice(0, 5);
    return [...overdue, ...displayUpcoming];
  }, [vaccineRecords, ageMonths]);

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customForm.name) return;
    addCustomVaccine({
      name: customForm.name,
      dose: customForm.dose,
      ageMonths: parseInt(customForm.ageMonths) || 0,
      recommendedAge: customForm.ageMonths ? `滿${customForm.ageMonths}個月` : '自訂',
      dueDate: customForm.dueDate,
    });
    setCustomForm({ name: '', dose: '1劑', ageMonths: '', dueDate: '' });
    setShowCustomForm(false);
  };

  const incomplete = vaccineRecords.filter(v => !v.completed);
  const completed = vaccineRecords.filter(v => v.completed);

  return (
    <>
      {/* 自定義疫苗按鈕 */}
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-sm" onClick={() => setShowCustomForm(!showCustomForm)}>
          {showCustomForm ? '✕ 取消' : '＋ 新增自定義疫苗'}
        </button>
      </div>

      {/* 自定義疫苗表單 */}
      {showCustomForm && (
        <form onSubmit={handleAddCustom} className="card" style={{ marginBottom: '12px' }}>
          <div className="space-y-2">
            <input type="text" value={customForm.name}
              onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="疫苗名稱（如：腸病毒疫苗）" required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={customForm.dose}
                onChange={e => setCustomForm(prev => ({ ...prev, dose: e.target.value }))}
                placeholder="劑次（如：第1劑）" style={{ flex: 1 }} />
              <input type="number" value={customForm.ageMonths}
                onChange={e => setCustomForm(prev => ({ ...prev, ageMonths: e.target.value }))}
                placeholder="建議月齡" style={{ flex: 1 }} />
            </div>
            <input type="date" value={customForm.dueDate}
              onChange={e => setCustomForm(prev => ({ ...prev, dueDate: e.target.value }))}
              placeholder="預計接種日期" />
            <button type="submit" className="btn w-full btn-blue">✅ 儲存自定義疫苗</button>
          </div>
        </form>
      )}

      {/* 待接種 / 已完成 切換 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => setVaccineSubTab('todo')}
          className={`btn-sm ${vaccineSubTab === 'todo' ? 'btn-blue' : ''}`}
          style={{ flex: 1 }}
        >
          ⏳ 待接種 ({incomplete.length})
        </button>
        <button
          onClick={() => setVaccineSubTab('done')}
          className={`btn-sm ${vaccineSubTab === 'done' ? 'btn-blue' : ''}`}
          style={{ flex: 1 }}
        >
          ✅ 已完成 ({completed.length})
        </button>
      </div>

      {/* 疫苗清單 */}
      <div className="space-y-2">
        {(vaccineSubTab === 'todo' ? incomplete : completed).map(vaccine => {
          const todayStr = new Date().toISOString().split('T')[0];
          const limitDateStr = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
          
          let isOverdue = false;
          let isUpcoming = false;
          if (!vaccine.completed) {
            if (vaccine.dueDate) {
              if (vaccine.dueDate < todayStr) isOverdue = true;
              else if (vaccine.dueDate <= limitDateStr) isUpcoming = true;
            } else if (vaccine.ageMonths !== undefined && ageMonths >= vaccine.ageMonths) {
              isUpcoming = true;
            }
          }

          const cardBg = vaccine.completed
            ? 'var(--card-bg)'
            : isOverdue
            ? '#fee2e2'
            : isUpcoming
            ? 'var(--yellow)'
            : 'var(--card-bg)';

          return (
            <div key={vaccine.id} className="card p-3 flex justify-between items-center" style={{
              opacity: vaccine.completed ? 0.75 : 1,
              background: cardBg,
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={vaccine.completed}
                  onChange={() => toggleVaccine(vaccine.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === vaccine.id ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '110px', fontSize: '0.85rem' }} />
                      <input type="text" value={editDose} onChange={e => setEditDose(e.target.value)} style={{ width: '60px', fontSize: '0.85rem' }} />
                      <button className="btn-sm btn-blue" onClick={() => {
                        updateVaccine(vaccine.id, { name: editName, dose: editDose });
                        setEditId(null);
                      }}>✓</button>
                      <button className="btn-sm" onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <h4 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.3
                      }}>
                        <span>{vaccine.name}</span>
                        {isOverdue && <span style={{ fontSize: '0.68rem', color: '#dc2626', background: '#fecaca', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>逾期</span>}
                        {!isOverdue && isUpcoming && <span style={{ fontSize: '0.68rem', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>近期</span>}
                        {vaccine.isCustom && <span style={{ fontSize: '0.68rem', color: 'var(--blue)', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>自訂</span>}
                      </h4>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.7, marginTop: '2px' }}>
                        {vaccine.dose} {vaccine.recommendedAge ? `· ${vaccine.recommendedAge}` : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, paddingRight: '4px', marginLeft: '6px' }}>
                <input
                  type="date"
                  value={vaccine.dueDate || ''}
                  onChange={(e) => updateVaccineDate(vaccine.id, e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 6px', width: '125px' }}
                />
                {vaccine.isCustom && editId !== vaccine.id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`確定要刪除自訂疫苗「${vaccine.name}」嗎？`)) {
                        deleteVaccine(vaccine.id);
                      }
                    }}
                    className="btn-sm"
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '0.95rem',
                      flexShrink: 0,
                      marginRight: '2px',
                    }}
                    title="刪除疫苗"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default VaccinePanel;
