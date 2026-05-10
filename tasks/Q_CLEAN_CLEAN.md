<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 安全清理：tailwind 未用顏色 + @types

## Step 1：驗證顏色未被引用

已確認：grep `text-rose|bg-rose|bg-accent|text-accent|bg-teal|...` 在 `src/` 中無任何匹配。所有顏色定義確實未使用。

## Step 2：清理 tailwind.config.js — 移除未用顏色

修改 D:\louise-growth-tracker-gh-pages\tailwind.config.js：

找到 `colors: {` 區塊，將其從原本的：

```js
colors: {
  /* 主色層級 - 玫瑰粉系 */
  rose: '#e8909a',
  'rose-light': '#f0b8c0',
  'rose-deep': '#c06878',
  /* 強調色 */
  'accent-warm': '#f5a85c',
  'accent-cool': '#7acaca',
  /* 其他原有顏色 */
  peach: '#e8a87c',
  teal: '#7acaca',
  mauve: '#b09acc',
  sage: '#8ac8a0',
  amber: '#e8c880',
  sky: '#80b8e0',
  coral: '#e89090',
  /* 背景色 */
  'bg-dark': '#1e0d14',
  'bg-light': '#f5f1ed',
  'bg-secondary': '#2d1420',
  'bg-tertiary': '#3a1f2d',
},
```

改為：

```js
colors: {
  /* 保留給未來使用 */
},
```

或更徹底：直接移除整個 `colors:` 區塊（因為無任何 Tailwind 顏色 class 在 src 中使用）。

保留 `fontFamily`、`spacing`、`animation`、`screens` 等配置不動（它們可能被間接使用或保留給未來配置）。

## Step 3：移除未使用的 @types

```bash
cd D:\louise-growth-tracker-gh-pages
npm uninstall @types/react @types/react-dom
```

這兩個是 TypeScript 型別定義，專案無任何 `.ts`/`.tsx` 檔案，完全不影響功能。

## Step 4：構建驗證

```bash
cd D:\louise-growth-tracker-gh-pages
npm run build
```

確認：
- 構建無錯誤
- dev 正常運行
- 所有功能不受影響
