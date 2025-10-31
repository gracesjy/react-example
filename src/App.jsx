import React, { useState, useRef } from "react";
import ReactJson from "react-json-view";

export default function MergeSplitTable() {
  const [numRows, setNumRows] = useState(6);
  const [numCols, setNumCols] = useState(6);
  const [showModal, setShowModal] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // ✅ 복사 함수는 여기 위치에 추가하세요
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(jsonText)
      .then(() => {
        alert("클립보드에 복사되었습니다!");
      })
      .catch((err) => {
        console.error("복사 실패:", err);
        alert("복사에 실패했습니다.");
      });
  };

  // 초기 표 생성
  const makeInitial = (rows = numRows, cols = numCols) => {
    const mat = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r,
          c,
          content: `R${r + 1}C${c + 1}`,
          rowspan: 1,
          colspan: 1,
          alignH: "left",
          alignV: "middle",
        });
      }
      mat.push(row);
    }
    return mat;
  };

  const [table, setTable] = useState(() => makeInitial());
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("Drag to select cells.");
  const dragging = useRef(false);
  const startCell = useRef(null);
  const key = (r, c) => `${r},${c}`;

  const clearSelection = () => setSelected(new Set());
  const getSelectedCoords = () =>
    Array.from(selected).map((s) => s.split(",").map(Number));

  const getRectCoords = (a, b) => {
  const rmin = Math.min(a.r, b.r);
  const rmax = Math.max(a.r, b.r);
  const cmin = Math.min(a.c, b.c);
  const cmax = Math.max(a.c, b.c);
  const coords = new Set();

  // 병합 셀 포함
  for (let r = rmin; r <= rmax; r++) {
    for (let c = cmin; c <= cmax; c++) {
      const cell = table[r][c];
      if (cell) {
        const rs = cell.rowspan || 1;
        const cs = cell.colspan || 1;
        for (let dr = 0; dr < rs; dr++) {
          for (let dc = 0; dc < cs; dc++) {
            coords.add(key(r + dr, c + dc));
          }
        }
      } else {
        // 숨겨진 셀 → 마스터 셀 찾아서 병합 범위 포함
        for (let mr = 0; mr < table.length; mr++) {
          for (let mc = 0; mc < table[0].length; mc++) {
            const master = table[mr][mc];
            if (
              master &&
              mr <= r &&
              r < mr + master.rowspan &&
              mc <= c &&
              c < mc + master.colspan
            ) {
              for (let dr = 0; dr < master.rowspan; dr++) {
                for (let dc = 0; dc < master.colspan; dc++) {
                  coords.add(key(mr + dr, mc + dc));
                }
              }
              break;
            }
          }
        }
      }
    }
  }

  // ✅ 마지막 보정: 사각형 범위 안의 모든 셀을 누락 없이 포
  const all = Array.from(coords).map((s) => s.split(",").map(Number));
  const rs = all.map(([r]) => r);
  const cs = all.map(([, c]) => c);
  const rrmin = Math.min(...rs);
  const rrmax = Math.max(...rs);
  const ccmin = Math.min(...cs);
  const ccmax = Math.max(...cs);

  for (let r = rrmin; r <= rrmax; r++) {
    for (let c = ccmin; c <= ccmax; c++) {
      coords.add(key(r, c));
    }
  }

  return Array.from(coords).map((s) => s.split(",").map(Number));


};


  const onCellMouseDown = (r, c, e) => {
    if (e.button !== 0) return;
    document.body.style.userSelect = "none";
    dragging.current = true;
    startCell.current = { r, c };
    setSelected(new Set([key(r, c)]));
  };

const onCellMouseEnter = (r, c) => {
  if (!dragging.current || !startCell.current) return;

  const coords = getRectCoords(startCell.current, { r, c });

  console.log(coords)

  const expanded = new Set();

  coords.forEach(([rr, cc]) => {
    const cell = table[rr][cc];
    if (cell) {
      // ✅ 병합 셀이라면 전체 범위 확장
      const rs = cell.rowspan || 1;
      const cs = cell.colspan || 1;
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          expanded.add(key(rr + dr, cc + dc));
        }
      }
    } else {
      // ✅ 숨겨진 셀일 경우 마스터 셀 찾아서 그 범위도 포함
      for (let mr = 0; mr < table.length; mr++) {
        for (let mc = 0; mc < table[0].length; mc++) {
          const master = table[mr][mc];
          if (
            master &&
            mr <= rr &&
            rr < mr + master.rowspan &&
            mc <= cc &&
            cc < mc + master.colspan
          ) {
            for (let dr = 0; dr < master.rowspan; dr++) {
              for (let dc = 0; dc < master.colspan; dc++) {
                expanded.add(key(mr + dr, mc + dc));
              }
            }
            break;
          }
        }
      }
    }
  });

  setSelected(expanded);
};

  const onMouseUp = () => {
    document.body.style.userSelect = "";
    dragging.current = false;
    startCell.current = null;
  };

  const isRect = (coords) => {
    if (coords.length === 0) return false;
    const rs = coords.map((v) => v[0]);
    const cs = coords.map((v) => v[1]);
    const rmin = Math.min(...rs),
      rmax = Math.max(...rs);
    const cmin = Math.min(...cs),
      cmax = Math.max(...cs);
    let count = 0;
    for (let r = rmin; r <= rmax; r++)
      for (let c = cmin; c <= cmax; c++) count++;
    return count === coords.length;
  };

  // 병합
  const mergeSelected = () => {
    const coords = getSelectedCoords();

    if (coords.length === 1) {
      const [r, c] = coords[0];
      const cell = table[r][c];
      if (!cell) return;

      const newTable = table.map((row) =>
        row.map((col) => (col ? { ...col } : null)),
      );
      const master = newTable[r][c];
      master.rowspan = 1; // 병합은 없지만 merge_type 표시를 위해 유지
      master.colspan = 1;
      master.metaMergeType = "V";
      console.log("master metaMergeType V set !");

      setTable(newTable);
      clearSelection();
      setMessage("단일 셀에 수직 병합 플래그 적용됨");
      return;
    }

    if (!isRect(coords) || coords.length < 2) {
      setMessage("병합하려면 연속된 사각형을 선택하세요.");
      return;
    }
    const rs = coords.map((v) => v[0]),
      cs = coords.map((v) => v[1]);
    const rmin = Math.min(...rs),
      rmax = Math.max(...rs);
    const cmin = Math.min(...cs),
      cmax = Math.max(...cs);
    const newTable = table.map((r) => r.map((c) => (c ? { ...c } : null)));
    const master = newTable[rmin][cmin];
    master.rowspan = rmax - rmin + 1;
    master.colspan = cmax - cmin + 1;
    for (let r = rmin; r <= rmax; r++)
      for (let c = cmin; c <= cmax; c++)
        if (!(r === rmin && c === cmin)) newTable[r][c] = null;
    setTable(newTable);
    clearSelection();
    setMessage("병합 완료");
  };

  // 분할
  const splitSelected = () => {
    const coords = getSelectedCoords();
    if (coords.length !== 1) {
      setMessage("분할하려면 단일 병합 셀을 선택하세요.");
      return;
    }
    const [r, c] = coords[0];
    const cell = table[r][c];
    if (!cell || (cell.rowspan === 1 && cell.colspan === 1)) {
      setMessage("병합된 셀이 아닙니다.");
      return;
    }
    const newTable = table.map((r) => r.map((c) => (c ? { ...c } : null)));
    for (let rr = r; rr < r + cell.rowspan; rr++)
      for (let cc = c; cc < c + cell.colspan; cc++)
        newTable[rr][cc] = {
          r: rr,
          c: cc,
          content: `R${rr + 1}C${cc + 1}`,
          rowspan: 1,
          colspan: 1,
          alignH: "left",
          alignV: "middle",
        };
    setTable(newTable);
    clearSelection();
    setMessage("분할 완료");
  };

  // 정렬 기능
  const setAlignment = (alignH = null, alignV = null) => {
    const coords = getSelectedCoords();
    if (coords.length === 0) return;
    const newTable = table.map((r) => r.map((c) => (c ? { ...c } : null)));
    coords.forEach(([r, c]) => {
      const cell = newTable[r][c];
      if (!cell) return;
      if (alignH) cell.alignH = alignH;
      if (alignV) cell.alignV = alignV;
    });
    setTable(newTable);
  };

  // Crop to Selection (선택 영역만 남기기)
  const cropToSelection = () => {
    const coords = getSelectedCoords();
    if (!isRect(coords) || coords.length === 0) {
      setMessage("잘라내려면 사각형 영역을 선택하세요.");
      return;
    }
    const rs = coords.map((v) => v[0]),
      cs = coords.map((v) => v[1]);
    const rmin = Math.min(...rs),
      rmax = Math.max(...rs);
    const cmin = Math.min(...cs),
      cmax = Math.max(...cs);
    const newRows = rmax - rmin + 1;
    const newCols = cmax - cmin + 1;

    const findMaster = (r, c) => {
      for (let rr = r; rr >= 0; rr--)
        for (let cc = c; cc >= 0; cc--) {
          const cell = table[rr]?.[cc];
          if (!cell) continue;
          if (rr + cell.rowspan - 1 >= r && cc + cell.colspan - 1 >= c)
            return { r: rr, c: cc, master: cell };
        }
      return null;
    };

    const newTable = [];
    for (let r = 0; r < newRows; r++) {
      const row = [];
      for (let c = 0; c < newCols; c++) {
        row.push({
          r,
          c,
          content: `R${r + 1}C${c + 1}`,
          rowspan: 1,
          colspan: 1,
          alignH: "left",
          alignV: "middle",
        });
      }
      newTable.push(row);
    }

    const createdMasters = new Set();

    for (let r = rmin; r <= rmax; r++) {
      for (let c = cmin; c <= cmax; c++) {
        const relR = r - rmin;
        const relC = c - cmin;
        const info = findMaster(r, c);
        if (!info) continue;
        const { r: mr, c: mc, master } = info;
        const keyM = `${mr},${mc}`;
        if (mr >= rmin && mr <= rmax && mc >= cmin && mc <= cmax) {
          const relMr = mr - rmin,
            relMc = mc - cmin;
          if (createdMasters.has(`${relMr},${relMc}`)) continue;
          createdMasters.add(`${relMr},${relMc}`);
          const maxR = Math.min(master.rowspan, rmax - mr + 1);
          const maxC = Math.min(master.colspan, cmax - mc + 1);
          newTable[relMr][relMc] = {
            r: relMr,
            c: relMc,
            content: master.content,
            rowspan: maxR,
            colspan: maxC,
            alignH: master.alignH,
            alignV: master.alignV,
          };
          for (let rr = relMr; rr < relMr + maxR; rr++)
            for (let cc = relMc; cc < relMc + maxC; cc++)
              if (!(rr === relMr && cc === relMc)) newTable[rr][cc] = null;
        } else {
          if (newTable[relR][relC])
            newTable[relR][relC] = {
              r: relR,
              c: relC,
              content: master.content,
              rowspan: 1,
              colspan: 1,
              alignH: master.alignH,
              alignV: master.alignV,
            };
        }
      }
    }
    setNumRows(newRows);
    setNumCols(newCols);
    setTable(newTable);
    clearSelection();
    setMessage("선택 영역으로 잘라냈습니다.");
  };

  // JSON 내보내기 (기존 포맷 유지 + align 추가)
  const previewJSON = () => {
    const json = [];
    const rows = table.length;
    const cols = table[0].length;

    // 병합 정보 확인용 맵 생성
    const masterMap = new Map();

    // master 셀 찾기
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = table[r][c];
        if (!cell) continue;
        if (cell.rowspan > 1 || cell.colspan > 1) {
          // 수평 또는 수직 병합
          console.log("metaMergeType : " + cell.metaMergeType);
          const mergeType =
            cell.metaMergeType ??
            (cell.rowspan > 1 ? "V" : cell.colspan > 1 ? "H" : "");

          console.log(mergeType);
          console.log(cell.metaMergeType);
          masterMap.set(`${r},${c}`, mergeType);
        }
      }
    }

    // 전체 셀 순회
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = table[r][c];
        if (!cell) {
          // 숨겨진 셀 찾기 → master 영역 찾아서 merge_type 복원
          let mergeType = "";
          for (let [key, type] of masterMap.entries()) {
            const [mr, mc] = key.split(",").map(Number);
            const mcell = table[mr][mc];
            if (
              mr <= r &&
              r < mr + mcell.rowspan &&
              mc <= c &&
              c < mc + mcell.colspan
            ) {
              mergeType = type;
              break;
            }
          }
          json.push({
            row: r + 1,
            col: c + 1,
            merge_type: mergeType,
            is_master: "False",
            content: "",
          });
          continue;
        }

        // master 셀
        // old version
        //const mergeType =
        //  cell.rowspan > 1 ? "V" : cell.colspan > 1 ? "H" : "";

        const mergeType =
          cell.metaMergeType ??
          (cell.rowspan > 1 ? "V" : cell.colspan > 1 ? "H" : "");

        json.push({
          row: r + 1,
          col: c + 1,
          merge_type: mergeType,
          is_master: "True",
          content: cell.content,
          alignH: cell.alignH,
          alignV: cell.alignV,
        });
      }
    }

    //alert(JSON.stringify(json, null, 2));
    setJsonText(JSON.stringify(json, null, 2));
    setShowModal(true);

    console.log(JSON.stringify(json, null, 2));
  };

  // JSON 불러오기
  const loadFromJSON = () => {
    try {
      const jsonStr = prompt("JSON 데이터를 붙여넣으세요:");
      if (!jsonStr) return;
      const data = JSON.parse(jsonStr);

      let maxR = 0,
        maxC = 0;
      data.forEach((d) => {
        maxR = Math.max(maxR, d.row);
        maxC = Math.max(maxC, d.col);
      });

      const newTable = makeInitial(maxR, maxC);

      // === 1. 수평 병합 (H) ===
      for (let r = 1; r <= maxR; r++) {
        const rowCells = data.filter((x) => x.row === r);
        for (let c = 0; c < maxC; c++) {
          const cell = rowCells.find((x) => x.col === c + 1);
          if (!cell) continue;
          if (cell.merge_type === "H" && cell.is_master === "True") {
            // 같은 행에서 다음 H 셀들을 탐색하되, 중간에 새로운 master가 있으면 중단
            let span = 1;
            for (let cc = c + 1; cc < maxC; cc++) {
              const next = rowCells.find((x) => x.col === cc + 1);
              if (!next) break;
              if (next.merge_type === "H" && next.is_master === "False") span++;
              else break;
            }

            const master = newTable[r - 1][c];
            master.content = cell.content ?? "";
            master.alignH = cell.alignH ?? "left";
            master.alignV = cell.alignV ?? "middle";
            master.colspan = span;
            // 숨김 처리
            for (let cc = 1; cc < span; cc++) newTable[r - 1][c + cc] = null;
          }
        }
      }

      // === 2. 수직 병합 (V) ===
      for (let c = 1; c <= maxC; c++) {
        const colCells = data.filter((x) => x.col === c);
        for (let r = 0; r < maxR; r++) {
          const cell = colCells.find((x) => x.row === r + 1);
          if (!cell) continue;
          if (cell.merge_type === "V" && cell.is_master === "True") {
            // 같은 열에서 다음 V 셀들을 탐색하되, 새로운 master 만나면 중단
            let span = 1;
            for (let rr = r + 1; rr < maxR; rr++) {
              const next = colCells.find((x) => x.row === rr + 1);
              if (!next) break;
              if (next.merge_type === "V" && next.is_master === "False") span++;
              else break;
            }

            const master = newTable[r][c - 1];
            master.content = cell.content ?? "";
            master.alignH = cell.alignH ?? "left";
            master.alignV = cell.alignV ?? "middle";
            master.rowspan = span;
            // 숨김 처리
            for (let rr = 1; rr < span; rr++) newTable[r + rr][c - 1] = null;
          }
        }
      }

      // === 3. 나머지 (is_master=True 이면서 merge_type="")
      data.forEach((d) => {
        if (d.is_master === "True" && d.merge_type === "") {
          const cell = newTable[d.row - 1][d.col - 1];
          if (!cell) return;
          cell.content = d.content ?? "";
          cell.alignH = d.alignH ?? "left";
          cell.alignV = d.alignV ?? "middle";
        }
      });

      setNumRows(maxR);
      setNumCols(maxC);
      setTable(newTable);
      clearSelection();
      setMessage("JSON 로드 완료 (정확한 병합 그룹 단위로 처리)");
    } catch (e) {
      console.error(e);
      alert("JSON 파싱 오류");
    }
  };

  return (
    <div
      className="p-4 max-w-5xl mx-auto"
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <h2 className="text-2xl font-semibold mb-3">
        Merge / Split / Crop Table + 정렬 + JSON
      </h2>
      <p className="mb-3 text-sm text-gray-600">{message}</p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label>
          Rows:
          <input
            type="number"
            min={1}
            value={numRows}
            onChange={(e) => setNumRows(parseInt(e.target.value || "1"))}
            className="ml-2 w-20 p-1 border rounded"
          />
        </label>
        <label>
          Columns:
          <input
            type="number"
            min={1}
            value={numCols}
            onChange={(e) => setNumCols(parseInt(e.target.value || "1"))}
            className="ml-2 w-20 p-1 border rounded"
          />
        </label>
        <button
          onClick={() => {
            setTable(makeInitial(numRows, numCols));
            clearSelection();
          }}
          className="px-3 py-1 rounded bg-indigo-600 text-white"
        >
          Create
        </button>

        <button
          onClick={mergeSelected}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          Merge
        </button>
        <button
          onClick={splitSelected}
          className="px-3 py-1 rounded bg-yellow-500 text-white"
        >
          Split
        </button>
        <button
          onClick={cropToSelection}
          className="px-3 py-1 rounded bg-red-600 text-white"
        >
          Crop to Selection
        </button>

        {/* 정렬 */}
        <div className="flex gap-1 ml-3">
          <span className="text-sm text-gray-700">H:</span>
          <button
            onClick={() => setAlignment("left", null)}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Left
          </button>
          <button
            onClick={() => setAlignment("center", null)}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Center
          </button>
          <button
            onClick={() => setAlignment("right", null)}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Right
          </button>
        </div>
        <div className="flex gap-1 ml-2">
          <span className="text-sm text-gray-700">V:</span>
          <button
            onClick={() => setAlignment(null, "top")}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Top
          </button>
          <button
            onClick={() => setAlignment(null, "middle")}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Middle
          </button>
          <button
            onClick={() => setAlignment(null, "bottom")}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            Bottom
          </button>
        </div>

        <button
          onClick={previewJSON}
          className="px-3 py-1 rounded bg-purple-600 text-white"
        >
          Preview JSON
        </button>
        <button
          onClick={loadFromJSON}
          className="px-3 py-1 rounded bg-green-600 text-white"
        >
          Load JSON
        </button>
      </div>
      <div className="overflow-auto border rounded">
        <table className="w-full border-collapse select-none">
          <tbody>
            {table.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  if (!cell) return null;
                  const sel = selected.has(key(r, c));
                  return (
                    <td
                      key={c}
                      rowSpan={cell.rowspan}
                      colSpan={cell.colspan}
                      style={{
                        textAlign: cell.alignH,
                        verticalAlign: cell.alignV,
                      }}
                      className={`border p-2 min-w-[80px] ${sel ? "ring-2 ring-indigo-400 bg-indigo-50" : ""}`}
                      onMouseDown={(e) => onCellMouseDown(r, c, e)}
                      onMouseEnter={() => onCellMouseEnter(r, c)}
                    >
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const text = e.currentTarget.textContent || "";
                          const newT = table.map((r) =>
                            r.map((c) => (c ? { ...c } : null)),
                          );
                          if (newT[r][c]) newT[r][c].content = text;
                          setTable(newT);
                        }}
                        className="outline-none min-h-[24px]"
                      >
                        {cell.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ({cell.alignH}, {cell.alignV})
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      // 여기에 넣어라.
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded max-w-3xl w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-2">JSON Preview</h3>
            <div className="max-h-[500px] overflow-auto">
              <ReactJson
                src={JSON.parse(jsonText)}
                theme="monokai" // 또는 "rjv-default", "summerfruit", "apathy" 등
                collapsed={false}
                enableClipboard={true}
                displayDataTypes={false}
              />
            </div>
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-1 bg-green-600 text-white rounded"
              >
                복사
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1 bg-indigo-600 text-white rounded"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
