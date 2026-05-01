import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import GrowthChart from '../shared/GrowthChart';
import EditModal from '../shared/EditModal';
import EmptyState from '../shared/EmptyState';
import { whoWeightData, whoHeightData, whoHeadCircumferenceData, calculatePercentile } from '../../utils/whoData';

const Growth = () => {
  const { user, growthRecords } = useApp();
  const [activeTab, setActiveTab] = useState('weight');
  const [editingRecord, setEditingRecord] = useState(null);

  const recordsByType = {
    weight: growthRecords.filter(r => r.type === 'weight'),
    height: growthRecords.filter(r => r.type === 'height'),
    headCircumference: growthRecords.filter(r => r.type === 'headCircumference')
  };

  const dataMap = {
    weight: { who: whoWeightData, label: '體重 (kg)', color: '#e8909a', unit: 'kg' },
    height: { who: whoHeightData, label: '身高 (cm)', color: '#7acaca', unit: 'cm' },
    headCircumference: { who: whoHeadCircumferenceData, label: '頭圍 (cm)', color: '#e8a87c', unit: 'cm' }
  };

  const currentData = dataMap[activeTab];
  const currentRecords = recordsByType[activeTab];

  // Map Louise's data to month indices
  const birthDate = new Date(user.birthDate);
  const mappedData = new Array(25).fill(null);
  
  currentRecords.forEach(record => {
    const recordDate = new Date(record.date);
    const monthAge = (recordDate.getFullYear() - birthDate.getFullYear()) * 12 + (recordDate.getMonth() - birthDate.getMonth());
    if (monthAge >= 0 && monthAge <= 24) {
      mappedData[monthAge] = record.value;
    }
  });

  // Use raw mapped data without interpolation
  // Chart.js will automatically skip null values when spanGaps is false
  const chartData = mappedData;

  return (
    <div className="flex-1 overflow-auto pb-24 p-4">
      <h2 className="text-white mb-6" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: '600', letterSpacing: '-0.015em' }}>成長追蹤</h2>

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        {['weight', 'height', 'headCircumference'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 ${
              activeTab === tab
                ? 'bg-rose text-white'
                : 'glass-card text-white/50 hover:text-white/85'
            }`}
          >
            {tab === 'weight' ? '體重' : tab === 'height' ? '身高' : '頭圍'}
          </button>
        ))}
      </div>

      {/* 圖表 */}
      <div className="glass-card mb-6 h-64 sm:h-72 md:h-80 lg:h-96 flex items-center justify-center">
        {currentRecords.length === 0 ? (
          <div className="text-center">
            <p className="text-4xl mb-3">📈</p>
            <p className="text-white/50 text-sm">添加 3 筆以上的數據就能看到<br />WHO 成長曲線對比</p>
          </div>
        ) : (
          <GrowthChart
            data={chartData}
            whoData={currentData.who}
            label={user.name}
            color={currentData.color}
            unit={currentData.unit}
            spanGaps={false}
          />
        )}
      </div>

      {/* 記錄列表 */}
      <div className="space-y-2">
        <h3 className="text-white/85 font-bold caption">記錄歷史</h3>
        {currentRecords.length === 0 ? (
          <EmptyState
            icon="📊"
            title="還沒有記錄"
            description="開始記錄 Louise 的成長數據，查看 WHO 成長曲線對比"
          />
        ) : (
          [...currentRecords].reverse().map(record => {
            const recordDate = new Date(record.date);
            const monthAge = (recordDate.getFullYear() - birthDate.getFullYear()) * 12 + (recordDate.getMonth() - birthDate.getMonth());
            const percentile = calculatePercentile(record.value, activeTab, monthAge);

            return (
              <div
                key={record.id}
                className="glass-card p-3 text-sm cursor-pointer hover:bg-white/5 transition-all hover:-translate-y-0.5"
                onClick={() => setEditingRecord(record)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white/50">{record.date}</span>
                  <span className="text-white/85 font-bold">{record.value} {record.unit}</span>
                </div>
                {percentile && (
                  <p className="text-white/28 text-xs mt-1">
                    {percentile}
                  </p>
                )}
                {record.note && (
                  <p className="text-white/28 text-xs mt-1">
                    {record.note}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 編輯模態 */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          type="growth"
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
};

export default Growth;
