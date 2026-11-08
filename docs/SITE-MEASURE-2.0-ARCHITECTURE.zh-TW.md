# Site Measure Studio 2.0 — Workspace 與跨平台決策

更新：2026-11-07 · Phase 1 工程草案

## 產品方向

「模板是起點，不是限制。」（Start with a template. Work without limits.）

- 工程（Project）是一張主要的無邊際畫布；各 Part 在相同座標系自由擺放。
- Room / Area 僅為可選 metadata，不是強制切換的獨立畫布。
- 工作區沉浸式：工作頁佔滿可用 viewport，沒有網站導覽、Footer 或內外雙重捲動。
- 手機操作優先：單指拖曳空白處平移；雙指以手指中點縮放；點尺寸進行編輯；需要時才浮出操作。
- 尺寸與 Edge note 跟隨幾何邊線方向；倒置文字自動翻轉；Canvas note 可配 Leader line。
- 數值欄位保留測量來源、原始輸入、允許未確認；CNC／DXF 不可用虛構尺寸填補。

## Phase 1：沉浸式視窗 — 目前分支

- 分支：feat/site-measure-v2-immersive。
- 開啟工程進入滿視窗工作區，隱藏網站 Header / Footer。
- 只保留浮動的 Projects、Undo/Redo、Add、Part、Options 按鈕，縮放控制靠畫布右下。
- Project hub 仍能開啟舊工程、新建工程與匯入備份。
- 檢驗：iPhone 390×844、Android 平板 800×1100、視口與工具可達性、PDF/DXF 回歸。
- 不在 Phase 1 強行變更 Project schema；目前不同 Area 仍是舊版工作資料結構，不可宣稱已達到真正的一張跨 Room 畫布。
- Phase 1 以獨立分支與預覽驗收，不直接替換正式網站。

## Phase 2：統一 Project Canvas

- 從 data model 解耦 Area 作為強制容器的限制；Part 各自具有穩定 ID、可選 Room ID、專用 layout 世界座標。
- 提供從舊 Project.areas[*].shapes 安全遷移；保留舊版備份的 round-trip 與回退路徑。
- 混合房型全案 Fit All、部分框選、跨 Room 的選取與移動。
- 視覺 layout 與 mm 真正幾何尺寸分離；移動 Part 不得改動 DXF 實體。

## Phase 3：Template 與幾何標註

- Blank、Kitchen + 1 Bathroom、Kitchen + 2 Bathrooms。
- 自訂工程可存為 Template；所有量測值拷貝至新工程預設 unconfirmed，避免把舊數值當現場實測。
- 角度尺寸標籤使用線方向變換及 flip，提供短邊溢位與 Notes 遮擋 fallback。

## Web / PWA / Android 對照

1. **Web 工作頁：** 無需安裝、連結即用、單一前端快速更新。缺點是瀏覽器 UI、儲存限制與手勢衝突，必須自行修正。
2. **PWA：** 已有 manifest display: standalone 與 service worker；從主畫面啟動可去掉多數瀏覽器 UI。仍是 Web 引擎，需要檢驗快取、離線與 IndexedDB 資料備份。部分 Android 非 GMS 裝置可能只有瀏覽器捷徑。
3. **Capacitor Android：** 以原網頁 UI + TS 核心包在 Android 容器，增加原生檔案、相機與 API 接口的可能；但不會自動改善 Web Canvas 的捏合與畫圖速度，且需要 Android Studio、簽章和發布維護。
4. **Kotlin/Compose 原生：** 操控 stylus、palm rejection、low-latency drawing 與原生檔案最有潛力；但必須另寫 UI/rendering/interaction，成本最高，不宜在產品模型未穩定前開始。

**當前建議：Web 2.0 + PWA 優先；並行研究 Android Capacitor 技術可行性，不在第一輪重寫 Android 原生。**

## 避免未來雙份工程

- 保留 TS 純函數 core：model、units、geometry、worksheet、DXF/export data。
- 將 Canvas interaction / transform、Storage adapters、platform file saving 分層。
- Android 包裝前先驗證 Next.js 適用的 client bundle / static export 配置；不能假設整個 baicai.dev Next 網站可直接塞進 WebView 當離線 APK。
- Project schema、migration、幾何輸出測試須平台共用。版本化本機資料並提供外部備份。

## 驗收 Gate

- 手機進工作區後，空白平移與雙指縮放不觸發網頁捲動；雙指中心不漂移。
- 文字、Notes、按鈕可讀可點，浮層不遮擋現場要填的資料。
- 一個 Project 中可直接看到 Kitchen 與 2 Bathroom 的 Parts（Phase 2）。
- 關網路重啟後仍可開啟及儲存，PDF/DXF 輸出一致。
- 不經「儲存備份」的 IndexedDB 不是唯一安全副本；關鍵現場資料必須支援明確備份。

## P3.1 · Project Shared Canvas（2026-11-07，Preview 分支）

**本輪完成的是跨 Room 共用畫布與相容性底座，尚非完整 Part/Room 資料模型扁平化。**

- `projectCanvasItems()` 將所有 `areas[*].shapes` 投影至同一 SVG，座標只供視覺排版，不作測量及 CNC 原點。
- `adoptSharedCanvas()` 對舊工程作一次非破壞性 clone：保留第一個非空 Room 的排版，後續 Room 移至下方；設定可選的 `canvasLayout: 'shared-v1'` 標記，重新開啟不重複移動。
- 保留既有 schemaVersion 2 與 `areas` 儲存格式，舊備份可讀；不重排 ID、尺寸、Overhang、Notes、Sink 或 Edge Treatment。
- 點擊跨 Room Part／Edge 會同步切換目前 Room；移動與 Paint 按 Part ID 寫回正確 Room。Room 選單可快速聚焦區域，但所有 Parts 仍在同一 Canvas；Fit All 顯示整個 Project。
- 新增 Part 放於全 Project 現有 Parts 下方；不再從各 Room 原點重新開始造成重疊。
- 第一輪回歸：96 個核心測試；P1/P2 及 Project Canvas 的新瀏覽器測試需保持綠燈，另執行 type-check、lint、production build。
- **限制**：`Shape` 仍位於 `Area.shapes`，尚未將 `roomId` 改為可選 metadata；跨 Room 的真正自由重新分類、Canvas overview PDF、框選、旋轉尺寸文字自動翻轉，屬後續 P3.2+。舊瀏覽器測試部分仍使用 P1 以前的常駐工具列定位器，需另作更新，不能誤報為整套已通過。
- 所有功能留在 `feat/site-measure-v2-immersive` Preview，不合併 `main`；現場資料應保留 JSON Backup。若需要回退，可使用 Preview 分支前一提交，舊工程 schemaVersion 2 仍可讀（新 `canvasLayout` 欄位需在回退前從備份移除或使用當前分支重新開啟）。

**下一步**：P2 iPhone 真機確認連續 Paint 手感；P3.2 將 Room 真正變成可選 Part metadata，完善建立 Room／改分類／全案 overview 的 UX；再做尺寸標籤沿線旋轉與自動可讀翻轉。PDF 現場交付優先，DXF 的切割幾何仍由 True Form Studio／AutoCAD 驗證。

## P4.1 · Dimension labels on the canvas（2026-11-07 · V2 Preview）

- 現場量尺優先：不增加 Room／Part 管理層級，直接改善尺寸的閱讀及點擊體驗。
- `components/dimension-label.ts` 為純視覺函式：依 SVG 線段方向計算文字角度，控制落在 [-90°, 90°)，任何反向邊線都不會把文字倒過來。
- Dimension background、公式、Finished 值與第一則 Edge Note 共同依邊線方向排列。Edge Note 向幾何外側排列。
- 短於標籤寬度（含安全邊距）的邊，把標籤向外移開並加虛線 leader；不更改已量尺寸，不宣稱外推位置為實測座標。
- 將可點選的尺寸卡放在透明 Edge Hit Corridor 上層，手機能直接點標註開啟 Dimension Editor；點線段仍由原有 Edge/Paint 行為處理。
- 99/99 核心測試、11/11 P1/P2/P3/P4 相關 Chromium 測試通過；TypeScript、ESLint、Next.js build 通過。
- `schemaVersion`、IndexedDB 格式、`exportSnapshot`、PDF/DXF 的數值與製造幾何均不變。
- 保持 Preview 分支 `feat/site-measure-v2-immersive`，不合併 `main`；實機 iPhone／Android 平板的手勢、標籤重疊及長公式仍待人手驗收。

**後續優先**：P4.2 完善長公式、短邊與相鄰 Part 標籤避讓；P4.3 現場自由 Note／偏移牆線的語義與 PDF，始終區分示意線與可用於 CNC 的實測幾何。Room 仍維持可選輔助分類，不應阻擋第一次量尺。

## P5.1 · Project-level Canvas Note（2026-11-07，V2 Preview）

- 入口：Immersive Workspace 的 `＋` → `＋ Note · field annotation`；不用先選 Part 或 Room。點畫布指定目標 pin，直接輸入文字，按 Save 才建立正式紀錄；Cancel 不留下空白 Note。
- 圖上顯示可拖曳備註卡片及獨立指向點（Leader Line）。拖曳只移動卡片，原來的目標點保持固定。點卡片可編輯全文、重新指定指向點（Move pin）、刪除；Undo/Redo 可還原資料異動。
- 每個 Note 在 `Project.canvasNotes[]`，id、text、x/y（卡片世界座標）、targetX/targetY（目標點）分別保存。限 100 個 Note，每個最多 800 字；無效座標及重複 id 拒絕匯入。
- schemaVersion 沿用 2，欄位可選以讀取歷史備份；新工程初始化空陣列。IndexedDB 自動保存、Project JSON Backup、匯入和重新開啟支援 Notes。
- 渲染 preview 最多四行，英中混合文字按近似字寬換行；編輯器保留所有原始內容。Note 是示意註記，不是測量幾何。
- **P5.1 範圍限制**：Canvas Note 不包含在 PDF／DXF 匯出中。PDF Export 面板明確提示這點。P5.3 需將這些備註列入 Field Report，並規劃圖面 Overview／Leader Line。現階段對外傳遞 Notes 請下載 Project JSON Backup，或在已支援的 Part/Edge Notes 裡記錄重要文字。
- 舊專案的尺寸、Overhang、Sink、Edge Treatments、PDF/DXF 幾何不因新增或移動 Canvas Note 而改動。目標是比紙筆快，尚不新增任意 CAD 製造幾何或複雜 Room 系統。

## P5.1.1 · Leader Line 直接點選（2026-11-08）

- 橙色 Note 引線使用透明、44px 非縮放 stroke hit zone；點擊線段可直接編輯 Note，滑動線段仍平移畫布，不拖動 Note 卡片。
- 鍵盤 Enter / Space 可由引線進入編輯。只有在卡片內拖曳才更改卡片位置，目標 pin 保持原位。新增手機觸控與拖曳回歸測試；與既有 Edge 命中範圍區隔。

## P5.2.1 · Schematic Wall Sketch（2026-11-08）

- 入口：`＋` → `＋ Wall sketch · schematic`；按畫布加入折線節點，或單指／手寫筆拖曳作自由線。兩指仍可作視角手勢，單指畫線模式不把手勢當實測距離。
- 使用獨立 `Project.wallSketches[]`；每條 wall 最多 120 個節點、工程最多 50 條；schema v2 可選欄位相容舊工程。每條 `kind:'schematic'`，必須至少兩個不同的點，僅限非製造用的畫布世界座標。
- 進行中可 Undo point、Cancel、Finish wall；完成後可選取並刪除，亦可用工程 Undo 還原。資料支持 IndexedDB／JSON Backup 與重新開啟。
- 所有 Wall Sketch 視覺線條明顯採用與 CNC 輪廓不同的橙棕色虛線；不是牆尺寸比例、不是實測輪廓，不參與 cabinet、overhang、PDF 測量表、DXF。
- PDF Export 面板提示：Canvas Notes 和 Wall Sketch 在 Project Backup 保存，**尚未在 PDF 中**。下一階段 P5.2.2 應在 Wall 上選點記錄「實測偏移值 + 基準邊 + 確認狀態」，不可從自由畫線推出尺寸；P5.3 合併 Field Report。
- P5.2.1 完成手機觸控／桌面畫筆模擬回歸以及幾何隔離測試後，仍需現場 iPhone／Android 平板真機驗收；不動正式 `main`。
