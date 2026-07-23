import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { genId } from '../utils/id.js';

const QuickAddFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState('temp'); // 'temp' | 'med' | 'bp' | 'visit' | 'growth' | 'milestone'
  const [toastMsg, setToastMsg] = useState('');

  const {
    addTempRecord,
    addMedication,
    addBpRecord,
    addDoctorVisit,
    addGrowthRecord,
    addMilestone,
  } = useApp();

  // 表單 Data 狀態
  const [tempForm, setTempForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    temperature: '',
    method: 'ear',
    medicationName: '',
    note: '',
  });

  const [medForm, setMedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    name: '',
    dose: '',
    frequency: '',
    reason: '',
  });

  const [bpForm, setBpForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    systolic: '',
    diastolic: '',
    pulse: '',
  });

  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    hospital: '',
    doctor: '',
    reason: '',
    status: 'completed',
  });

  const [growthForm, setGrowthForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'height', // 'height' | 'weight' | 'head' | 'feeding'
    value: '',
    note: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    emoji: '🎉',
    note: '',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (activeType === 'temp') {
      if (!tempForm.temperature) return;
      const num = parseFloat(tempForm.temperature);
      const refVal = tempForm.method === 'armpit' ? parseFloat((num + 0.5).toFixed(1)) : num;
      addTempRecord({
        id: genId(),
        date: tempForm.date,
        time: tempForm.time,
        temperature: num,
        method: tempForm.method,
        refTemperature: refVal,
        feverStatus: refVal >= 38.5 ? 'high' : refVal >= 37.5 ? 'mild' : 'normal',
        medicationName: tempForm.medicationName,
        note: tempForm.note,
      });
      showToast('✅ 體溫記錄新增成功！');
    } else if (activeType === 'med') {
      if (!medForm.name) return;
      addMedication({ id: genId(), ...medForm });
      showToast('✅ 用藥記錄新增成功！');
    } else if (activeType === 'bp') {
      if (!bpForm.systolic || !bpForm.diastolic) return;
      addBpRecord({
        id: genId(),
        date: bpForm.date,
        time: bpForm.time,
        systolic: Number(bpForm.systolic),
        diastolic: Number(bpForm.diastolic),
        pulse: Number(bpForm.pulse) || 0,
      });
      showToast('✅ 血壓記錄新增成功！');
    } else if (activeType === 'visit') {
      if (!visitForm.hospital && !visitForm.reason) return;
      addDoctorVisit({ id: genId(), ...visitForm });
      showToast('✅ 看診記錄新增成功！');
    } else if (activeType === 'growth') {
      if (!growthForm.value) return;
      const unitMap = { height: 'cm', weight: 'kg', head: 'cm', feeding: 'ml' };
      addGrowthRecord({
        id: genId(),
        date: growthForm.date,
        type: growthForm.type,
        value: Number(growthForm.value),
        unit: unitMap[growthForm.type] || '',
        note: growthForm.note,
      });
      showToast('✅ 成長記錄新增成功！');
    } else if (activeType === 'milestone') {
      if (!milestoneForm.title) return;
      addMilestone({ id: genId(), ...milestoneForm });
      showToast('✅ 里程碑新增成功！');
    }

    setIsOpen(false);
  };

  return (
    <>
      {/* 📍 右下角快捷加號 FAB 懸浮按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '82px',
          zIndex: 90,
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4d4d 100%)',
          color: '#ffffff',
          border: '3px solid var(--fg)',
          boxShadow: '3px 4px 0px 0px var(--fg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        className="wiggle"
        title="快捷新增健康與成長記錄"
      >
        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', lineHeight: 1 }}>＋</span>
      </button>

      {/* 💬 成功 Toast 提示 */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'var(--fg)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '20px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          className="fade-in"
        >
          {toastMsg}
        </div>
      )}

      {/* 📦 快捷新增模態框 Modal */}
      {isOpen && (
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
          onClick={() => setIsOpen(false)}
        >
          <div
            className="card animate-in"
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                ⚡ 快捷新增項目
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-sm"
                style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* 分類 Tab 切換按鈕 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
              <button
                onClick={() => setActiveType('temp')}
                className={`btn-sm ${activeType === 'temp' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                🌡️ 體溫
              </button>
              <button
                onClick={() => setActiveType('med')}
                className={`btn-sm ${activeType === 'med' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                💊 用藥
              </button>
              <button
                onClick={() => setActiveType('bp')}
                className={`btn-sm ${activeType === 'bp' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                ❤️ 血壓
              </button>
              <button
                onClick={() => setActiveType('visit')}
                className={`btn-sm ${activeType === 'visit' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                🏥 看診
              </button>
              <button
                onClick={() => setActiveType('growth')}
                className={`btn-sm ${activeType === 'growth' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                📏 成長
              </button>
              <button
                onClick={() => setActiveType('milestone')}
                className={`btn-sm ${activeType === 'milestone' ? 'btn-blue' : ''}`}
                style={{ fontSize: '0.82rem', padding: '6px 2px' }}
              >
                🎉 里程碑
              </button>
            </div>

            {/* 動態表單 */}
            <form onSubmit={handleSave} className="space-y-3">
              {/* 1. 體溫 */}
              {activeType === 'temp' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={tempForm.date}
                      onChange={e => setTempForm(p => ({ ...p, date: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                    <input
                      type="time"
                      value={tempForm.time}
                      onChange={e => setTempForm(p => ({ ...p, time: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">部位</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setTempForm(p => ({ ...p, method: 'ear' }))}
                        className={`btn-sm ${tempForm.method === 'ear' ? 'btn-blue' : ''}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        耳溫
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempForm(p => ({ ...p, method: 'armpit' }))}
                        className={`btn-sm ${tempForm.method === 'armpit' ? 'btn-blue' : ''}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        腋溫 (+0.5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempForm(p => ({ ...p, method: 'forehead' }))}
                        className={`btn-sm ${tempForm.method === 'forehead' ? 'btn-blue' : ''}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        額溫
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="34"
                    max="43"
                    placeholder="體溫數值 (°C，如 37.5)"
                    value={tempForm.temperature}
                    onChange={e => setTempForm(p => ({ ...p, temperature: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    placeholder="退燒藥 / 處置（選填）"
                    value={tempForm.medicationName}
                    onChange={e => setTempForm(p => ({ ...p, medicationName: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="備註（選填）"
                    value={tempForm.note}
                    onChange={e => setTempForm(p => ({ ...p, note: e.target.value }))}
                  />
                </>
              )}

              {/* 2. 用藥 */}
              {activeType === 'med' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={medForm.date}
                      onChange={e => setMedForm(p => ({ ...p, date: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                    <input
                      type="time"
                      value={medForm.time}
                      onChange={e => setMedForm(p => ({ ...p, time: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="藥品名稱（如：退燒藥 / 抗生素）"
                    value={medForm.name}
                    onChange={e => setMedForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="劑量（如：2.5ml）"
                      value={medForm.dose}
                      onChange={e => setMedForm(p => ({ ...p, dose: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="頻率（如：每6小時）"
                      value={medForm.frequency}
                      onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="用藥原因（选填）"
                    value={medForm.reason}
                    onChange={e => setMedForm(p => ({ ...p, reason: e.target.value }))}
                  />
                </>
              )}

              {/* 3. 血壓 */}
              {activeType === 'bp' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={bpForm.date}
                      onChange={e => setBpForm(p => ({ ...p, date: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                    <input
                      type="time"
                      value={bpForm.time}
                      onChange={e => setBpForm(p => ({ ...p, time: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder="高壓 (mmHg)"
                      value={bpForm.systolic}
                      onChange={e => setBpForm(p => ({ ...p, systolic: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      placeholder="低壓 (mmHg)"
                      value={bpForm.diastolic}
                      onChange={e => setBpForm(p => ({ ...p, diastolic: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="脈搏 bpm（選填）"
                    value={bpForm.pulse}
                    onChange={e => setBpForm(p => ({ ...p, pulse: e.target.value }))}
                  />
                </>
              )}

              {/* 4. 看診 */}
              {activeType === 'visit' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={visitForm.date}
                      onChange={e => setVisitForm(p => ({ ...p, date: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                    <input
                      type="time"
                      value={visitForm.time}
                      onChange={e => setVisitForm(p => ({ ...p, time: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="醫院 / 診所"
                      value={visitForm.hospital}
                      onChange={e => setVisitForm(p => ({ ...p, hospital: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="醫師"
                      value={visitForm.doctor}
                      onChange={e => setVisitForm(p => ({ ...p, doctor: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="就診原因 / 診斷摘要"
                    value={visitForm.reason}
                    onChange={e => setVisitForm(p => ({ ...p, reason: e.target.value }))}
                  />
                </>
              )}

              {/* 5. 成長 (身高/體重/頭圍/奶量) */}
              {activeType === 'growth' && (
                <>
                  <input
                    type="date"
                    value={growthForm.date}
                    onChange={e => setGrowthForm(p => ({ ...p, date: e.target.value }))}
                    required
                  />
                  <select
                    value={growthForm.type}
                    onChange={e => setGrowthForm(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="height">📏 身高 (cm)</option>
                    <option value="weight">⚖️ 體重 (kg)</option>
                    <option value="head">🧢 頭圍 (cm)</option>
                    <option value="feeding">🍼 總奶量 (ml)</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="輸入數值"
                    value={growthForm.value}
                    onChange={e => setGrowthForm(p => ({ ...p, value: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    placeholder="備註（選填）"
                    value={growthForm.note}
                    onChange={e => setGrowthForm(p => ({ ...p, note: e.target.value }))}
                  />
                </>
              )}

              {/* 6. 里程碑 */}
              {activeType === 'milestone' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Emoji"
                      value={milestoneForm.emoji}
                      onChange={e => setMilestoneForm(p => ({ ...p, emoji: e.target.value }))}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <input
                      type="date"
                      value={milestoneForm.date}
                      onChange={e => setMilestoneForm(p => ({ ...p, date: e.target.value }))}
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="里程碑標題（如：第一次翻身）"
                    value={milestoneForm.title}
                    onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    placeholder="心得備註（選填）"
                    value={milestoneForm.note}
                    onChange={e => setMilestoneForm(p => ({ ...p, note: e.target.value }))}
                  />
                </>
              )}

              <button type="submit" className="btn w-full btn-blue" style={{ marginTop: 12 }}>
                ✅ 確認新增
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickAddFAB;
