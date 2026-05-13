// 生成唯一 ID
// crypto.randomUUID() 在 iOS Safari 15.4+ / Chrome 92+ 支援
// 備用方案：時間戳 + 隨機字串
export const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

export default genId;
