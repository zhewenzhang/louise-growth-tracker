// OpenRouter 視覺模型 API 客戶端
// 用於識別手寫餵奶記錄表，回傳結構化資料
//
// ⚠️ API Key 不寫死在代碼，由用戶在設定頁填入，存於 localStorage
//    避免 key 進入 git 公開倉庫被盜用

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY_STORAGE = 'louise_openrouter_key';
const MODEL_STORAGE = 'louise_openrouter_model';

export const DEFAULT_MODEL = 'google/gemini-3-flash';

// 可選模型清單（CP 值排序）
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-3-flash', label: 'Gemini 3 Flash（推薦·手寫最準）' },
  { id: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite（省錢）' },
  { id: 'qwen/qwen3-vl-instruct', label: 'Qwen3 VL（開源備選）' },
];

// ── API Key / Model 設定 ──
export const getApiKey = () => localStorage.getItem(API_KEY_STORAGE) || '';
export const setApiKey = (key) => localStorage.setItem(API_KEY_STORAGE, key.trim());
export const hasApiKey = () => !!getApiKey();

export const getModel = () => localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
export const setModel = (model) => localStorage.setItem(MODEL_STORAGE, model);

// ── 識別 Prompt ──
const RECOGNITION_PROMPT = `你是一個專業的嬰兒餵奶記錄表辨識助手。

請仔細辨識這張手寫餵奶記錄表照片，提取所有餵奶記錄。表格欄位通常包含：日期、時間、母奶(母乳)、配方奶、小便/大便、臍帶護理、備註。

辨識規則：
1. 時間格式統一成 HH:MM（24小時制），例如「0810」→「08:10」、「1600」→「16:00」、「23:20」→「23:20」
2. 母奶和配方奶都是 ml 數字。配方奶欄位若有括號數字如「100(90)」，主要數值取 100，括號內 90 可能是實際喝的量，放進 note 備註
3. 日期格式為 YYYY-MM-DD。表格中通常寫「6/10」這種，請補上年份（若無法判斷年份，用 2026）
4. 同一個日期可能涵蓋多列，日期只在該天第一列標註，後續列沿用上方日期
5. 有刪除線或塗改的數字，以最終修正值為準
6. 備註欄的內容（如 VD、Fe、益生菌等）放進 note
7. 只提取「有餵奶數據」的列（母奶或配方奶至少一個有值），純護理記錄略過

請以 JSON 陣列格式回傳，不要有任何其他文字說明，格式如下：
[
  {"date":"2026-06-10","time":"00:24","breastMilk":120,"formula":0,"note":""},
  {"date":"2026-06-10","time":"04:30","breastMilk":0,"formula":80,"note":""}
]

breastMilk = 母奶 ml（無則填 0）
formula = 配方奶 ml（無則填 0）
note = 備註（無則填空字串）`;

/**
 * 呼叫 OpenRouter 識別圖片
 * @param {string} imageDataURL base64 dataURL（image/jpeg）
 * @returns {Promise<Array>} 識別出的餵奶記錄陣列
 */
export const recognizeFeedingImage = async (imageDataURL) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('尚未設定 OpenRouter API Key，請到設定頁填入');

  const model = getModel();

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://zhewenzhang.github.io/louise-growth-tracker/',
      'X-Title': 'Louise Growth Tracker',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECOGNITION_PROMPT },
            { type: 'image_url', image_url: { url: imageDataURL } },
          ],
        },
      ],
      temperature: 0.1, // 低溫度提升辨識一致性
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `API 錯誤 (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      msg = errJson.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 解析 JSON（模型可能包 ```json ``` code block）
  const parsed = parseJsonFromResponse(content);
  return parsed;
};

/**
 * 從模型回應中提取 JSON 陣列
 */
const parseJsonFromResponse = (content) => {
  let text = content.trim();

  // 移除 markdown code block
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // 嘗試找到 JSON 陣列
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) text = arrayMatch[0];

  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('回應不是陣列格式');
    // 正規化每筆資料
    return data.map(r => ({
      date: String(r.date || '').trim(),
      time: String(r.time || '').trim(),
      breastMilk: Number(r.breastMilk) || 0,
      formula: Number(r.formula) || 0,
      note: String(r.note || '').trim(),
    })).filter(r => r.date && (r.breastMilk > 0 || r.formula > 0));
  } catch (e) {
    console.error('JSON 解析失敗，原始回應：', content);
    throw new Error('AI 回應格式無法解析，請重試或換一張更清晰的照片');
  }
};
