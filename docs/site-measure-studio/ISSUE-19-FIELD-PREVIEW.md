# Site Measure Studio field preview

This preview follows the field cases recorded in [Issue 19](https://github.com/BaiCaiMark/baicai.dev/issues/19) and the [product charter](../SITE-MEASURE-PRODUCT-CHARTER.zh-TW.md).

| Field case | Preview behavior | Acceptance evidence |
| --- | --- | --- |
| Kitchen 1, sink measured from the left cabinet | One X measurement produces both cabinet and finished readings. The opposite finished reading includes only its own overhang. | 143 13/16″ − 71 1/2″ + 1″ = 73 5/16″. The two finished readings sum to 144 13/16″. |
| Island, four exposed edges | The Island template creates four editable OPEN and Polish edges. Editing overhangs retains the entered sink measurement, side and datum. | Reducing both ends to 3/4″ yields 117 3/4″ overall and 72 5/16″ from the measured finished edge. Regression cases also cover right-origin, finished-origin, zero and incomplete inputs. |
| Kitchen 3, L inside edge | The lower arm grows and the adjacent notch shrinks. Partial readings and the resolved polygon agree. | A 24″ arm with 1 1/2″ inside overhang measures 25 1/2″. Tests cover all six independent offsets, mirror, rotations and the parsed DXF contour. |
| Display and drawing | Tape fractions use sixteenths and reduce automatically. Off-grid readings keep their decimal display. Formula terms follow the displayed side. Dimension labels move clear of nearby parts where space permits. | Inch and millimetre values remain independent of display. DXF retains its decimal annotations and native millimetre vertices. |
| PDF | Each part gets a portrait or landscape detail sheet with cabinet dashes, overhangs, dimensions and sink chains. Notes and schematic walls retain their spatial overview. More than three sinks use continuation sheets. | The anonymous eight-part fixture includes a narrow rotated return, an L, two sinks and an incomplete part. PDF pages render independently. DXF excludes the incomplete part. |
| Wall and OPEN | Tapping an edge exposes its own overhang. In the dimension editor, selecting an allowance highlights the corresponding physical edge. Setting Wall parks its previous quantity and applies zero. OPEN restores a retained custom quantity. | Browser regression changes both ends independently, switches Wall/OPEN, downloads a backup and reopens the saved project. Old backups retain their stored quantities, basis and edge metadata on read. |
| Touch workflow | The sink editor groups side, datum, X and Done in a horizontal strip. Single-edge and batch Polish remain available. | Adding an Island takes the same two actions as adding a rectangle. It needs no extra taps to mark four polished edges. A cabinet-based sink needs one numeric entry for both sides. The previous direct editor required opening Advanced to choose Cabinet. |

Run `npm run test:site-measure` for unit, storage and export regressions. The eight-part PDF is generated at `artifacts/site-measure/issue19-eight-parts.pdf`. The Playwright field regressions use the public workspace route, a narrowed viewport, and the normal project backup and reopen controls.

Field acceptance remains open for a real tablet keyboard, first-time edge selection, reading a printed sheet, and whether operators prefer to keep both Polish entry points. The issue remains open for that feedback.
