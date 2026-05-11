<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 新增血壓記錄（媽媽的高壓/低壓/脈搏）

## 資料模型

```js
{
  id: 'timestamp',
  date: '2026-05-11',  // 日期
  time: '08:30',         // 測量時間
  systolic: 120,         // 高壓
  diastolic: 80,         // 低壓
  pulse: 72,             // 脈搏
}
```

儲存於 localStorage key `louise_blood_pressure` 和 Firestore collection `blood_pressure`。

---

## Step 1：AppContext.jsx — 新增血壓 state + CRUD

在現有 state 區塊加入：

```jsx
const [bpRecords, setBpRecords] = useLocalStorage('louise_blood_pressure', []);
```

在 diaryEntries 的 Firestore 同步區塊之後，加入 BP 同步：

```jsx
// Blood Pressure — Firestore 優先
const remoteBp = await loadBloodPressureFromFirestore();
if (remoteBp && remoteBp.length > 0) {
  setBpRecords(remoteBp);
  localStorage.setItem('louise_blood_pressure', JSON.stringify(remoteBp));
  anySuccess = true;
} else {
  const lsBp = JSON.parse(localStorage.getItem('louise_blood_pressure') || '[]');
  if (lsBp.length > 0) {
    for (const r of lsBp) await saveBloodPressureToFirestore(r);
  }
}
```

在 diary 函數區塊後加入 BP 函數：

```jsx
// Blood Pressure
const addBpRecord = (r) => {
  const record = { ...r, id: r.id || Date.now().toString() };
  setBpRecords(prev => [...prev, record]);
  saveBloodPressureToFirestore(record);
};
const deleteBpRecord = (id) => {
  setBpRecords(prev => prev.filter(r => r.id !== id));
  deleteBloodPressureFromFirestore(id);
};
```

Provider value 加入：
```jsx
bpRecords, addBpRecord, deleteBpRecord,
```

---

## Step 2：firestoreService.js — 血壓 CRUD

在檔案底部加入：

```js
// ── Blood Pressure ──
export const saveBloodPressureToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'blood_pressure', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      systolic: record.systolic,
      diastolic: record.diastolic,
      pulse: record.pulse,
      createdAt: new Date().toISOString(),
    });
  } catch (e) { console.warn('Firestore save BP:', e.message); }
};

export const loadBloodPressureFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'blood_pressure'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load BP:', e.message); return null; }
};

export const deleteBloodPressureFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'blood_pressure', id)); } catch (e) { console.warn('Firestore delete BP:', e.message); }
};
```

---

## Step 3：Health.jsx — 血壓 Tab 含圖表 + 表單 + 列表

在 Health.jsx 的現有疫苗/記錄 tab 之後，加入第三個 tab「❤️ 血壓」。

完整血壓 tab 內容：

```jsx
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
        id: Date.now().toString(),
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
```

---

## Step 4：Health.jsx — 加入 state 變數 + 註冊 ChartJS + tab 按鈕

在 Health 函數頂部加入新 state：

```jsx
const [bpDate, setBpDate] = useState(new Date().toISOString().split('T')[0]);
const [bpTime, setBpTime] = useState(new Date().toTimeString().slice(0, 5));
const [bpSystolic, setBpSystolic] = useState('');
const [bpDiastolic, setBpDiastolic] = useState('');
const [bpPulse, setBpPulse] = useState('');
```

從 useApp() 解構加入：
```jsx
const { vaccineRecords, toggleVaccine, addCustomVaccine, updateVaccineDate, bpRecords, addBpRecord, deleteBpRecord, user } = useApp();
```

在 Health.jsx 頂部 import ChartJS + Line：
```jsx
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
```

註冊 ChartJS（在 import 之後、函數之前）：
```jsx
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
```

在現有 tab 按鈕之後加入第三個 tab：
```jsx
<button onClick={() => setActiveTab('bp')} className={`btn-sm ${activeTab === 'bp' ? 'btn-blue' : ''}`}>
  ❤️ 血壓
</button>
```

---

## Step 5：構建 + 部署

```bash
cd D:\louise-growth-tracker-gh-pages
npm run build
npx gh-pages -d dist
```
