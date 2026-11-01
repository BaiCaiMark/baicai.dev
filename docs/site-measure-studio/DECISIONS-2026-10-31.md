# Site Measure Studio — 2026-10-31 語音討論決策補充

> 狀態：規劃記錄；尚未開發或啟用自動化。母文件：`PRODUCT-PLAN.zh-TW.md`。

## 現場尺寸的語義與快速輸入

- 記錄櫃體實測尺寸（cabinet size）、overhang（伸出量）、以及計算得到的 countertop 最終尺寸，避免只記一個沒有來源的數字。
- 例：`Cabinet 59" + Overhang 1" = Countertop 60"`；`Cabinet depth 21" + Front overhang 1.5" = Countertop depth 22.5"`。
- overhang 需明確標示邊／方向（Front、Back、Left、Right）、單位、值的來源及狀態（實測／預設／待確認／計算），不得把計算結果冒充現場實測。
- 考慮在整個 Job 設定預設，按 Kitchen／Bathroom 覆寫，也可為單個 shape／edge 調整；每個實例保存實際套用值，不能讓日後修改預設意外更動舊圖。
- 核心標準是比手寫量尺筆記更少輸入、更清楚。先用真實現場筆記驗證介面，不提前發展成完整 CAD。

## PDF 與 DXF

- PDF 是第一級交付物：讓只拿到 PDF 的繪圖師看得到尺寸的構成，例如 `59" + 1" = 60"`，並理解各部分代表 cabinet 還是 overhang。
- DXF 仍提供真正可測量、可編輯的幾何；PDF 和 DXF 應來自同一份工程資料，保持數值一致。

## 輕量與離線

- 速度、現場順手、持續快速迭代優先。離線／PWA 是加分項，不列為 V0.1 必達驗收。
- 若未來啟用 Service Worker，需驗證版本更新、舊快取與工程資料相容性；目前未實作離線功能。

## baicai.dev 全站依賴管理

- 建議 GitHub Dependabot 每週追蹤 npm 第三方套件（如 DXF、PDF 等）的版本變化；安全漏洞優先評估。
- 由 GitHub Actions 執行幾何、單位、PDF／DXF 輸出等自動化回歸測試，搭配 Vercel Preview 操作驗收。
- 更新提案不是自動升級。先評估 Bug 修復、效能、相容性與包體大小，再人工審核。
- 不自動合併 main，不自動部署正式網站；同一維護策略可服務 A5 Converter 和未來的 Site Measure Studio。
- **此時只是規劃紀錄，尚未啟用 Dependabot、Actions 或任何部署。**

## 2026-10-31 開發授權後補記

- 已授權 Phase 0 / Phase 1，在 feat/site-measure-v0.1 內開發與驗證；正式發布及啟用 Dependabot/Actions 仍須另行授權。
- Project 預設＋Shape/Edge 覆寫正式採用，Area 層延後。實例保存值快照；全域修改不改舊圖。
- 一般 Cabinet + Overhang 不自動加入門板厚度，也不要求門板量測。
- 兩組完整尺寸若互相矛盾，保留輸入並阻止成品輪廓；未知與無伸出 0 分開。
- PDF 中文字型採自託管 Noto Sans TC（OFL），jsPDF 向量輸出；未支援字元明示失敗。DXF 使用閉合原生輪廓與分層參考。
- 旋轉／鏡像保持 edge ID 與模板定位方向，輸出列出方向，避免把圖面左側與原模板左側混淆。
- 詳細實作與驗證紀錄見 V0.1-IMPLEMENTATION.md。Android/Huawei、AutoCAD 及工廠驗收仍未通過實機驗收。
