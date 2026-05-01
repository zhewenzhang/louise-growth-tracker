import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import EditModal from '../shared/EditModal';
import EmptyState from '../shared/EmptyState';

const vaccinesList = [
  { id: 'vaccine_1', name: 'B肝疫苗', months: [0, 1, 6] },
  { id: 'vaccine_2', name: '卡介苗', months: [0] },
  { id: 'vaccine_3', name: '脊髓灰質炎', months: [2, 4, 6] },
  { id: 'vaccine_4', name: '百日咳/白喉/破傷風', months: [2, 4, 6] },
  { id: 'vaccine_5', name: '小兒麻痺', months: [2, 4, 6] },
  { id: 'vaccine_6', name: '流感嗜血桿菌', months: [2, 4, 6] },
  { id: 'vaccine_7', name: '肺炎球菌', months: [2, 4, 6] },
  { id: 'vaccine_8', name: '麻疹/腮腺炎/風疹', months: [12, 18] },
  { id: 'vaccine_9', name: '輪狀病毒', months: [2, 4] },
  { id: 'vaccine_10', name: '水痘', months: [12] },
  { id: 'vaccine_11', name: '肝炎A', months: [12] }
];

const Health = ({ onOpenQuickRecord }) => {
  const { vaccineRecords, healthRecords } = useApp();
  const [activeTab, setActiveTab] = useState('vaccines');
  const [editingRecord, setEditingRecord] = useState(null);

  const VaccinesTab = () => (
    <div className="space-y-3">
      {vaccinesList.map(vaccine => {
        const record = vaccineRecords.find(v => v.id === vaccine.id);
        const completed = record?.dates?.length || 0;
        const total = vaccine.months.length;

        return (
          <div key={vaccine.id} className="glass-card p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white/85 text-sm font-bold">{vaccine.name}</h4>
              <span className="text-white/28 text-xs">{completed}/{total}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-rose h-2 rounded-full transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const HealthTab = () => (
    <div className="space-y-4">
      <button
        onClick={() => onOpenQuickRecord('health')}
        className="w-full glass-card p-3 text-rose font-bold hover:bg-white/5"
      >
        + 新增健康記錄
      </button>
      <div className="space-y-2">
        {healthRecords.length === 0 ? (
          <EmptyState
            icon="🏥"
            title="還沒有健康記錄"
            description="記錄就醫、用藥、疫苗等信息"
          />
        ) : (
          [...healthRecords].reverse().map(record => (
            <div
              key={record.id}
              className="glass-card p-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setEditingRecord(record)}
            >
              <div className="flex justify-between">
                <span className="text-white/50">{record.date}</span>
                <span className="text-white/85 font-bold">{record.type}</span>
              </div>
              <p className="text-xs text-white/28 mt-1">{record.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto pb-24 p-4">
      <h2 className="text-3xl font-bold text-white/85 mb-4">健康管理</h2>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'vaccines'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          💉 疫苗
        </button>
        <button
          onClick={() => setActiveTab('checkups')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'checkups'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          🏥 檢查
        </button>
      </div>

      {/* 內容 */}
      {activeTab === 'vaccines' ? <VaccinesTab /> : <HealthTab />}

      {/* 編輯模態 */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          type="health"
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
};

export default Health;
