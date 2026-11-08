# Site Measure Studio 2.0 — 沉浸式畫布控制（2026-11-07）

## 現場手機測試回饋
使用者在 iPhone 實測滿螢幕 Preview 後，認為畫布手感良好，右下角的 Snap / Ortho / ＋ / − / Fit All 長駐工具列不符合小螢幕的簡潔需求。浮動表單後續單獨優化。

## 決定
- **完全移除右下角長駐控制列**，畫布只保留必要的情境式控制。
- **單指平移及雙指以手指中心縮放維持原樣**。不需 ＋ / − 按鈕。
- **Fit All：連續兩次輕點畫布空白處**，復位顯示全部 Parts；不對 Part、邊線、尺寸標籤或雙指操作觸發。仍在右上角「⋯ → Canvas → Fit All」提供可探索的替代入口。
- **Snap：預設 ON**。移至「⋯ → Canvas」內，偶爾才需要關閉。
- **Ortho：預設 OFF**。它是將 Part 移動限制於水平或垂直方向的輔助功能；同樣只在「⋯ → Canvas」內調整。
- 不修改測量資料、几何運算、PDF / DXF 內容、本機儲存、加工層語義。
- **保留目前尚在進行中的加工邊上色 WIP**，本批控制精簡獨立開發和測試，不碰未完成變更。

## 驗證
- Playwright mobile 390×844：檢查畫布無右下控制列、Touch 雙擊空白 Fit All、預設 Snap/Ortho、設定切換。
- Playwright tablet 800×1100：檢查 Fit All 菜單復位與非長駐控制。
- 完成後需回歸沉浸式工作區測試，並通過 TypeScript、ESLint、production build。
- 雙擊手勢仍需在實際 iPhone Safari / Android Chrome 上操作驗收，模擬測試不等同實機。
