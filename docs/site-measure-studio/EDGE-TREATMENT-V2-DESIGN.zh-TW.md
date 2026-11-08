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
