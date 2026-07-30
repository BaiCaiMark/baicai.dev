# Codex 執行規格：使用品牌素材重構 baicai.dev

## 目標

在保留現有網站內容、路由與功能的前提下，使用本素材包重構視覺系統。網站應呈現：

- 沉穩、神祕、具有未來感；
- 仍然溫暖、可閱讀，不做電競式介面；
- 清楚區分「A1 完整徽章」與「Future B 核心 Logo」的用途；
- 適合未來加入 `/tools`、`/notes`、`/lab`、`/about` 等內容。

## 執行順序

1. 先檢查專案技術棧、路由、樣式方案、部署設定與現有元件。
2. 不刪除內容、不更改 URL、不破壞 SEO，也不要重建與任務無關的功能。
3. 將本包的 `assets` 放入框架的公共靜態目錄，例如：
   - Next.js／Vite：`public/brand/`
   - Astro：`public/brand/`
4. 將 `styles/brand-tokens.css` 合併到全域樣式；若專案使用 Tailwind，將對應顏色加入 theme tokens。
5. 建立可重用的 `BrandLogo` 元件：
   - 桌面：Future B + 即時文字 `baicai.dev`
   - 窄版：只顯示 Future B
   - 不要把文字烘焙成圖片作為主要導航識別。
6. 導航列使用 `logo-mark-primary.svg`，尺寸 28–36px。
7. 首頁或 About 使用 A1：
   - 優先 `baicai-watcher-a1-1024.webp`
   - 顯示寬度 260–480px
   - 不能拿 A1 當 16px／32px 圖標。
8. 更新網站 metadata：
   - favicon SVG + ICO
   - Apple Touch Icon
   - Web Manifest
   - theme-color `#071015`
9. 使用 Future B 製作工具卡片或分類圖標時，只能做輕微變體，不要創造另一個品牌。
10. 完成後執行現有的 lint、typecheck、test 與 production build。

## 首頁建議結構

- Navigation：Future B + `baicai.dev`
- Hero：
  - 左側：網站名稱、簡短介紹、主要入口
  - 右側：A1 白菜守望者
- Content：
  - Tools
  - Notes
  - Lab / Experiments
  - About
- Footer：Future B 單色版 + 簡短版權資訊

## 視覺規則

- 主背景使用 `#071015`，卡片使用 `#0E1D22`。
- 避免全頁高亮綠；主綠只用於品牌、連結、焦點與少量邊框。
- 文字對比必須符合可讀性，正文不要使用低對比綠色。
- 動畫要輕：淡入、細微浮動、節點脈衝；尊重 `prefers-reduced-motion`。
- 不能增加矩陣雨、持續掃描線、強烈 glitch 或大面積粒子背景。
- 手機端先保證內容與觸控體驗，不要為視覺犧牲效能。

## 驗收標準

- 16px favicon 可辨識，沒有糊成一團。
- 320px 寬手機不溢出。
- A1 不會在首屏壓過主要文字與 CTA。
- 深色與淺色模式（若網站已有）均可辨識。
- 所有圖片有合理尺寸、alt 與 lazy-loading 策略。
- Lighthouse／建置結果不得因素材明顯退步。
- 提交前列出改動檔案、設計決策、測試結果與仍需 Mark 決定的項目。
