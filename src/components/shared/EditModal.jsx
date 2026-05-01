import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const EditModal = ({ record, type, onClose }) => {
  const {
    growthRecords, setGrowthRecords,
    feedingRecords, setFeedingRecords,
    sleepRecords, setSleepRecords,
    healthRecords, setHealthRecords,
    milestones, setMilestones,
    letters, setLetters
  } = useApp();

  const [formData, setFormData] = useState({
    date: record?.date || '',
    value: record?.value || '',
    note: record?.note || '',
    title: record?.title || '',
    icon: record?.icon || '🎉',
    content: record?.content || '',
    duration: record?.duration || '',
    amount: record?.amount || '',
    quality: record?.quality || 'normal',
    healthType: record?.type || '其他'
  });

  const handleSave = () => {
    const updatedRecord = { ...record };

    switch(type) {
      case 'growth':
        updatedRecord.date = formData.date;
        updatedRecord.value = parseFloat(formData.value);
        updatedRecord.note = formData.note;
        setGrowthRecords(growthRecords.map(r => r.id === record.id ? updatedRecord : r));
        break;
      case 'feeding':
        updatedRecord.date = formData.date;
        updatedRecord.duration = formData.duration ? parseInt(formData.duration) : null;
        updatedRecord.amount = formData.amount ? parseInt(formData.amount) : null;
        setFeedingRecords(feedingRecords.map(r => r.id === record.id ? updatedRecord : r));
        break;
      case 'sleep':
        updatedRecord.date = formData.date;
        updatedRecord.duration = parseInt(formData.duration);
        updatedRecord.quality = formData.quality;
        setSleepRecords(sleepRecords.map(r => r.id === record.id ? updatedRecord : r));
        break;
      case 'health':
        updatedRecord.date = formData.date;
        updatedRecord.type = formData.healthType;
        updatedRecord.note = formData.note;
        setHealthRecords(healthRecords.map(r => r.id === record.id ? updatedRecord : r));
        break;
      case 'milestone':
        updatedRecord.date = formData.date;
        updatedRecord.title = formData.title;
        updatedRecord.icon = formData.icon;
        updatedRecord.note = formData.note;
        setMilestones(milestones.map(r => r.id === record.id ? updatedRecord : r));
        break;
      case 'letter':
        updatedRecord.date = formData.date;
        updatedRecord.title = formData.title;
        updatedRecord.content = formData.content;
        setLetters(letters.map(r => r.id === record.id ? updatedRecord : r));
        break;
      default:
        break;
    }

    onClose();
  };

  const handleDelete = () => {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;

    switch(type) {
      case 'growth':
        setGrowthRecords(growthRecords.filter(r => r.id !== record.id));
        break;
      case 'feeding':
        setFeedingRecords(feedingRecords.filter(r => r.id !== record.id));
        break;
      case 'sleep':
        setSleepRecords(sleepRecords.filter(r => r.id !== record.id));
        break;
      case 'health':
        setHealthRecords(healthRecords.filter(r => r.id !== record.id));
        break;
      case 'milestone':
        setMilestones(milestones.filter(r => r.id !== record.id));
        break;
      case 'letter':
        setLetters(letters.filter(r => r.id !== record.id));
        break;
      default:
        break;
    }

    onClose();
  };

  const inputClass = "w-full lg-sm px-4 py-3 text-white/85 placeholder-white/28 bg-transparent outline-none focus:ring-1 focus:ring-rose/30 rounded-lg";
  const labelClass = "block text-sm text-white/50 mb-2";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="lg w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white/85">編輯記錄</h3>
          <button onClick={onClose} className="text-white/28 hover:text-white/50 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          {/* 日期字段 */}
          {type !== 'letter' && (
            <div>
              <label className={labelClass}>日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={inputClass}
              />
            </div>
          )}

          {/* 成長記錄 */}
          {type === 'growth' && (
            <>
              <div>
                <label className={labelClass}>數值</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="2"
                />
              </div>
            </>
          )}

          {/* 餵食記錄 */}
          {type === 'feeding' && (
            <>
              <div>
                <label className={labelClass}>時長 (分鐘)</label>
                <input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>奶量 (ml)</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* 睡眠記錄 */}
          {type === 'sleep' && (
            <>
              <div>
                <label className={labelClass}>時長 (分鐘)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>品質</label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({...formData, quality: e.target.value})}
                  className={inputClass}
                >
                  <option value="good">很好</option>
                  <option value="normal">正常</option>
                  <option value="poor">不佳</option>
                </select>
              </div>
            </>
          )}

          {/* 里程碑 */}
          {type === 'milestone' && (
            <>
              <div>
                <label className={labelClass}>標題</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Emoji</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="2"
                />
              </div>
            </>
          )}

          {/* 信件 */}
          {type === 'letter' && (
            <>
              <div>
                <label className={labelClass}>日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>標題</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>內容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="6"
                />
              </div>
            </>
          )}

          {/* 健康記錄 */}
          {type === 'health' && (
            <>
              <div>
                <label className={labelClass}>類型</label>
                <select
                  value={formData.healthType}
                  onChange={(e) => setFormData({...formData, healthType: e.target.value})}
                  className={inputClass}
                >
                  <option value="生病">生病</option>
                  <option value="就醫">就醫</option>
                  <option value="用藥">用藥</option>
                  <option value="疫苗">疫苗</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="2"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-lg font-bold text-coral border border-coral/30 hover:bg-coral/10 transition-colors"
          >
            刪除
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-rose text-white py-3 rounded-lg font-bold hover:bg-rose-deep transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
