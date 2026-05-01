import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icons from './shared/Icons';

const Onboarding = ({ onComplete }) => {
  const { user, setUser } = useApp();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user.name || '',
    birthDate: user.birthDate || '',
    gender: user.gender || 'female',
    birthWeight: user.birthWeight || '',
    birthHeight: user.birthHeight || ''
  });

  const steps = [
    {
      icon: '👶',
      title: '歡迎使用',
      subtitle: 'Louise 成長記錄',
      description: '記錄每一個珍貴的成長瞬間\n查看 WHO 成長曲線對比\n隨時備份，數據安全'
    },
    {
      icon: '✏️',
      title: '基本資料',
      subtitle: '告訴我們寶寶的信息',
      isForm: true
    },
    {
      icon: '🎉',
      title: '準備好了！',
      subtitle: '開始記錄成長數據吧',
      description: '你可以記錄：\n體重、身高、頭圍\n餵食、睡眠、健康記錄\n還有重要的里程碑時刻'
    }
  ];

  const handleNext = () => {
    if (step === 1) {
      // Save form data - don't spread old user, use new data directly
      if (formData.name && formData.birthDate) {
        setUser({
          name: formData.name,
          birthDate: formData.birthDate,
          gender: formData.gender,
          birthWeight: formData.birthWeight ? parseFloat(formData.birthWeight) : null,
          birthHeight: formData.birthHeight ? parseFloat(formData.birthHeight) : null
        });
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const canProceed = step !== 1 || (formData.name && formData.birthDate);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#1e0d14] to-[#2d1420] flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4 flex-shrink-0">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? 'bg-rose' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Content - scrollable if needed */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto py-4">
        {steps[step].isForm ? (
          <div className="w-full max-w-sm pb-4">
            <div className="text-center mb-8">
              <p className="text-5xl mb-4">{steps[step].icon}</p>
              <h2 className="text-2xl font-bold text-white/85 mb-1">{steps[step].title}</h2>
              <p className="text-white/50">{steps[step].subtitle}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">寶寶暱稱</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：Louise"
                  className="w-full lg-sm px-4 py-3 text-white/85 placeholder-white/28 bg-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">出生日期</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 text-white/85 bg-white/6 border border-white/12 rounded-lg backdrop-blur-[12px] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">性別</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`py-3 rounded-lg text-sm transition-colors ${
                      formData.gender === 'female'
                        ? 'bg-rose text-white'
                        : 'lg-sm text-white/50 hover:text-white/85'
                    }`}
                  >
                    👧 女孩
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`py-3 rounded-lg text-sm transition-colors ${
                      formData.gender === 'male'
                        ? 'bg-rose text-white'
                        : 'lg-sm text-white/50 hover:text-white/85'
                    }`}
                  >
                    👦 男孩
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/50 mb-2">出生體重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.birthWeight}
                    onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                    placeholder="例如：3.2"
                    className="w-full lg-sm px-4 py-3 text-white/85 placeholder-white/28 bg-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">出生身高 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.birthHeight}
                    onChange={(e) => setFormData({ ...formData, birthHeight: e.target.value })}
                    placeholder="例如：50"
                    className="w-full lg-sm px-4 py-3 text-white/85 placeholder-white/28 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-6xl mb-6">{steps[step].icon}</p>
            <h2 className="text-3xl font-bold text-white/85 mb-2">{steps[step].title}</h2>
            <p className="text-white/50 text-lg mb-6">{steps[step].subtitle}</p>
            {steps[step].description && (
              <div className="text-center space-y-2">
                {steps[step].description.split('\n').map((line, i) => (
                  <p key={i} className="text-white/50 text-sm">{line}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="px-8 pb-12 pt-4">
        {step < steps.length - 1 ? (
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-lg text-white/50 hover:text-white/85 transition-colors"
            >
              跳過
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                canProceed
                  ? 'bg-rose text-white hover:bg-rose-deep'
                  : 'bg-white/10 text-white/28 cursor-not-allowed'
              }`}
            >
              {step === 0 ? '開始' : '繼續'}
              <Icons.arrow className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-lg font-bold bg-rose text-white hover:bg-rose-deep transition-colors flex items-center justify-center gap-2"
          >
            <Icons.check className="w-5 h-5" />
            開始使用
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
