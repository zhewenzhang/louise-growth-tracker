import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import VaccinePanel from '../health/VaccinePanel.jsx';
import TemperaturePanel from '../health/TemperaturePanel.jsx';
import MedicationPanel from '../health/MedicationPanel.jsx';
import DoctorVisitPanel from '../health/DoctorVisitPanel.jsx';
import BloodPressurePanel from '../health/BloodPressurePanel.jsx';

const Health = ({ initialTab } = {}) => {
  const { exportCSV } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab || 'vaccine'); // 'vaccine' | 'temp' | 'med' | 'visit' | 'bp'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ====== 標題 + Tab 切換 ====== */}
      <div style={{ flexShrink: 0, background: 'var(--bg)', paddingBottom: '8px' }}>
        <h2 className="section-title" style={{ marginBottom: '8px' }}>💉 健康管理</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('vaccine')} className={`btn-sm ${activeTab === 'vaccine' ? 'btn-blue' : ''}`}>
              💉 疫苗
            </button>
            <button onClick={() => setActiveTab('temp')} className={`btn-sm ${activeTab === 'temp' ? 'btn-blue' : ''}`}>
              🌡️ 體溫
            </button>
            <button onClick={() => setActiveTab('med')} className={`btn-sm ${activeTab === 'med' ? 'btn-blue' : ''}`}>
              💊 用藥
            </button>
            <button onClick={() => setActiveTab('visit')} className={`btn-sm ${activeTab === 'visit' ? 'btn-blue' : ''}`}>
              🏥 看診
            </button>
            <button onClick={() => setActiveTab('bp')} className={`btn-sm ${activeTab === 'bp' ? 'btn-blue' : ''}`}>
              ❤️ 血壓
            </button>
          </div>
          <button onClick={() => exportCSV('all')} className="btn-sm" style={{ background: 'var(--yellow)', color: '#2d2d2d' }} title="下載健康 CSV 報告">
            📥 匯出 CSV 報告
          </button>
        </div>
      </div>

      {/* ====== 可滾動內容區 ====== */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {activeTab === 'vaccine' && <VaccinePanel />}
        {activeTab === 'temp' && <TemperaturePanel />}
        {activeTab === 'med' && <MedicationPanel />}
        {activeTab === 'visit' && <DoctorVisitPanel />}
        {activeTab === 'bp' && <BloodPressurePanel />}
      </div>
    </div>
  );
};

export default Health;
