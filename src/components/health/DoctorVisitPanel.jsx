import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { genId } from '../../utils/id';

const DoctorVisitPanel = () => {
  const { doctorVisits, addDoctorVisit, updateDoctorVisit, deleteDoctorVisit } = useApp();
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0], time: '', hospital: '', location: '', department: '',
    visitNumber: '', doctor: '', reason: '', questions: '', diagnosis: '', advice: '', followUpDate: '', status: 'completed'
  });
  const [editVisitId, setEditVisitId] = useState(null);
  const [editVisitForm, setEditVisitForm] = useState({});
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ diagnosis: '', advice: '', followUpDate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!visitForm.date) return;
    addDoctorVisit({ id: genId(), ...visitForm });
    setVisitForm({
      date: new Date().toISOString().split('T')[0], time: '', hospital: '', location: '', department: '',
      visitNumber: '', doctor: '', reason: '', questions: '', diagnosis: '', advice: '', followUpDate: '', status: 'completed'
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = doctorVisits
    .filter(v => v.status === 'scheduled' || (v.followUpDate && v.followUpDate >= todayStr))
    .sort((a, b) => new Date(a.followUpDate || a.date) - new Date(b.followUpDate || b.date));

  return (
    <div className="space-y-4">
      {/* 即將回診提醒 */}
      {upcoming.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {upcoming.slice(0, 3).map((v, i) => {
            const targetDate = v.status === 'scheduled' ? v.date : v.followUpDate;
            const daysUntil = Math.ceil((new Date(targetDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
            return (
              <div key={v.id} className="sticky-note" style={{
                transform: `rotate(${(i % 3 - 1) * 1}deg)`,
                background: daysUntil <= 1 ? '#fee2e2' : daysUntil <= 3 ? '#fff3cd' : 'var(--yellow)',
                fontSize: '0.9rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-display)' }}>
                      {daysUntil <= 0 ? '🚨 今天回診' : daysUntil === 1 ? '⚠️ 明天回診' : `📅 ${daysUntil} 天後回診`}
                    </strong>
                    {' '}{v.hospital || '醫院'}{v.doctor && ` · ${v.doctor}`}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.7, flexShrink: 0, marginLeft: 8 }}>
                    {targetDate}{v.time && ` ${v.time}`}
                  </span>
                </div>
                {(v.department || v.location || v.visitNumber) && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.75, marginTop: 4 }}>
                    {v.department && `🏷️ ${v.department}`}
                    {v.location && `　📍 ${v.location}`}
                    {v.visitNumber && `　🔢 ${v.visitNumber}`}
                  </p>
                )}
                {v.reason && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.6, marginTop: 2 }}>{v.reason}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* 新增看診表單 */}
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>🏥 新增看診記錄</h3>
        <div className="space-y-2">
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={visitForm.status} onChange={e => setVisitForm(p => ({ ...p, status: e.target.value }))} style={{ flex: 1 }}>
              <option value="completed">✅ 已看診</option>
              <option value="scheduled">📅 預約中</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={visitForm.date} onChange={e => setVisitForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
            <input type="time" value={visitForm.time} onChange={e => setVisitForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={visitForm.hospital} onChange={e => setVisitForm(p => ({ ...p, hospital: e.target.value }))} placeholder="醫院/診所" style={{ flex: 1 }} />
            <input type="text" value={visitForm.doctor} onChange={e => setVisitForm(p => ({ ...p, doctor: e.target.value }))} placeholder="醫師" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={visitForm.location} onChange={e => setVisitForm(p => ({ ...p, location: e.target.value }))} placeholder="看診地點（如：3樓門診）" style={{ flex: 1 }} />
            <input type="text" value={visitForm.department} onChange={e => setVisitForm(p => ({ ...p, department: e.target.value }))} placeholder="診別（如：小兒科）" style={{ flex: 1 }} />
          </div>
          <input type="text" value={visitForm.visitNumber} onChange={e => setVisitForm(p => ({ ...p, visitNumber: e.target.value }))} placeholder="就診號（如：A012）" />
          <input type="text" value={visitForm.reason} onChange={e => setVisitForm(p => ({ ...p, reason: e.target.value }))} placeholder="就診原因" />
          {visitForm.status === 'scheduled' && (
            <textarea
              value={visitForm.questions}
              onChange={e => setVisitForm(p => ({ ...p, questions: e.target.value }))}
              placeholder="想問醫生的問題 / 備注（選填）"
              rows="3"
              style={{ resize: 'none' }}
            />
          )}
          {visitForm.status === 'completed' && (
            <>
              <input type="text" value={visitForm.diagnosis} onChange={e => setVisitForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="診斷結果" />
              <textarea value={visitForm.advice} onChange={e => setVisitForm(p => ({ ...p, advice: e.target.value }))} placeholder="醫生囑咐 / 注意事項" rows="3" style={{ resize: 'none' }} />
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem' }}>下次回診日期（選填）</label>
                <input type="date" value={visitForm.followUpDate} onChange={e => setVisitForm(p => ({ ...p, followUpDate: e.target.value }))} />
              </div>
            </>
          )}
          <button type="submit" className="btn w-full">✅ {visitForm.status === 'scheduled' ? '新增預約' : '新增記錄'}</button>
        </div>
      </form>

      {/* 看診歷史 */}
      <div>
        <h3 className="section-title">看診記錄 ({doctorVisits.length} 筆)</h3>
        {doctorVisits.length === 0 ? (
          <div className="card text-center">
            <p className="text-4xl mb-2">🏥</p>
            <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有看診記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...doctorVisits].sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
              <div key={r.id} className="card animate-in" style={{ padding: '14px' }}>
                {editVisitId === r.id ? (
                  /* ── 編輯模式 ── */
                  <div className="space-y-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>✏️ 編輯看診記錄</span>
                      <button onClick={() => setEditVisitId(null)} className="btn-sm" style={{ fontSize: '0.7rem' }}>✕ 取消</button>
                    </div>
                    <select value={editVisitForm.status || 'completed'} onChange={e => setEditVisitForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%' }}>
                      <option value="completed">✅ 已看診</option>
                      <option value="scheduled">📅 預約中</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="date" value={editVisitForm.date || ''} onChange={e => setEditVisitForm(p => ({ ...p, date: e.target.value }))} style={{ flex: 1 }} />
                      <input type="time" value={editVisitForm.time || ''} onChange={e => setEditVisitForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={editVisitForm.hospital || ''} onChange={e => setEditVisitForm(p => ({ ...p, hospital: e.target.value }))} placeholder="醫院/診所" style={{ flex: 1 }} />
                      <input type="text" value={editVisitForm.doctor || ''} onChange={e => setEditVisitForm(p => ({ ...p, doctor: e.target.value }))} placeholder="醫師" style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={editVisitForm.location || ''} onChange={e => setEditVisitForm(p => ({ ...p, location: e.target.value }))} placeholder="看診地點（如：3樓門診）" style={{ flex: 1 }} />
                      <input type="text" value={editVisitForm.department || ''} onChange={e => setEditVisitForm(p => ({ ...p, department: e.target.value }))} placeholder="診別（如：小兒科）" style={{ flex: 1 }} />
                    </div>
                    <input type="text" value={editVisitForm.visitNumber || ''} onChange={e => setEditVisitForm(p => ({ ...p, visitNumber: e.target.value }))} placeholder="就診號（如：A012）" />
                    <input type="text" value={editVisitForm.reason || ''} onChange={e => setEditVisitForm(p => ({ ...p, reason: e.target.value }))} placeholder="就診原因" />
                    <textarea value={editVisitForm.questions || ''} onChange={e => setEditVisitForm(p => ({ ...p, questions: e.target.value }))} placeholder="想問醫生的問題 / 備注（選填）" rows="3" style={{ resize: 'none' }} />
                    <input type="text" value={editVisitForm.diagnosis || ''} onChange={e => setEditVisitForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="診斷結果" />
                    <textarea value={editVisitForm.advice || ''} onChange={e => setEditVisitForm(p => ({ ...p, advice: e.target.value }))} placeholder="醫生囑咐 / 注意事項" rows="3" style={{ resize: 'none' }} />
                    <div>
                      <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>下次回診日期</label>
                      <input type="date" value={editVisitForm.followUpDate || ''} onChange={e => setEditVisitForm(p => ({ ...p, followUpDate: e.target.value }))} />
                    </div>
                    <button onClick={() => {
                      if (!editVisitForm.date) return;
                      updateDoctorVisit(r.id, editVisitForm);
                      setEditVisitId(null);
                    }} className="btn w-full" style={{ fontSize: '0.9rem' }}>✅ 儲存修改</button>
                  </div>
                ) : (
                  /* ── 顯示模式 ── */
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                          {r.status === 'scheduled' ? '📅' : '🏥'} {r.hospital || '看診'}
                        </span>
                        {r.doctor && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.6 }}> · {r.doctor}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5 }}>
                          {r.date}{r.time && ` ⏰ ${r.time}`}
                        </span>
                        <button onClick={() => { setEditVisitId(r.id); setEditVisitForm({ status: r.status, date: r.date, time: r.time, hospital: r.hospital, location: r.location, department: r.department, visitNumber: r.visitNumber, doctor: r.doctor, reason: r.reason, questions: r.questions, diagnosis: r.diagnosis, advice: r.advice, followUpDate: r.followUpDate }); }} className="btn-sm" style={{ fontSize: '0.7rem' }}>✏️</button>
                        <button onClick={() => deleteDoctorVisit(r.id)} className="btn-sm" style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>🗑️</button>
                      </div>
                    </div>
                    {r.reason && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7 }}>原因：{r.reason}</p>}
                    {r.status === 'scheduled' && r.questions && (
                      <div style={{ marginTop: 6, padding: '8px 10px', background: '#e8f4fd', borderRadius: 'var(--wobbly-sm)', border: '1.5px solid #2d5da1' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#2d5da1' }}>
                          ❓ 想問醫生：{r.questions}
                        </p>
                      </div>
                    )}
                    {(r.location || r.department || r.visitNumber) && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.6, marginTop: 2 }}>
                        {r.location && `📍 ${r.location}`}
                        {r.department && `　🏷️ ${r.department}`}
                        {r.visitNumber && `　🔢 ${r.visitNumber}`}
                      </p>
                    )}
                    {r.diagnosis && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7 }}>診斷：{r.diagnosis}</p>}
                    {r.advice && (
                      <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--yellow)', borderRadius: 'var(--wobbly-sm)', border: '1px solid var(--fg)' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>📋 醫囑：{r.advice}</p>
                      </div>
                    )}
                    {r.followUpDate && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>
                        📅 回診：{r.followUpDate}
                      </p>
                    )}
                    {r.status === 'scheduled' && (
                      <>
                        {completingId === r.id ? (
                          /* ── 完診補充表單 ── */
                          <div style={{ marginTop: 10, padding: '12px', background: 'var(--bg)', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--fg)' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: 8 }}>
                              🏥 補充看診資訊（選填，可直接跳過）
                            </p>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={completeForm.diagnosis}
                                onChange={e => setCompleteForm(p => ({ ...p, diagnosis: e.target.value }))}
                                placeholder="診斷結果（選填）"
                              />
                              <textarea
                                value={completeForm.advice}
                                onChange={e => setCompleteForm(p => ({ ...p, advice: e.target.value }))}
                                placeholder="醫生囑咐 / 注意事項（選填）"
                                rows="2"
                                style={{ resize: 'none' }}
                              />
                              <div>
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.7, display: 'block', marginBottom: 4 }}>
                                  📅 下次回診日期（選填）
                                </label>
                                <input
                                  type="date"
                                  value={completeForm.followUpDate}
                                  onChange={e => setCompleteForm(p => ({ ...p, followUpDate: e.target.value }))}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ flex: 1, background: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }}
                                  onClick={() => {
                                    updateDoctorVisit(r.id, {
                                      status: 'completed',
                                      ...(completeForm.diagnosis && { diagnosis: completeForm.diagnosis }),
                                      ...(completeForm.advice && { advice: completeForm.advice }),
                                      ...(completeForm.followUpDate && { followUpDate: completeForm.followUpDate }),
                                    });
                                    setCompletingId(null);
                                    setCompleteForm({ diagnosis: '', advice: '', followUpDate: '' });
                                  }}
                                >
                                  ✅ 確認完診
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ flex: 1 }}
                                  onClick={() => {
                                    updateDoctorVisit(r.id, { status: 'completed' });
                                    setCompletingId(null);
                                    setCompleteForm({ diagnosis: '', advice: '', followUpDate: '' });
                                  }}
                                >
                                  ⏭️ 跳過，直接完診
                                </button>
                                <button
                                  className="btn-sm"
                                  onClick={() => { setCompletingId(null); setCompleteForm({ diagnosis: '', advice: '', followUpDate: '' }); }}
                                  style={{ flexShrink: 0 }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setCompletingId(r.id);
                              setCompleteForm({ diagnosis: r.diagnosis || '', advice: r.advice || '', followUpDate: r.followUpDate || '' });
                            }}
                            className="btn-sm"
                            style={{ marginTop: 8, background: 'var(--green)', color: '#fff', borderColor: 'var(--green)', width: '100%' }}
                          >
                            ✅ 已看診，標記完成
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorVisitPanel;
