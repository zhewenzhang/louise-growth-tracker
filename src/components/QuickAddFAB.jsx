import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { genId } from '../utils/id.js';

const QuickAddFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState('feeding'); // 'feeding' | 'sleep' | 'diaper' | 'temp' | 'med' | 'bp' | 'visit' | 'body' | 'vaccine'
  const [toastMsg, setToastMsg] = useState('');

  const {
    addGrowthRecord,
    addSleepRecord,
    addDiaperRecord,
    addTempRecord,
    addMedication,
    addBpRecord,
    addDoctorVisit,
    addCustomVaccine,
  } = useApp();

  const todayDate = () => new Date().toISOString().split('T')[0];
  const currentTime = () => new Date().toTimeString().slice(0, 5);

  // 1. 餵奶
  const [feedingForm, setFeedingForm] = useState({
    date: todayDate(),
    time: currentTime(),
    breastMilk: '',
    formula: '',
    note: '',
  });

  // 2. 睡眠
  const [sleepForm, setSleepForm] = useState({
    date: todayDate(),
    startTime: currentTime(),
    endTime: currentTime(),
    quality: 'good', // 'good' | 'normal' | 'restless'
    note: '',
  });

  // 3. 尿布
  const [diaperForm, setDiaperForm] = useState({
    date: todayDate(),
    time: currentTime(),
    type: 'wet', // 'wet' | 'poop' | 'both'
    poopColor: '黃色',
    poopTexture: '糊狀',
    note: '',
  });

  // 4. 體溫
  const [tempForm, setTempForm] = useState({
    date: todayDate(),
    time: currentTime(),
    temperature: '',
    method: 'ear',
    medicationName: '',
    note: '',
  });

  // 5. 用藥
  const [medForm, setMedForm] = useState({
    date: todayDate(),
    time: currentTime(),
    name: '',
    dose: '',
    frequency: '',
    reason: '',
  });

  // 6. 血壓
  const [bpForm, setBpForm] = useState({
    date: todayDate(),
    time: currentTime(),
    systolic: '',
    diastolic: '',
    pulse: '',
  });

  // 7. 看診
  const [visitForm, setVisitForm] = useState({
    date: todayDate(),
    time: currentTime(),
    hospital: '',
    doctor: '',
    reason: '',
    status: 'completed',
  });

  // 8. 身體發育 (身高/體重/頭圍)
  const [bodyForm, setBodyForm] = useState({
    date: todayDate(),
    metric: 'height', // 'height' | 'weight' | 'head'
    value: '',
    note: '',
  });

  // 9. 自訂疫苗
  const [vaccineForm, setVaccineForm] = useState({
    name: '',
    dose: '1劑',
    ageMonths: '',
    dueDate: todayDate(),
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (activeType === 'feeding') {
      const bm = Number(feedingForm.breastMilk) || 0;
      const fm = Number(feedingForm.formula) || 0;
      if (bm === 0 && fm === 0) return;
      addGrowthRecord({
        id: genId(),
        date: feedingForm.date,
        time: feedingForm.time,
        type: 'feeding',
        unit: 'ml',
        breastMilk: bm,
        formula: fm,
        value: bm + fm,
        note: feedingForm.note,
      });
      showToast('✅ 餵奶記錄新增成功！');
    } else if (activeType === 'sleep') {
      if (!sleepForm.startTime || !sleepForm.endTime) return;
      const start = new Date(`${sleepForm.date}T${sleepForm.startTime}`);
      const end = new Date(`${sleepForm.date}T${sleepForm.endTime}`);
      let diffMins = Math.round((end - start) / (1000 * 60));
      if (diffMins < 0) diffMins += 24 * 60;
      addSleepRecord({
        id: genId(),
        date: sleepForm.date,
        startTime: sleepForm.startTime,
        endTime: sleepForm.endTime,
        durationMinutes: diffMins,
        quality: sleepForm.quality,
        note: sleepForm.note,
      });
      showToast('✅ 睡眠記錄新增成功！');
    } else if (activeType === 'diaper') {
      addDiaperRecord({
        id: genId(),
        date: diaperForm.date,
        time: diaperForm.time,
        type: diaperForm.type,
        poopColor: diaperForm.type !== 'wet' ? diaperForm.poopColor : '',
        poopTexture: diaperForm.type !== 'wet' ? diaperForm.poopTexture : '',
        note: diaperForm.note,
      });
      showToast('✅ 尿布記錄新增成功！');
    } else if (activeType === 'temp') {
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
    } else if (activeType === 'body') {
      if (!bodyForm.value) return;
      const unitMap = { height: 'cm', weight: 'kg', head: 'cm' };
      addGrowthRecord({
        id: genId(),
        date: bodyForm.date,
        type: bodyForm.metric,
        value: Number(bodyForm.value),
        unit: unitMap[bodyForm.metric] || 'cm',
        note: bodyForm.note,
      });
      showToast('✅ 身體發育記錄新增成功！');
    } else if (activeType === 'vaccine') {
      if (!vaccineForm.name) return;
      addCustomVaccine({
        name: vaccineForm.name,
        dose: vaccineForm.dose || '1劑',
        ageMonths: parseInt(vaccineForm.ageMonths) || 0,
        recommendedAge: vaccineForm.ageMonths ? `滿${vaccineForm.ageMonths}個月` : '自訂',
        dueDate: vaccineForm.dueDate,
      });
      showToast('✅ 自訂疫苗新增成功！');
    }

    setIsOpen(false);
  };

  const navItems = [
    { id: 'feeding', label: '🍼 餵奶' },
    { id: 'sleep', label: '💤 睡眠' },
    { id: 'diaper', label: '💩 尿布' },
    { id: 'temp', label: '🌡️ 體溫' },
    { id: 'med', label: '💊 用藥' },
    { id: 'bp', label: '❤️ 血壓' },
    { id: 'visit', label: '🏥 看診' },
    { id: 'body', label: '📏 身體' },
    { id: 'vaccine', label: '💉 疫苗' },
  ];

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
        title="快捷新增寶寶資訊"
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
            padding: '14px',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="card animate-in"
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              position: 'relative',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
                ⚡ 快捷錄入寶寶資訊
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-sm"
                style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* 3x3 快捷標籤切換 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveType(item.id)}
                  className={`btn-sm ${activeType === item.id ? 'btn-blue' : ''}`}
                  style={{ fontSize: '0.82rem', padding: '6px 2px', whiteSpace: 'nowrap' }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 表單內容 */}
            <form onSubmit={handleSave} className="space-y-3">
              {/* 1. 餵奶 */}
              {activeType === 'feeding' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={feedingForm.date} onChange={e => setFeedingForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={feedingForm.time} onChange={e => setFeedingForm(p => ({ ...p, time: e.target.value }))} required style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="母乳 (ml)" value={feedingForm.breastMilk} onChange={e => setFeedingForm(p => ({ ...p, breastMilk: e.target.value }))} style={{ flex: 1 }} />
                    <input type="number" placeholder="配方奶 (ml)" value={feedingForm.formula} onChange={e => setFeedingForm(p => ({ ...p, formula: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <input type="text" placeholder="備註（選填）" value={feedingForm.note} onChange={e => setFeedingForm(p => ({ ...p, note: e.target.value }))} />
                </>
              )}

              {/* 2. 睡眠 */}
              {activeType === 'sleep' && (
                <>
                  <input type="date" value={sleepForm.date} onChange={e => setSleepForm(p => ({ ...p, date: e.target.value }))} required />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label className="block text-xs font-bold mb-1">開始時間</label>
                      <input type="time" value={sleepForm.startTime} onChange={e => setSleepForm(p => ({ ...p, startTime: e.target.value }))} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="block text-xs font-bold mb-1">結束時間</label>
                      <input type="time" value={sleepForm.endTime} onChange={e => setSleepForm(p => ({ ...p, endTime: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">睡眠品質</label>
                    <select value={sleepForm.quality} onChange={e => setSleepForm(p => ({ ...p, quality: e.target.value }))}>
                      <option value="good">😊 良好安穩</option>
                      <option value="normal">😐 一般</option>
                      <option value="restless">😫 頻繁哭鬧/易醒</option>
                    </select>
                  </div>
                  <input type="text" placeholder="備註（選填）" value={sleepForm.note} onChange={e => setSleepForm(p => ({ ...p, note: e.target.value }))} />
                </>
              )}

              {/* 3. 尿布 */}
              {activeType === 'diaper' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={diaperForm.date} onChange={e => setDiaperForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={diaperForm.time} onChange={e => setDiaperForm(p => ({ ...p, time: e.target.value }))} required style={{ flex: 1 }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">排瀉類型</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={() => setDiaperForm(p => ({ ...p, type: 'wet' }))} className={`btn-sm ${diaperForm.type === 'wet' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>💧 濕尿布</button>
                      <button type="button" onClick={() => setDiaperForm(p => ({ ...p, type: 'poop' }))} className={`btn-sm ${diaperForm.type === 'poop' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>💩 便便</button>
                      <button type="button" onClick={() => setDiaperForm(p => ({ ...p, type: 'both' }))} className={`btn-sm ${diaperForm.type === 'both' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>💧💩 濕+便</button>
                    </div>
                  </div>
                  {diaperForm.type !== 'wet' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={diaperForm.poopColor} onChange={e => setDiaperForm(p => ({ ...p, poopColor: e.target.value }))} style={{ flex: 1 }}>
                        <option value="黃色">🟡 黃色</option>
                        <option value="綠色">🟢 綠色</option>
                        <option value="褐色">🟤 褐色</option>
                        <option value="黑色">⚫ 黑色(注意)</option>
                        <option value="白色">⚪ 白色(異常)</option>
                      </select>
                      <select value={diaperForm.poopTexture} onChange={e => setDiaperForm(p => ({ ...p, poopTexture: e.target.value }))} style={{ flex: 1 }}>
                        <option value="糊狀">糊狀</option>
                        <option value="水狀">水狀 (腹瀉)</option>
                        <option value="成型">成型</option>
                        <option value="硬塊">硬塊 (便秘)</option>
                      </select>
                    </div>
                  )}
                  <input type="text" placeholder="備註（選填）" value={diaperForm.note} onChange={e => setDiaperForm(p => ({ ...p, note: e.target.value }))} />
                </>
              )}

              {/* 4. 體溫 */}
              {activeType === 'temp' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={tempForm.date} onChange={e => setTempForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={tempForm.time} onChange={e => setTempForm(p => ({ ...p, time: e.target.value }))} required style={{ flex: 1 }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">量測部位</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={() => setTempForm(p => ({ ...p, method: 'ear' }))} className={`btn-sm ${tempForm.method === 'ear' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>👂 耳溫</button>
                      <button type="button" onClick={() => setTempForm(p => ({ ...p, method: 'armpit' }))} className={`btn-sm ${tempForm.method === 'armpit' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>🦾 腋溫(+0.5)</button>
                      <button type="button" onClick={() => setTempForm(p => ({ ...p, method: 'forehead' }))} className={`btn-sm ${tempForm.method === 'forehead' ? 'btn-blue' : ''}`} style={{ flex: 1 }}>🌡️ 額溫</button>
                    </div>
                  </div>
                  <input type="number" step="0.1" min="34" max="43" placeholder="體溫數值 (°C，如 37.5)" value={tempForm.temperature} onChange={e => setTempForm(p => ({ ...p, temperature: e.target.value }))} required />
                  <input type="text" placeholder="退燒藥 / 處置（選填）" value={tempForm.medicationName} onChange={e => setTempForm(p => ({ ...p, medicationName: e.target.value }))} />
                  <input type="text" placeholder="備註（選填）" value={tempForm.note} onChange={e => setTempForm(p => ({ ...p, note: e.target.value }))} />
                </>
              )}

              {/* 5. 用藥 */}
              {activeType === 'med' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={medForm.date} onChange={e => setMedForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={medForm.time} onChange={e => setMedForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <input type="text" placeholder="藥品名稱（如：退燒藥 / 抗生素）" value={medForm.name} onChange={e => setMedForm(p => ({ ...p, name: e.target.value }))} required />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="劑量（如：2.5ml）" value={medForm.dose} onChange={e => setMedForm(p => ({ ...p, dose: e.target.value }))} style={{ flex: 1 }} />
                    <input type="text" placeholder="頻率（如：每6小時）" value={medForm.frequency} onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <input type="text" placeholder="用藥原因（選填）" value={medForm.reason} onChange={e => setMedForm(p => ({ ...p, reason: e.target.value }))} />
                </>
              )}

              {/* 6. 血壓 */}
              {activeType === 'bp' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={bpForm.date} onChange={e => setBpForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={bpForm.time} onChange={e => setBpForm(p => ({ ...p, time: e.target.value }))} required style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="高壓 (mmHg)" value={bpForm.systolic} onChange={e => setBpForm(p => ({ ...p, systolic: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="number" placeholder="低壓 (mmHg)" value={bpForm.diastolic} onChange={e => setBpForm(p => ({ ...p, diastolic: e.target.value }))} required style={{ flex: 1 }} />
                  </div>
                  <input type="number" placeholder="脈搏 bpm（選填）" value={bpForm.pulse} onChange={e => setBpForm(p => ({ ...p, pulse: e.target.value }))} />
                </>
              )}

              {/* 7. 看診 */}
              {activeType === 'visit' && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={visitForm.date} onChange={e => setVisitForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
                    <input type="time" value={visitForm.time} onChange={e => setVisitForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="醫院 / 診所" value={visitForm.hospital} onChange={e => setVisitForm(p => ({ ...p, hospital: e.target.value }))} style={{ flex: 1 }} />
                    <input type="text" placeholder="醫師" value={visitForm.doctor} onChange={e => setVisitForm(p => ({ ...p, doctor: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <input type="text" placeholder="就診原因 / 診斷摘要" value={visitForm.reason} onChange={e => setVisitForm(p => ({ ...p, reason: e.target.value }))} />
                </>
              )}

              {/* 8. 身體發育 */}
              {activeType === 'body' && (
                <>
                  <input type="date" value={bodyForm.date} onChange={e => setBodyForm(p => ({ ...p, date: e.target.value }))} required />
                  <select value={bodyForm.metric} onChange={e => setBodyForm(p => ({ ...p, metric: e.target.value }))}>
                    <option value="height">📏 身高 (cm)</option>
                    <option value="weight">⚖️ 體重 (kg)</option>
                    <option value="head">🧢 頭圍 (cm)</option>
                  </select>
                  <input type="number" step="0.1" placeholder="輸入數值" value={bodyForm.value} onChange={e => setBodyForm(p => ({ ...p, value: e.target.value }))} required />
                  <input type="text" placeholder="備註（選填）" value={bodyForm.note} onChange={e => setBodyForm(p => ({ ...p, note: e.target.value }))} />
                </>
              )}

              {/* 9. 自訂疫苗 */}
              {activeType === 'vaccine' && (
                <>
                  <input type="text" placeholder="疫苗名稱（如：腸病毒疫苗）" value={vaccineForm.name} onChange={e => setVaccineForm(p => ({ ...p, name: e.target.value }))} required />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="劑次（如：第1劑）" value={vaccineForm.dose} onChange={e => setVaccineForm(p => ({ ...p, dose: e.target.value }))} style={{ flex: 1 }} />
                    <input type="number" placeholder="建議月齡" value={vaccineForm.ageMonths} onChange={e => setVaccineForm(p => ({ ...p, ageMonths: e.target.value }))} style={{ flex: 1 }} />
                  </div>
                  <input type="date" value={vaccineForm.dueDate} onChange={e => setVaccineForm(p => ({ ...p, dueDate: e.target.value }))} />
                </>
              )}

              <button type="submit" className="btn w-full btn-blue" style={{ marginTop: 12 }}>
                ✅ 確認新增記錄
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickAddFAB;
