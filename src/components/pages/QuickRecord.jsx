import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext';
import Icons from '../shared/Icons';
import Confetti from '../shared/Confetti';

const QuickRecord = ({ type, onClose }) => {
  const {
    growthRecords, setGrowthRecords,
    feedingRecords, setFeedingRecords,
    sleepRecords, setSleepRecords,
    healthRecords, setHealthRecords,
    milestones, setMilestones,
    letters, setLetters
  } = useApp();

  const { success, error } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    date: today,
    time: now,
    value: '',
    unit: '',
    feedingType: 'breastfeeding',
    amount: '',
    duration: '',
    quality: 'normal',
    startTime: now,
    endTime: '',
    title: '',
    icon: '🎉',
    note: '',
    content: '',
    healthType: '其他'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if ((type === 'weight' || type === 'height' || type === 'head') && !formData.value) {
      newErrors.value = '請輸入數值';
    }
    if (type === 'weight' && (formData.value < 0 || formData.value > 50)) {
      newErrors.value = '體重應在 0-50 kg 之間';
    }
    if (type === 'height' && (formData.value < 30 || formData.value > 120)) {
      newErrors.value = '身高應在 30-120 cm 之間';
    }
    if (type === 'head' && (formData.value < 20 || formData.value > 60)) {
      newErrors.value = '頭圍應在 20-60 cm 之間';
    }
    if (type === 'feeding' && !formData.amount && !formData.duration) {
      newErrors.feeding = '請輸入奶量或時長';
    }
    if (type === 'sleep' && !formData.duration) {
      newErrors.duration = '請輸入睡眠時長';
    }
    if (type === 'milestone' && !formData.title) {
      newErrors.title = '請輸入標題';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const id = Date.now();

    const typeLabels = {
      weight: '體重', height: '身高', head: '頭圍',
      feeding: '餵食', sleep: '睡眠', milestone: '里程碑',
      letter: '信件', health: '健康記錄'
    };

    switch(type) {
      case 'weight':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'weight', value: parseFloat(formData.value), unit: 'kg'
        }]);
        break;
      case 'height':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'height', value: parseFloat(formData.value), unit: 'cm'
        }]);
        break;
      case 'head':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'headCircumference', value: parseFloat(formData.value), unit: 'cm'
        }]);
        break;
      case 'feeding':
        setFeedingRecords([...feedingRecords, {
          id, date: formData.date, time: formData.time, type: formData.feedingType,
          duration: formData.duration ? parseInt(formData.duration) : null,
          amount: formData.amount ? parseInt(formData.amount) : null
        }]);
        break;
      case 'sleep':
        setSleepRecords([...sleepRecords, {
          id, date: formData.date, startTime: formData.startTime,
          endTime: formData.endTime || '', duration: parseInt(formData.duration),
          quality: formData.quality
        }]);
        break;
      case 'milestone':
        setMilestones([...milestones, {
          id, date: formData.date, title: formData.title,
          icon: formData.icon || '🎉', note: formData.note
        }]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        break;
      case 'letter':
        setLetters([...letters, {
          id, date: formData.date, title: formData.title, content: formData.content
        }]);
        break;
      case 'health':
        setHealthRecords([...healthRecords, {
          id, date: formData.date, type: formData.healthType || '其他', note: formData.note
        }]);
        break;
      default:
        break;
    }

    success(`已記錄${typeLabels[type]}`);
    onClose();
  };

  const typeTitles = {
    weight: '記錄體重',
    height: '記錄身高',
    head: '記錄頭圍',
    feeding: '記錄餵食',
    sleep: '記錄睡眠',
    milestone: '記錄里程碑',
    letter: '寫給 Louise 的信',
    health: '健康記錄'
  };

  const inputClass = "w-full lg-sm px-4 py-3 text-white/85 placeholder-white/28 bg-transparent outline-none focus:ring-1 focus:ring-rose/30 rounded-lg";
  const labelClass = "block text-sm text-white/50 mb-2";
  const errorClass = "text-coral text-xs mt-1";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      {showConfetti && <Confetti />}
      <div className="lg-nav w-full rounded-t-3xl p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white/85">{typeTitles[type]}</h3>
          <button onClick={onClose} className="text-white/28 hover:text-white/50 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 日期字段 (letter 不需要) */}
          {type !== 'letter' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={inputClass}
                />
              </div>
              {type === 'feeding' && (
                <div>
                  <label className={labelClass}>時間</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* 體重/身高/頭圍 */}
          {(type === 'weight' || type === 'height' || type === 'head') && (
            <div>
              <label className={labelClass}>
                {type === 'weight' ? '體重 (kg)' : type === 'height' ? '身高 (cm)' : '頭圍 (cm)'}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={type === 'weight' ? '例如：3.5' : type === 'height' ? '例如：52.0' : '例如：36.0'}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className={`${inputClass} ${errors.value ? 'border-coral' : ''}`}
                required
              />
              {errors.value && <p className={errorClass}>{errors.value}</p>}
            </div>
          )}

          {/* 餵食 */}
          {type === 'feeding' && (
            <>
              <div>
                <label className={labelClass}>餵食類型</label>
                <select
                  value={formData.feedingType}
                  onChange={(e) => setFormData({...formData, feedingType: e.target.value})}
                  className={inputClass}
                >
                  <option value="breastfeeding">母乳</option>
                  <option value="formula">配方奶</option>
                  <option value="solid">副食品</option>
                </select>
              </div>
              {formData.feedingType === 'formula' && (
                <div>
                  <label className={labelClass}>奶量 (ml)</label>
                  <input
                    type="number"
                    placeholder="例如：120"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className={inputClass}
                  />
                  {errors.feeding && <p className={errorClass}>{errors.feeding}</p>}
                </div>
              )}
              {formData.feedingType === 'breastfeeding' && (
                <div>
                  <label className={labelClass}>時長 (分鐘)</label>
                  <input
                    type="number"
                    placeholder="例如：20"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className={inputClass}
                  />
                  {errors.feeding && <p className={errorClass}>{errors.feeding}</p>}
                </div>
              )}
              {formData.feedingType === 'solid' && (
                <div>
                  <label className={labelClass}>備註</label>
                  <input
                    type="text"
                    placeholder="吃了什麼..."
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className={inputClass}
                  />
                </div>
              )}
            </>
          )}

          {/* 睡眠 */}
          {type === 'sleep' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>開始時間</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>結束時間（選填）</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>睡眠時長 (分鐘)</label>
                <input
                  type="number"
                  placeholder="例如：120"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className={`${inputClass} ${errors.duration ? 'border-coral' : ''}`}
                />
                {errors.duration && <p className={errorClass}>{errors.duration}</p>}
              </div>
              <div>
                <label className={labelClass}>睡眠品質</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'good', label: '😊 很好' },
                    { value: 'normal', label: '😌 正常' },
                    { value: 'poor', label: '😣 不佳' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({...formData, quality: opt.value})}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        formData.quality === opt.value
                          ? 'bg-rose text-white'
                          : 'lg-sm text-white/50 hover:text-white/85'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                  placeholder="例如：第一次翻身"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`${inputClass} ${errors.title ? 'border-coral' : ''}`}
                />
                {errors.title && <p className={errorClass}>{errors.title}</p>}
              </div>
              <div>
                <label className={labelClass}>Emoji</label>
                <div className="grid grid-cols-5 gap-2">
                  {['🎉', '😊', '😄', '🔄', '🪑', '🚼', '😁', '🗣️', '👣', '👏'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({...formData, icon: emoji})}
                      className={`py-2 px-3 rounded-lg text-xl transition-colors ${
                        formData.icon === emoji
                          ? 'bg-rose'
                          : 'lg-sm hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  placeholder="描述這個里程碑..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="3"
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
                  placeholder="給 Louise 的信"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>內容</label>
                <textarea
                  placeholder="寫給 Louise 的話..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="8"
                />
              </div>
            </>
          )}

          {/* 健康記錄 */}
          {type === 'health' && (
            <>
              <div>
                <label className={labelClass}>類型</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '生病', label: '🤒 生病' },
                    { value: '就醫', label: '🏥 就醫' },
                    { value: '用藥', label: '💊 用藥' },
                    { value: '疫苗', label: '💉 疫苗' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({...formData, healthType: opt.value})}
                      className={`py-2 px-2 rounded-lg text-xs transition-colors ${
                        formData.healthType === opt.value
                          ? 'bg-rose text-white'
                          : 'lg-sm text-white/50 hover:text-white/85'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  placeholder="描述健康記錄..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className={`${inputClass} resize-none`}
                  rows="3"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-rose text-white py-3 rounded-lg font-bold hover:bg-rose-deep transition-colors active:scale-[0.98]"
          >
            保存
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickRecord;
