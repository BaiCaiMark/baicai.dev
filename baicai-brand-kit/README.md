# baicai.dev 品牌素材包

這套素材採用「雙層品牌」：

1. **A1 白菜守望者徽章**：完整的角色形象，代表 Mark 的內在精神——安靜、神祕、觀察、學習、連接現實與科技。
2. **Future B 核心 Logo**：網站的正式識別，適合導航列、favicon、GitHub、PWA 與小尺寸圖標。

## 資料夾

- `assets/badge/`：A1 完整徽章。請用於首頁 Hero、About、404、個人／社群頭像。
- `assets/logo/`：Future B 向量 Logo、單色版、水平組合與 PNG 尺寸。
- `assets/favicon/`：favicon、Apple Touch Icon、PWA 圖標與 manifest。
- `assets/social/`：社交分享卡。
- `styles/brand-tokens.css`：品牌色彩與基礎尺寸。
- `snippets/`：HTML 與 React/Next.js 範例。
- `BRAND_GUIDE.md`：設計規則。
- `CODEX_IMPLEMENTATION.md`：交給 Codex 的重構要求。
- `PROMPT_FOR_CODEX.md`：可直接貼給 Codex 的提示詞。

## 最重要的使用規則

- **導航列／favicon 使用 Future B，不能使用 A1。**
- **A1 最小建議顯示寬度為 160px，理想為 260–480px。**
- Future B 在 16–24px 使用 `logo-mark-micro.svg` 或 `favicon.svg`。
- 不要把整個網站做成高亮電競霓虹風。綠色是重點，不是背景噪音。
- 優先使用 SVG；PNG 僅作相容與社交平台輸出。


## 目前完成度

請再閱讀 `STATUS_AND_NOTES.md`。Future B 已是可縮放 SVG；A1 目前是經整理的概念圖素材，適合網站使用，但日後仍可重新精修高解析主檔。
