import React, { useState, useRef } from "react";

export default function MergeSplitTable() {
  const initialRows = 6;
  const initialCols = 6;

  const makeInitial = () => {
    const mat = [];
    for (let r = 0; r < initialRows; r++) {
      const row = [];
      for (let c = 0; c < initialCols; c++) {
        row.push({
          r,
          c,
          content: `R${r + 1}C${c + 1}`,
          rowspan: 1,
          colspan: 1,
          align: "left" // ✅ 기본 정렬 값 추가
        });
      }
      mat.push(row);
    }
    return mat;
  };

  const [table, setTable] = useState(makeInitial);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("Drag to select a rectangular area.");

  const dragging = useRef(false);
  const startCell = useRef(null);
  const key = (r, c) => `${r},${c}`;

  function clearSelection() {
    setSelected(new Set());
  }

  function getRectCoords(a, b) {
    const rmin = Math.min(a.r, b.r);
    const rmax = Math.max(a.r, b.r);
    const cmin = Math.min(a.c, b.c);
    const cmax = Math.max(a.c, b.c);
    const coords = [];
    for (let r = rmin; r <= rmax; r++) {
      for (let c = cmin; c <= cmax; c++) {
        coords.push([r, c]);
      }
    }
    return coords;
  }

  function onCellMouseDown(r, c, e) {
    if (e.button !== 0) return;
    document.body.style.userSelect = "none";
    dragging.current = true;
    startCell.current = { r, c };
    const coords = getRectCoords({ r, c }, { r, c });
    const next = new Set(coords.map(([rr, cc]) => key(rr, cc)));
    setSelected(next);
  }

  function onCellMouseEnter(r, c) {
    if (!dragging.current || !startCell.current) return;
    const coords = getRectCoords(startCell.current, { r, c });
    const next = new Set(coords.map(([rr, cc]) => key(rr, cc)));
    setSelected(next);
  }

  function onMouseUp() {
    document.body.style.userSelect = "";
    dragging.current = false;
    startCell.current = null;
  }

  function onCellClick(r, c) {
    setSelected(new Set([key(r, c)]));
  }

  function getSelectedCoords() {
    return Array.from(selected).map((s) => s.split(",").map(Number));
  }

  function isContiguousRectangle(coords) {
    if (coords.length === 0) return false;
    let rs = coords.map((p) => p[0]);
    let cs = coords.map((p) => p[1]);
    const rmin = Math.min(...rs), rmax = Math.max(...rs);
    const cmin = Math.min(...cs), cmax = Math.max(...cs);
    let count = 0;
    for (let r = rmin; r <= rmax; r++) {
      for (let c = cmin; c <= cmax; c++) {
        const cell = table[r][c];
        if (!cell) return false;
        count++;
      }
    }
    return count === coords.length;
  }

  function mergeSelected() {
    const coords = getSelectedCoords();
    if (coords.length <= 1) {
      setMessage("두 개 이상의 셀을 선택해야 병합할 수 있습니다.");
      return;
    }
    if (!isContiguousRectangle(coords)) {
      setMessage("선택 영역이 연속적인 사각형이 아닙니다.");
      return;
    }

    const rs = coords.map((p) => p[0]);
    const cs = coords.map((p) => p[1]);
    const rmin = Math.min(...rs), rmax = Math.max(...rs);
    const cmin = Math.min(...cs), cmax = Math.max(...cs);
    const newTable = table.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

    const tl = newTable[rmin][cmin];
    tl.rowspan = rmax - rmin + 1;
    tl.colspan = cmax - cmin + 1;

    for (let r = rmin; r <= rmax; r++) {
      for (let c = cmin; c <= cmax; c++) {
        if (r === rmin && c === cmin) continue;
        newTable[r][c] = null;
      }
    }

    setTable(newTable);
    clearSelection();
    setMessage(`병합됨: ${rmin + 1}-${rmax + 1}행, ${cmin + 1}-${cmax + 1}열`);
  }

  function splitSelected() {
    const coords = getSelectedCoords();
    if (coords.length !== 1) {
      setMessage("하나의 병합된 셀만 선택하여 분할하세요.");
      return;
    }
    const [r, c] = coords[0];
    const cell = table[r][c];
    if (!cell) {
      setMessage("선택된 위치는 병합 셀의 숨겨진 칸입니다.");
      return;
    }
    if (cell.rowspan === 1 && cell.colspan === 1) {
      setMessage("선택된 셀은 병합된 셀이 아닙니다.");
      return;
    }

    const newTable = table.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    const rspan = cell.rowspan;
    const cspan = cell.colspan;

    for (let rr = r; rr < r + rspan; rr++) {
      for (let cc = c; cc < c + cspan; cc++) {
        newTable[rr][cc] = {
          r: rr,
          c: cc,
          content: `R${rr + 1}C${cc + 1}`,
          rowspan: 1,
          colspan: 1,
          align: "left" // ✅ 분할 시 정렬 초기화
        };
      }
    }

    setTable(newTable);
    clearSelection();
    setMessage(`분할됨: ${r + 1}-${r + rspan}행, ${c + 1}-${c + cspan}열`);
  }

  function editCell(r, c, text) {
    const newTable = table.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    const cell = newTable[r][c];
    if (!cell) return;
    cell.content = text;
    setTable(newTable);
  }

  // 🆕 셀 정렬 변경 함수
  function setCellAlignment(r, c, align) {
    const newTable = table.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
    const cell = newTable[r][c];
    if (!cell) return;
    cell.align = align;
    setTable(newTable);
    setMessage(`정렬 변경: (${r + 1}, ${c + 1}) → ${align}`);
  }

  // 🆕 우클릭 핸들러
  function onCellContextMenu(r, c, e) {
    e.preventDefault();
    const currentAlign = table[r][c].align;
    const align = prompt(`정렬을 입력하세요 (left / center / right)\n현재: ${currentAlign}`, currentAlign);
    if (align === "left" || align === "center" || align === "right") {
      setCellAlignment(r, c, align);
    }
  }

  // ✅ JSON 미리보기 함수
  function previewJSON() {
    const jsonData = [];
    for (let r = 0; r < table.length; r++) {
      for (let c = 0; c < table[r].length; c++) {
        const cell = table[r][c];
        if (!cell) continue;

        let merge_stat = "";
        if (cell.colspan > 1 && cell.rowspan === 1) merge_stat = "H";
        else if (cell.rowspan > 1 && cell.colspan === 1) merge_stat = "V";
        else if (cell.rowspan > 1 && cell.colspan > 1) merge_stat = "HV";

        jsonData.push({
          row: r + 1,
          col: c + 1,
          merge_stat: merge_stat,
          content: cell.content,
          align: cell.align // ✅ 정렬도 포함
        });
      }
    }
    const jsonStr = JSON.stringify(jsonData, null, 2);
    alert(jsonStr);
    setMessage("JSON 미리보기를 완료했습니다.");
  }

  return (
    <div className="p-4 max-w-4xl mx-auto" onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <h2 className="text-2xl font-semibold mb-3">Interactive Merge / Split Table (Drag to Select)</h2>
      <p className="mb-3 text-sm text-gray-600">{message}</p>

      <div className="flex gap-2 mb-3">
        <button onClick={mergeSelected} className="px-3 py-1 rounded bg-blue-600 text-white">Merge</button>
        <button onClick={splitSelected} className="px-3 py-1 rounded bg-yellow-500 text-white">Split</button>
        <button onClick={() => { setTable(makeInitial()); clearSelection(); setMessage('초기화했습니다.'); }} className="px-3 py-1 rounded bg-gray-300">Reset</button>
        <button onClick={previewJSON} className="px-3 py-1 rounded bg-purple-600 text-white">Preview JSON</button>
        <button onClick={clearSelection} className="px-3 py-1 rounded bg-gray-100">Clear</button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full table-fixed border-collapse select-none">
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
                      data-row={r}
                      data-col={c}
                      style={{
                        verticalAlign: "middle",
                        textAlign: cell.align // ✅ 셀마다 개별 정렬 반영
                      }}
                      className={`border p-2 min-w-[80px] ${sel ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
                      onMouseDown={(e) => onCellMouseDown(r, c, e)}
                      onMouseEnter={() => onCellMouseEnter(r, c)}
                      onClick={() => onCellClick(r, c)}
                      onContextMenu={(e) => onCellContextMenu(r, c, e)} // ✅ 우클릭 정렬
                    >
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => editCell(r, c, e.currentTarget.textContent || "")}
                        className="outline-none min-h-[24px]"
                      >
                        {cell.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {cell.rowspan > 1 || cell.colspan > 1 ? `(${cell.rowspan}×${cell.colspan})` : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
