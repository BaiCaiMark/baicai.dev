# Site Measure Studio 2.0 — 現場量尺與加工邊標記設計紀錄
日期：2026-11-07
狀態：設計決議／實作進行中；未發佈、未代表通過所有測試

## 產品邊界
- **Site Measure Studio 是現場量尺工具（measurement first），不是 CAD 繪圖軟體或 CNC 加工核准系統。**
- 核心流程：選模板 → 輸入實測尺寸及 cabinet/overhang → 視覺核對 → 標記必要加工邊 → 輸出 PDF / DXF。
- 本機 IndexedDB 自動儲存與可下載的工程備份；**不要求登入、雲端同步或跨裝置協作**。
- 滿螢幕畫布是工作台，幾何與尺寸資料是權威來源；視窗縮放不改變真實尺寸。

## True Form Studio 原始碼核對
來源：C:\BaiCai\Codex\True Form Studio\_development\v070-p5-integrated\src\TrueForm.Geometry\Manufacturing\PartModel.cs
- EDGE_POLISH、CUTOUT_POLISH：ACI 3，標準 CAD 綠色（#00FF00）。
- CUTOUT_NO_POLISH：ACI 1，標準 CAD 紅色（#FF0000）。
- EDGE_NO_POLISH：True Form Studio 的 Process() 對此圖層回傳 CUT；並非純粹以紅色判定，所以**不能單靠顏色替代加工語義**。
- Miter：特定 true-color `#CD6928`（橙褐色），不是一般近似黃橘色。MITER 並非單純的一個可直接核准的機台加工輸出。
- EDGE_CUT：ACI 7；FAUCET_HOLE：ACI 9。上述是 TFS 程式規則，不代表 Site Measure 當前已實作其完整輸出與驗證。

## Site Measure 現狀（核對 2026-11-07）
來源：app/tools/site-measure/core/model.ts；components/MeasureCanvas.tsx；components/CanvasDirectEditor.tsx；studio.css；core/export-dxf.ts
- 每個 Part 已有 `treatments[edge]`（polish/no-polish/miter）、`openEdges` 及各邊 allowance，均能納入本機工程資料。
- 畫布以 SVG `data-treatment` 呈現部分狀態；既有 CSS 對 polish/miter 取近似配色、no-polish 沒有一致的專屬標示；選取高亮可能遮蔽加工色。
- 現行 DXF 匯出使用 SM_TOP、SM_CABINET 等現場量尺圖層，**尚未按製造加工語義匯出 EDGE_POLISH/EDGE_NO_POLISH/MITER**。不能將現場 DXF 視為 TFS/CNC 已核准的生產檔。
- 既有 setTreatment() 與 setEdgeOpen() 的預設值邏輯可能會連動 allowance。新增「現場加工標記」操作時，應避免不經使用者同意變更已輸入的測量或 overhang。

## V2 UX 方向
1. 已定義完成品的邊線可被點選；cabinet 參考虛線不可被當成加工邊。
2. 邊線直接以加工狀態顯示：Polish 綠色、No Polish 紅色（須配合線型/文字，避免只靠顏色辨識）、Miter 對應 TFS `#CD6928`。未設定用中性色；**未設定 ≠ No Polish**。
3. 選取指示獨立於加工色，例如外圈 halo，不要用黃色蓋掉加工屬性。
4. 一般模式：點選邊線，局部浮動工具直接改標記；批次模式：先選 Polish / No Polish / Miter，再連續點選多條成品邊；明確退出批次模式。
5. `OPEN` 是物理露邊/參考輸入，`Treatment` 是加工要求，`Allowance` 是尺寸計算；三者各自記錄，預設建議不得靜默改動實測值。
6. 明確區分尺寸文字與邊線點擊命中區，保留單指選取、空白平移與雙指中心縮放。
7. 對應 PDF 圖例與 DXF 的建議性註記可後續規劃；任何 TFS 加工圖層映射必須另行驗證，不應默默把現場標記升格成機台核准資料。

## 實作與驗證關卡
- 首先修正畫布邊線顏色、選取顯示與快速標記交互；再加入連續點選模式。
- 針對「只修改 treatment 不影響尺寸與 allowance」、UNDO/REDO、本機儲存/重啟恢復、旋轉/鏡射後的邊線對應、iPhone/平板觸控命中加入回歸測試。
- PDF/DXF 如承載加工標記，必須標明 `FIELD REFERENCE / NOT MANUFACTURING APPROVAL`，並與 True Form Studio 製造圖層分離直到通過相容性與幾何驗證。
- 此文件不宣稱本項目已完成或已推送 GitHub / Vercel。

## 2026-11-07 補充決議：交付格式與製造責任邊界
- **階段一：以 PDF 作為現場量尺的主要交付成果**。PDF 清楚傳達現場量測值、尺寸計算、參考圖形、露邊與 Polish/Miter 等加工意圖；尺寸數值應準確，模板輪廓尚不代表已通過加工幾何驗證。
- **DXF 功能程式碼保留，不刪除**。既有 DXF 匯出可以保留作為研發／後續驗證能力；何時在正常工作流程開放或提升其地位，待真實工地案例與 True Form Studio 匯入／修圖實測後決定。
- **Site Measure Studio 的角色：現場測量、資訊紀錄、初步形狀和加工意圖表達，提供 PDF／將來的參考 DXF。** 不負責刀路、加工 allowance、毛邊生成、製造工序確認或 CNC 核准。
- **True Form Studio 的角色：接收並核對圖紙，確認加工幾何、Part 輪廓閉合與精度、Polish／No Polish／Miter 等製造工序，產生與驗證供下游使用的加工資料。** 現場標記須經 TFS 或人工確認才能成為製造指令。
- 期望的未來鏈路是 **Site Measure Studio → True Form Studio 人工核對／必要修改 → Pegasus／CNC**，並非 Site Measure Studio 直接送機台。即使將來 DXF 輸出更成熟，這個審查關卡仍應保留。
- UI／文案應避免把參考 DXF 的未核准狀態描述成「DXF 技術不足」；這是兩套產品有意的責任分工。不要讓製造層面的完整性要求阻礙現場工具盡快改善實際量尺體驗。

## 2026-11-07 產品最高優先級：行動觸控量尺體驗
- 使用者再次確認：**Site Measure Studio 的核心不是 Drawing，而是手機／平板上的 Measurement Experience。** 舒服、快速、不容易輸錯地記錄現場尺寸，比增加製造功能或複雜 CAD 操作更重要。
- UX 驗收必須以真實 iPhone 與 Android 平板觸控為主，不僅靠桌面瀏覽器模擬；橫直屏與軟鍵盤出現時仍能輸入和查看。
- 單指在空白處可平順平移，雙指以手指中點為錨點縮放且畫面不亂跳；觸控操作不應造成網頁本身捲動。
- 點尺寸可直接編輯、支持常用 inch 小數與分數；點 finished countertop 邊線可直接修改加工標記；兩個點擊目標不能混淆。
- 工具列不應佔走畫布空間，操作步驟與表單層級保持最少，觸控命中區適合手指；本機自動存檔可靠，能再開啟未完成的工程。
- 開發排序／實案驗收：先改善手機全螢幕工作區、手勢與尺寸輸入，再把快速加工顏色標記整合進同一畫布；PDF 交付優先，DXF 仍保留為後續驗證路線。

## P2 交互實作紀錄
- 沉浸式工作區頂部以「✎」（Edge marking）按鈕進入快速標記模式。選 Polish、No Polish 或 Miter 後可以連續點選多條 finished 邊；Done 離開。一般點選邊線仍可開啟細節編輯。
- 三種現場顏色沿用 TFS 語意：Polish 綠色 #00FF00；No Polish 紅色 #FF0000；Miter 橙褐色 #CD6928。No Polish/Miter 使用虛線以輔助辨識；選取以獨立 halo 顯示，不能遮蓋加工顏色。
- 新增 Part 的 OPEN/overhang 預設是建議，不會自動把預設加工類別渲染成已確認的彩色標記。只有明確標記才讓新 Part 的邊線上色；保留既有歷史工程內容。
- 點加工標記只修改 `treatments[edge]`，不變更尺寸、cabinet、allowances、OPEN、幾何；支援 Undo/Redo、IndexedDB 儲存與備份。
- PDF 的 completed finished perimeter 同步呈現彩色加工意圖，附現場參考／非製造核准的文字；DXF 既有輸出維持不變。
- 基礎確認：94 項單元／幾何／輸出測試通過；2 項 P2 瀏覽器測試、4 項沉浸式／手勢控制測試通過；ESLint、TypeScript 與 Next.js production build 驗證。
- **實機驗收仍待使用者在手機上確認**：顏色視認、Quick Mark 選取邊線、Undo/Redo、切換 Area、PDF 顏色與頁面可讀性。
