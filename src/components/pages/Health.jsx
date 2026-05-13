import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatDueDate } from '../../data/vaccines';
import { genId } from '../../utils/id';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Health = () => {
  const { vaccineRecords, toggleVaccine, addCustomVaccine, updateVaccineDate, bpRecords, addBpRecord, deleteBpRecord, user } = useApp();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [customForm, setCustomForm] = useState({ name: '', dose: '1劑', ageMonths: '', dueDate: '' });
  const [bpDate, setBpDate] = useState(new Date().toISOString().split('T')[0]);
  const [bpTime, setBpTime] = useState(new Date().toTimeString().slice(0, 5));
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpPulse, setBpPulse] = useState('');

  const ageMonths = useMemo(() => {
    if (!user?.birthDate) return 0;
    const now = new Date();
    const birth = new Date(user.birthDate);
    const days = (now - birth) / (1000 * 60 * 60 * 24);
    return days / 30.44; // 精確到小數的月齡
  }, [user?.birthDate]);

  // 找出所有需要關注的疫苗（逾期 + 下一個即將到來）
  const alerts = useMemo(() => {
    const overdue = [];
    const upcoming = [];
    for (const v of vaccineRecords) {
      if (v.completed) continue;
      if (v.ageMonths !== undefined && ageMonths >= v.ageMonths) {
        overdue.push({ ...v, overdue: true });
      } else {
        upcoming.push({ ...v, upcoming: true });
      }
    }
    // overdue 優先，然後按 ageMonths 排序 upcoming
    upcoming.sort((a, b) => (a.ageMonths || 0) - (b.ageMonths || 0));
    return [...overdue, ...upcoming.slice(0, 2)];
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

  // 分兩組顯示
  const incomplete = vaccineRecords.filter(v => !v.completed);
  const completed = vaccineRecords.filter(v => v.completed);
  const [activeTab, setActiveTab] = useState('vaccine'); // 'vaccine' | 'bp'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ====== 標題 + Tab 切換 ====== */}
      <div style={{ flexShrink: 0, background: 'var(--bg)', paddingBottom: '8px' }}>
        <h2 className="section-title" style={{ marginBottom: '8px' }}>💉 健康管理</h2>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button onClick={() => setActiveTab('vaccine')} className={`btn-sm ${activeTab === 'vaccine' ? 'btn-blue' : ''}`}>
            💉 疫苗
          </button>
          <button onClick={() => setActiveTab('bp')} className={`btn-sm ${activeTab === 'bp' ? 'btn-blue' : ''}`}>
            ❤️ 血壓
          </button>
        </div>
      </div>

      {/* ====== 可滾動內容區 ====== */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {/* ── 疫苗 Tab ── */}
        {activeTab === 'vaccine' && (
          <>
            {/* 置頂提醒區 */}
            <div style={{ marginBottom: '8px' }}>
              {alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {alerts.map((v, i) => (
                    <div key={v.id} className="sticky-note" style={{
                      transform: `rotate(${(i % 3 - 1) * 1}deg)`,
                      background: v.overdue ? '#fee2e2' : 'var(--yellow)',
                      fontSize: '0.9rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontFamily: 'var(--font-display)' }}>
                            {v.overdue ? '⚠️ 已逾期' : '📅 即將到來'}
                          </strong>{' '}
                          {v.name} · {v.dose}
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.7 }}>
                          {v.dueDate ? formatDueDate(v.dueDate) : v.recommendedAge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sticky-note" style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                  ✅ 所有疫苗已完成，太棒了！
                </div>
              )}
            </div>

            {/* 自定義疫苗按鈕 */}
            <div style={{ marginBottom: '12px' }}>
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
                    placeholder="預計接種日期（選填）" />
                  <button type="submit" className="btn w-full">✅ 新增疫苗</button>
                </div>
              </form>
            )}

            {/* 未完成疫苗 */}
            {incomplete.length > 0 && (
              <div className="space-y-2" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '8px' }}>
                  📋 待接種 ({incomplete.length})
                </h3>
                {incomplete.map((vaccine, idx) => (
                  <div key={vaccine.id} className="sticky-note animate-in"
                    style={{ transform: `rotate(${(idx % 5 - 2) * 1.5}deg)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                          {vaccine.name} {vaccine.isCustom && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>自訂</span>}
                        </h4>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7 }}>{vaccine.dose}</p>
                      </div>
                    </div>

                    {/* 日期編輯區 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      {editId === vaccine.id ? (
                        <>
                          <input type="date" value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '4px 8px', flex: 1 }} />
                          <button className="btn-sm" onClick={() => {
                            updateVaccineDate(vaccine.id, editDate);
                            setEditId(null);
                          }}>✓</button>
                          <button className="btn-sm" onClick={() => setEditId(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.6, flex: 1 }}>
                            📅 {vaccine.dueDate ? formatDueDate(vaccine.dueDate) : vaccine.recommendedAge}
                          </p>
                          <button className="btn-sm" onClick={() => {
                            setEditId(vaccine.id);
                            setEditDate(vaccine.dueDate || '');
                          }} style={{ fontSize: '0.7rem' }}>✏️</button>
                        </>
                      )}
                    </div>

                    <button onClick={() => toggleVaccine(vaccine.id)} className="btn-sm" style={{ marginTop: '6px' }}>
                      ✅ 標記完成
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 已完成疫苗 */}
            {completed.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '8px', opacity: 0.6 }}>
                  ✅ 已完成 ({completed.length})
                </h3>
                <div className="space-y-1">
                  {completed.map(v => (
                    <div key={v.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', opacity: 0.5,
                      fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                    }}>
                      <span>{v.name} · {v.dose}</span>
                      <span>{v.date || '已完成'}</span>
                      <button onClick={() => toggleVaccine(v.id)} className="btn-sm">↩️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── 血壓 Tab ── */}
        {activeTab === 'bp' && (
          <div className="space-y-4">
            {/* 今日快速摘要 */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayReadings = bpRecords.filter(r => r.date === todayStr);
              if (todayReadings.length > 0) {
                const latest = todayReadings[todayReadings.length - 1];
                return (
                  <div className="card-sm" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 4 }}>今日最新</h3>
                    <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.6rem', fontWeight: 600, color: latest.systolic >= 140 ? 'var(--accent)' : 'var(--fg)' }}>
                      {latest.systolic}/{latest.diastolic}
                      <span style={{ fontSize: '0.9rem', fontWeight: 400, marginLeft: 8 }}>mmHg</span>
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.6 }}>
                      脈搏 {latest.pulse} bpm · {latest.time}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* 趨勢圖 */}
            {bpRecords.length >= 2 && (
              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>📈 血壓趨勢</h3>
                <div style={{ height: 200 }}>
                  <Line data={(() => {
                    const recent = bpRecords.slice(-20);
                    return {
                      labels: recent.map(r => {
                        const d = new Date(r.date);
                        return `${d.getMonth()+1}/${d.getDate()}`;
                      }),
                      datasets: [
                        {
                          label: '高壓',
                          data: recent.map(r => r.systolic),
                          borderColor: '#ff4d4d',
                          backgroundColor: 'rgba(255,77,77,0.05)',
                          borderWidth: 2, pointRadius: 4, tension: 0.3, fill: false,
                        },
                        {
                          label: '低壓',
                          data: recent.map(r => r.diastolic),
                          borderColor: '#2d5da1',
                          backgroundColor: 'rgba(45,93,161,0.05)',
                          borderWidth: 2, pointRadius: 4, tension: 0.3, fill: false,
                        },
                        {
                          label: '脈搏',
                          data: recent.map(r => r.pulse),
                          borderColor: '#2d7d46',
                          backgroundColor: 'rgba(45,125,70,0.05)',
                          borderWidth: 2, pointRadius: 4, tension: 0.3, fill: false,
                          yAxisID: 'y1',
                        },
                      ],
                    };
                  })()} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top', labels: { font: { family: 'Patrick Hand', size: 11 }, boxWidth: 12 } },
                      tooltip: { backgroundColor: '#fff', titleColor: '#2d2d2d', bodyColor: '#2d2d2d', borderColor: '#2d2d2d', borderWidth: 2, cornerRadius: 0, padding: 8 },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { family: 'Patrick Hand', size: 10 } } },
                      y: { min: 40, max: 180, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter', size: 10 } } },
                      y1: { position: 'right', min: 40, max: 140, grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
                    },
                  }} />
                </div>
              </div>
            )}

            {/* 新增表單 */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!bpDate || !bpTime || !bpSystolic || !bpDiastolic) return;
              addBpRecord({
                id: genId(),
                date: bpDate,
                time: bpTime,
                systolic: parseInt(bpSystolic),
                diastolic: parseInt(bpDiastolic),
                pulse: parseInt(bpPulse) || 0,
              });
              setBpDate(new Date().toISOString().split('T')[0]);
              setBpTime(new Date().toTimeString().slice(0, 5));
              setBpSystolic(''); setBpDiastolic(''); setBpPulse('');
            }} className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>❤️ 新增血壓記錄</h3>
              <div className="space-y-2">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={bpDate} onChange={e => setBpDate(e.target.value)} required style={{ flex: 1 }} />
                  <input type="time" value={bpTime} onChange={e => setBpTime(e.target.value)} required style={{ flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} placeholder="高壓" required min={60} max={250} style={{ flex: 1 }} />
                  <input type="number" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} placeholder="低壓" required min={30} max={150} style={{ flex: 1 }} />
                  <input type="number" value={bpPulse} onChange={e => setBpPulse(e.target.value)} placeholder="脈搏" min={30} max={250} style={{ flex: 1 }} />
                </div>
                <button type="submit" className="btn w-full">✅ 新增記錄</button>
              </div>
            </form>

            {/* 歷史列表 */}
            <div>
              <h3 className="section-title">記錄歷史 ({bpRecords.length} 筆)</h3>
              {bpRecords.length === 0 ? (
                <div className="card text-center">
                  <p className="text-4xl mb-2">❤️</p>
                  <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有血壓記錄</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...bpRecords].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))).map(r => (
                    <div key={r.id} className="card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.1rem', fontWeight: 600 }}>
                          {r.systolic}/{r.diastolic}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5, marginLeft: 6 }}>mmHg</span>
                        {r.pulse > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5, marginLeft: 8 }}>❤️{r.pulse}</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5 }}>
                        {r.date} {r.time}
                      </div>
                      <button onClick={() => deleteBpRecord(r.id)} className="btn-sm" style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Health;
