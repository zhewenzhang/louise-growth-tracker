import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import EditModal from '../shared/EditModal';
import EmptyState from '../shared/EmptyState';

const vaccinesList = [
  { id: 'vaccine_1', name: 'B¸ÎÒßÃç', months: [0, 1, 6] },
  { id: 'vaccine_2', name: '¿¨½éÃç', months: [0] },
  { id: 'vaccine_3', name: '¼¹Ëè»ÒÙ|Ñ×', months: [2, 4, 6] },
  { id: 'vaccine_4', name: '°ÙÈÕ¿È/°×ºí/ÆÆ‚ûïL', months: [2, 4, 6] },
  { id: 'vaccine_5', name: 'Ð¡ƒºÂé¯w', months: [2, 4, 6] },
  { id: 'vaccine_6', name: 'Á÷¸ÐÊÈÑª—U¾ú', months: [2, 4, 6] },
  { id: 'vaccine_7', name: '·ÎÑ×Çò¾ú', months: [2, 4, 6] },
  { id: 'vaccine_8', name: 'ÂéÕî/ÈùÏÙÑ×/ïLÕî', months: [12, 18] },
  { id: 'vaccine_9', name: 'Ý† î²¡¶¾', months: [2, 4] },
  { id: 'vaccine_10', name: 'Ë®¶»', months: [12] },
  { id: 'vaccine_11', name: '¸ÎÑ×A', months: [12] }
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
        + ÐÂÔö½¡¿µÓ›ä›
      </button>
      <div className="space-y-2">
        {healthRecords.length === 0 ? (
          <EmptyState
            icon="??"
            title="ß€›]ÓÐ½¡¿µÓ›ä›"
            description="Ó›ä›¾Íát¡¢ÓÃËŽ¡¢ÒßÃçµÈÐÅÏ¢"
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
      <h2 className="text-3xl font-bold text-white/85 mb-4">½¡¿µ¹ÜÀí</h2>

      {/* Tab ÇÐ“Q */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'vaccines'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          ?? ÒßÃç
        </button>
        <button
          onClick={() => setActiveTab('checkups')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'checkups'
              ? 'bg-rose text-white'
              : 'lg text-white/50 hover:text-white/85'
          }`}
        >
          ?? ™z²é
        </button>
      </div>

      {/* ƒÈÈÝ */}
      {activeTab === 'vaccines' ? <VaccinesTab /> : <HealthTab />}

      {/* ¾ŽÝ‹Ä£‘B */}
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

