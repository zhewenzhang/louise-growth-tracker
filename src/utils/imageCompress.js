// 圖片壓縮工具
// 用途：上傳給 AI 識別前壓縮，減少 token 消耗與傳輸量
// 同時保留一份較高品質的原圖供存檔

/**
 * 讀取 File 為 dataURL
 */
const fileToDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * 載入圖片
 */
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

/**
 * 壓縮圖片
 * @param {File} file 原始圖片檔
 * @param {object} opts { maxWidth, maxHeight, quality }
 * @returns {Promise<{dataURL, width, height, sizeKB}>}
 */
export const compressImage = async (file, opts = {}) => {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = opts;

  const dataURL = await fileToDataURL(file);
  const img = await loadImage(dataURL);

  let { width, height } = img;

  // 等比例縮放
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // 白底（避免透明 PNG 轉 JPEG 變黑）
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
  const sizeKB = Math.round((compressedDataURL.length * 0.75) / 1024);

  return { dataURL: compressedDataURL, width, height, sizeKB };
};

/**
 * 產生兩種尺寸：
 * - aiImage：給 AI 識別（較小，省 token）
 * - archiveImage：存檔用（較大，保留細節）
 */
export const prepareImages = async (file) => {
  const [aiImage, archiveImage] = await Promise.all([
    compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 }),
    compressImage(file, { maxWidth: 2200, maxHeight: 2200, quality: 0.85 }),
  ]);
  return { aiImage, archiveImage };
};
