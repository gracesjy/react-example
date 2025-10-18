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
          align: "left"
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

  const clearSelection = () => setSelected(new Set());

  const getRectCoords = (a, b) => {
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
  };

  const onCellMouseDown = (r, c, e) => {
    if (e.button !== 0) return;
    document.body.style.userSelect = "none";
    dragging.current = true;
    startCell.current = { r, c };
    const coords = getRectCoords({ r, c }, { r, c });
    const next = new Set(coords.map(([rr, cc]) => key(rr, cc)));
    setSelected(next);
  };

  const onCellMouseEnter = (r, c) => {
    if (!dragging.current || !startCell.current) return;
    const coords = getRectCoords(startCell.current, { r, c });
    const next = new Set(coords.map(([rr, cc]) => key(rr, cc)));
    setSelected(next);
  };

  const onMouseUp = () => {
    document.body.style.userSelect = "";
    dragging.current = false;
    startCell.current = null;
  };

  const onCellClick = (r, c) => setSelected(new Set([key(r, c)]));

  const getSelectedCoords = () =>
    Array.from(selected).map((s) => s.split(",").map(Number));

  const isContiguousRectangle = (coords) => {
    if (coords.length === 0) return false;
    let rs = coords.map((p) => p[0]);
    let cs = coords.map((p) => p[1]);
    const rmin = Math.min(...rs),
      rmax = Math.max(...rs);
    const cmin = Math.min(...cs),
      cmax = Math.max(...cs);
    let count = 0;
    for (let r = rmin; r <= rmax; r++) {
      for (let c = cmin; c <= cmax; c++) {
        const cell = table[r][c];
        if (!cell) return false;
        count++;
      }
    }
    return count === coords.length;
  };

  const mergeSelected = () => {
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
    const rmin = Math.min(...rs),
      rmax = Math.max(...rs);
    const cmin = Math.min(...cs),
      cmax = Math.max(...cs);
    const newTable = table.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );

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
  };

  const splitSelected = () => {
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

    const newTable = table.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
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
          align: "left"
        };
      }
    }

    setTable(newTable);
    clearSelection();
    setMessage(`분할됨: ${r + 1}-${r + rspan}행, ${c + 1}-${c + cspan}열`);
  };

  const editCell = (r, c, text) => {
    const newTable = table.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
    const cell = newTable[r][c];
    if (!cell) return;
    cell.content = text;
    setTable(newTable);
  };

  const setCellAlignment = (r, c, align) => {
    const newTable = table.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
    const cell = newTable[r][c];
    if (!cell) return;
    cell.align = align;
    setTable(newTable);
    setMessage(`정렬 변경: (${r + 1}, ${c + 1}) → ${align}`);
  };

  const onCellContextMenu = (r, c, e) => {
    e.preventDefault();
    const currentAlign = table[r][c].align;
    const align = prompt(
      `정렬을 입력하세요 (left / center / right)\n현재: ${currentAlign}`,
      currentAlign
    );
    if (align === "left" || align === "center" || align === "right") {
      setCellAlignment(r, c, align);
    }
  };

  // master 좌상단 찾기 (현재 테이블 상태 기준)
  const findTopLeftOfMergedCell = (r, c) => {
    for (let rr = r; rr >= 0; rr--) {
      for (let cc = c; cc >= 0; cc--) {
        const cell = table[rr][cc];
        if (!cell) continue;
        if (rr + cell.rowspan - 1 >= r && cc + cell.colspan - 1 >= c) {
          return { r: rr, c: cc };
        }
      }
    }
    return { r, c };
  };

  // --- previewJSON: 모든 셀에 merge_type 포함, is_master true/false 표기 ---
  const previewJSON = () => {
    const jsonData = [];
    for (let r = 0; r < table.length; r++) {
      for (let c = 0; c < table[r].length; c++) {
        const topLeft = findTopLeftOfMergedCell(r, c);
        const master = table[topLeft.r][topLeft.c];

        // master가 없는 (정상적이지 않은) 경우 안전 처리
        if (!master) {
          jsonData.push({
            row: r + 1,
            col: c + 1,
            merge_type: "",
            is_master: false,
            content: ""
          });
          continue;
        }

        // master 기준 merge_type 결정
        let masterMergeType = "";
        if (master.colspan > 1 && master.rowspan === 1) masterMergeType = "H";
        else if (master.rowspan > 1 && master.colspan === 1) masterMergeType = "V";
        else if (master.rowspan > 1 && master.colspan > 1) masterMergeType = "HV";

        const isMasterHere = topLeft.r === r && topLeft.c === c;

        jsonData.push({
          row: r + 1,
          col: c + 1,
          merge_type: masterMergeType,
          is_master: isMasterHere,
          content: isMasterHere ? master.content : ""
        });
      }
    }

    const jsonStr = JSON.stringify(jsonData, null, 2);
    alert(jsonStr);
    console.log(jsonStr);
    setMessage("JSON 미리보기가 완료되었습니다.");
  };

  // --- loadFromJSON: merge_type (H/V/HV)와 is_master 를 이용해 정확히 복원 ---
  const loadFromJSON = () => {
    try {
      const jsonStr = prompt("JSON 데이터를 붙여넣으세요:");
      if (!jsonStr) return;
      const data = JSON.parse(jsonStr);

      // map으로 빠른 조회: key = "r,c"
      const dataMap = new Map();
      data.forEach((it) => dataMap.set(`${it.row - 1},${it.col - 1}`, it));

      // 새 테이블 초기화 (복사)
      const newTable = makeInitial().map((row) => row.map((cell) => ({ ...cell })));

      // 처리 전략:
      // 1) 모든 is_master === true 항목을 찾아서, 그 위치에서 merge_type에 따라
      //    오른쪽/아래로 연속된 참여 셀을 세어 colspan/rowspan을 결정
      // 2) 그 영역의 하위 셀들은 null로 설정
      // 3) 만약 is_master가 false로만 표시되고 master가 없으면 (비정상) 개별 셀로 채움

      // 먼저 is_master true들 처리
      data.forEach((item) => {
        if (!item.is_master) return;
        const r = item.row - 1;
        const c = item.col - 1;
        if (r < 0 || c < 0 || r >= initialRows || c >= initialCols) return;

        const cell = newTable[r][c];
        cell.content = item.content ?? "";
        cell.align = item.align ?? "left";

        // compute colspan by scanning right while the dataMap at (r,cc) has merge_type containing 'H'
        let colspan = 1;
        if (item.merge_type && (item.merge_type.includes("H"))) {
          let cc = c + 1;
          while (cc < initialCols) {
            const neighbor = dataMap.get(`${r},${cc}`);
            if (!neighbor) break;
            // neighbor is part of same horizontal merge if its merge_type contains 'H'
            if (neighbor.merge_type && neighbor.merge_type.includes("H")) {
              colspan++;
              cc++;
            } else break;
          }
        }

        // compute rowspan by scanning down while the dataMap at (rr,c) has merge_type containing 'V'
        let rowspan = 1;
        if (item.merge_type && (item.merge_type.includes("V"))) {
          let rr = r + 1;
          while (rr < initialRows) {
            const neighbor = dataMap.get(`${rr},${c}`);
            if (!neighbor) break;
            if (neighbor.merge_type && neighbor.merge_type.includes("V")) {
              rowspan++;
              rr++;
            } else break;
          }
        }

        // special: HV -> both directions (already covered by above)
        cell.colspan = colspan;
        cell.rowspan = rowspan;

        // null 처리 (하위 셀들)
        for (let rr = r; rr < r + rowspan; rr++) {
          for (let cc = c; cc < c + colspan; cc++) {
            if (rr === r && cc === c) continue;
            if (rr < initialRows && cc < initialCols) newTable[rr][cc] = null;
          }
        }
      });

      // 2차 pass: 만약 어떤 위치에 master가 명시되지 않았지만 dataMap에 merge_type이 있고 is_master=false,
      // 즉 master가 누락된 비정상 케이스가 있다면 해당 위치를 단일 셀로 채워둔다.
      data.forEach((item) => {
        const r = item.row - 1;
        const c = item.col - 1;
        if (r < 0 || c < 0 || r >= initialRows || c >= initialCols) return;
        const current = newTable[r][c];
        // current이 null이면 이미 하위 셀로 처리된 것 (정상)
        if (current === null) return;
        // 정상적으로 master로 처리되지 않았다면(=기본값으로 남아 있음), 덮어쓰기
        if (!item.is_master) {
          // 단일 셀(혹은 안전하게 기본 채움)
          newTable[r][c].content = item.content ?? newTable[r][c].content;
        }
      });

      setTable(newTable);
      clearSelection();
      setMessage("JSON 데이터를 불러왔습니다.");
    } catch (err) {
      console.error(err);
      alert("JSON 파싱 오류입니다.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto" onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <h2 className="text-2xl font-semibold mb-3">Interactive Merge / Split Table</h2>
      <p className="mb-3 text-sm text-gray-600">{message}</p>

      <div className="flex gap-2 mb-3">
        <button onClick={mergeSelected} className="px-3 py-1 rounded bg-blue-600 text-white">Merge</button>
        <button onClick={splitSelected} className="px-3 py-1 rounded bg-yellow-500 text-white">Split</button>
        <button onClick={() => { setTable(makeInitial()); clearSelection(); setMessage('초기화했습니다.'); }} className="px-3 py-1 rounded bg-gray-300">Reset</button>
        <button onClick={previewJSON} className="px-3 py-1 rounded bg-purple-600 text-white">Preview JSON</button>
        <button onClick={loadFromJSON} className="px-3 py-1 rounded bg-green-600 text-white">Load JSON</button>
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
                      style={{ verticalAlign: "middle", textAlign: cell.align }}
                      className={`border p-2 min-w-[80px] ${sel ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
                      onMouseDown={(e) => onCellMouseDown(r, c, e)}
                      onMouseEnter={() => onCellMouseEnter(r, c)}
                      onClick={() => onCellClick(r, c)}
                      onContextMenu={(e) => onCellContextMenu(r, c, e)}
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

