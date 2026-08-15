/**
 * TablePropEditor.tsx - BUG-FIXED PRODUCTION VERSION
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, Input, Label, SectionSimple } from '../../../ui/UI';
import type { TableProp } from '../../listenTask/listenDTO';

import { parseQuestionSlot, TABLE_HARD_CAP } from '../../listenTask/listenDTO';


interface TablePropEditorProps {
  value: TableProp | null;
  onChange: (newValue: TableProp) => void;
  maxRows?: number;
  maxCols?: number;
  disabled?: boolean;
  label?: string;
}

export const TablePropEditor: React.FC<TablePropEditorProps> = ({
  value,
  onChange,
  maxRows = 5,
  maxCols = 5,
  disabled = false,
  label = 'Table'
}) => {
  const table: TableProp = useMemo(() => {
    if (value?.rows && Array.isArray(value.rows) && value.rows.length > 0) {
      return value;
    }
    return {
      rows: Array.from({ length: 3 }, () => ({
        cells: Array.from({ length: maxCols }, () => ({ value: '' }))
      })),
      maxRows,
      maxCols
    };
  }, [value, maxRows, maxCols]);

  const activeCols = table.rows[0]?.cells.length ?? maxCols;

  const [targetRows, setTargetRows] = useState<number>(table.rows.length);
  const [targetCols, setTargetCols] = useState<number>(activeCols);
  const [targetMaxRows, setTargetMaxRows] = useState<number>(maxRows);
  const [targetMaxCols, setTargetMaxCols] = useState<number>(maxCols);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetRows(table.rows.length);
    setTargetCols(activeCols);
  }, [table.rows.length, activeCols]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetMaxRows(maxRows);
    setTargetMaxCols(maxCols);
  }, [maxRows, maxCols]);

  const handleCellChange = useCallback((rowIdx: number, colIdx: number, newValue: string) => {
    if (rowIdx < 0 || rowIdx >= table.rows.length || colIdx < 0 || colIdx >= table.rows[rowIdx].cells.length) {
      console.warn(`Cell out of bounds: (${rowIdx}, ${colIdx})`);
      return;
    }
    const updatedRows = table.rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const updatedCells = row.cells.map((cell, cIdx) =>
        cIdx !== colIdx ? cell : { ...cell, value: String(newValue || '').trim() }
      );
      return { ...row, cells: updatedCells };
    });
    onChange({ ...table, rows: updatedRows });
  }, [table, onChange]);

  const handleAddRow = useCallback(() => {
    if (table.rows.length >= maxRows) {
      console.warn(`Cannot exceed ${maxRows} rows`);
      return;
    }
    const newRow = { cells: Array.from({ length: activeCols }, () => ({ value: '' })) };
    onChange({ ...table, rows: [...table.rows, newRow] });
  }, [table, maxRows, activeCols, onChange]);

  const handleDeleteRow = useCallback((rowIdx: number) => {
    if (table.rows.length <= 1) {
      console.warn('Cannot delete the last row');
      return;
    }
    const updatedRows = table.rows.filter((_, idx) => idx !== rowIdx);
    onChange({ ...table, rows: updatedRows });
  }, [table, onChange]);

  const handleAddColumn = useCallback(() => {
    if (activeCols >= maxCols) {
      console.warn(`Cannot exceed ${maxCols} columns`);
      return;
    }
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: [...row.cells, { value: '' }]
    }));
    onChange({ ...table, rows: updatedRows });
  }, [table, activeCols, maxCols, onChange]);

  const handleDeleteColumn = useCallback(() => {
    if (activeCols <= 1) {
      console.warn('Cannot delete the last column');
      return;
    }
    const updatedRows = table.rows.map(row => ({
      ...row,
      cells: row.cells.slice(0, -1)
    }));
    onChange({ ...table, rows: updatedRows });
  }, [table, activeCols, onChange]);

  const handleResize = useCallback(() => {
    const rows = Math.min(Math.max(1, targetRows), maxRows);
    const cols = Math.min(Math.max(1, targetCols), maxCols);
    const resizedRows = Array.from({ length: rows }, (_, rIdx) => {
      const existing = table.rows[rIdx]?.cells ?? [];
      const cells = Array.from({ length: cols }, (_, cIdx) => existing[cIdx] ?? { value: '' });
      return { cells };
    });
    onChange({ ...table, rows: resizedRows });
  }, [table, targetRows, targetCols, maxRows, maxCols, onChange]);

  /** NEW: raise/lower the ceiling itself, clamping existing data if shrinking */
  const handleSetLimits = useCallback(() => {
    const newMaxRows = Math.min(Math.max(1, targetMaxRows), TABLE_HARD_CAP);
    const newMaxCols = Math.min(Math.max(1, targetMaxCols), TABLE_HARD_CAP);
    const clampedRows = table.rows.slice(0, newMaxRows).map(row => ({
      cells: row.cells.slice(0, newMaxCols),
    }));
    onChange({ rows: clampedRows, maxRows: newMaxRows, maxCols: newMaxCols });
  }, [table, targetMaxRows, targetMaxCols, onChange]);

  const handleClearTable = useCallback(() => {
    if (!window.confirm('Clear all table data?')) return;
    onChange({
      rows: Array.from({ length: 3 }, () => ({
        cells: Array.from({ length: maxCols }, () => ({ value: '' }))
      })),
      maxRows,
      maxCols
    });
  }, [maxRows, maxCols, onChange]);

  return (
    <div className="space-y-4 bg-base-300/30 p-4 rounded-xl w-full border border-base-300">
      {label && <Label>{label}</Label>}

      {/* Row/Col controls */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handleAddRow} disabled={disabled || table.rows.length >= maxRows}
            className="btn btn-sm btn-outline btn-primary normal-case"
            title={table.rows.length >= maxRows ? `Maximum ${maxRows} rows reached` : 'Add new row'}>
            + Row
          </button>
          <button type="button" onClick={handleDeleteColumn} disabled={disabled || activeCols <= 1}
            className="btn btn-sm btn-outline btn-warning normal-case"
            title={activeCols <= 1 ? 'Cannot delete last column' : 'Remove last column'}>
            − Col
          </button>
          <button type="button" onClick={handleAddColumn} disabled={disabled || activeCols >= maxCols}
            className="btn btn-sm btn-outline btn-primary normal-case"
            title={activeCols >= maxCols ? `Maximum ${maxCols} columns reached` : 'Add new column'}>
            + Col
          </button>
          <Button label="Clear All" variant="ghost" onClick={handleClearTable} disabled={disabled}
            className="btn btn-sm btn-outline btn-error normal-case" />
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-base-200 border border-base-300 text-base-content/70">
          {table.rows.length} / {maxRows} rows · {activeCols} / {maxCols} cols
        </span>
      </div>

      {/* Quick resize (active size, within current ceiling) */}
      <div className="flex gap-2 items-end flex-wrap bg-base-200/40 border border-base-300 rounded-lg p-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Rows</label>
          <input type="number" min={1} max={maxRows} value={targetRows}
            onChange={(e) => setTargetRows(Number(e.target.value))} disabled={disabled}
            className="input input-sm input-bordered w-20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Columns</label>
          <input type="number" min={1} max={maxCols} value={targetCols}
            onChange={(e) => setTargetCols(Number(e.target.value))} disabled={disabled}
            className="input input-sm input-bordered w-20" />
        </div>
        <Button label="Resize" onClick={handleResize} disabled={disabled} variant="outline"
          title="Resize table to the row/column counts above (existing data outside the new bounds is discarded)" />
      </div>

      {/* NEW: ceiling controls — separate from active resize, raises/lowers the max itself */}
      <div className="flex gap-2 items-end flex-wrap bg-base-200/20 border border-dashed border-base-300 rounded-lg p-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Max Rows</label>
          <input type="number" min={1} max={TABLE_HARD_CAP} value={targetMaxRows}
            onChange={(e) => setTargetMaxRows(Number(e.target.value))} disabled={disabled}
            className="input input-sm input-bordered w-20" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-base-content/60">Max Columns</label>
          <input type="number" min={1} max={TABLE_HARD_CAP} value={targetMaxCols}
            onChange={(e) => setTargetMaxCols(Number(e.target.value))} disabled={disabled}
            className="input input-sm input-bordered w-20" />
        </div>
        <Button 
          label="Set Limits" 
          onClick={handleSetLimits} disabled={disabled} variant="outline"
          title={`Change the row/column ceiling (up to ${TABLE_HARD_CAP}×${TABLE_HARD_CAP}). Shrinking discards data outside the new bounds.`} 
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-base-300 rounded-lg shadow-sm">
        <table className="w-full border-collapse bg-base-100">
          <thead>
            <tr className="bg-base-200 text-left text-xs font-semibold text-base-content/80">
              <th className="w-10 p-2 text-center border-b border-base-300">Row</th>
              {Array.from({ length: activeCols }).map((_, cIdx) => (
                <th key={`header-${cIdx}`} className="p-2 border-b border-base-300 text-xs font-mono text-base-content/70">
                  Col {cIdx + 1}
                </th>
              ))}
              <th className="w-10 p-2 text-center border-b border-base-300">Delete</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rIdx) => (
              <tr key={`row-${rIdx}`} className="hover:bg-base-200/40 transition-colors">
                <td className="w-10 bg-base-200/50 border border-base-300 p-2 text-center text-xs font-mono font-medium text-base-content/70">
                  {rIdx + 1}
                </td>
                {row.cells.map((cell, cIdx) => {
                  const slotNum = parseQuestionSlot(cell.value);
                  return (
                    <td key={`cell-${rIdx}-${cIdx}`} className="border border-base-300 p-0 relative">
                      <Input
                        type="text"
                        value={cell.value}
                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                        disabled={disabled}
                        maxLength={500}
                        placeholder={`R${rIdx + 1}C${cIdx + 1}`}
                        className={slotNum ? 'bg-indigo-500/10 border-indigo-500/40' : ''}
                      />
                      {/* NEW: live confirmation that the bracket syntax registered */}
                      {slotNum && (
                        <span className="absolute top-0.5 right-1 text-[9px] font-bold text-indigo-400 pointer-events-none">
                          Slot Q{slotNum}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="w-10 border border-base-300 p-1 text-center bg-base-100">
                  <button type="button" onClick={() => handleDeleteRow(rIdx)}
                    disabled={disabled || table.rows.length <= 1}
                    className="btn btn-square btn-ghost btn-xs text-error hover:bg-error/20 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={table.rows.length <= 1 ? 'Cannot delete last row' : 'Delete this row'}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Help text — now documents the slot syntax */}
      <div className="text-xs text-base-content/60 space-y-1">
        <p>• Max {TABLE_HARD_CAP} rows × {TABLE_HARD_CAP} columns (current ceiling: {maxRows}×{maxCols})</p>
        <p>• Use + Row / + Col / − Col, or set exact counts and click Resize</p>
        <p>• To create a matching slot for students, type <code>[Question1]</code> (or <code>[Q1]</code>, or <code>{'{Question1}'}</code>) into a cell — it highlights automatically</p>
        <p>• Resizing down discards data outside the new bounds</p>
        <p>• Changes save immediately</p>
      </div>
    </div>
  );
};


interface TablePropViewerProps {
  tableProp: TableProp | null;
  option: string[];
  onChange?: (updated: TableProp) => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

const BADGE_BASE = "bg-indigo-950/60 text-indigo-300 border-indigo-700/40 hover:bg-indigo-900/60";
const BADGE_SELECTED = "bg-indigo-500/20 text-indigo-200 border-indigo-400 ring-1 ring-indigo-400";

export const TablePropViewer: React.FC<TablePropViewerProps> = ({
  tableProp,
  option = [],
  onChange,
  disabled = false,
  title = "Match the Options",
  subtitle = "Drag a tag onto a slot, or tap a tag then tap a slot.",
}) => {
  const [draggingOption, setDraggingOption] = useState<string | null>(null);
  const [activeOverCell, setActiveOverCell] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!tableProp || !tableProp.rows || tableProp.rows.length === 0) return null;

  const placedAnswers = new Set(
    tableProp.rows.flatMap((row) => row.cells.map((c) => c?.answer).filter(Boolean))
  );

  const setCellAnswer = (questionNum: string, answerValue: string) => {
    const updatedRows = tableProp.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        const slotNum = parseQuestionSlot(cell.value);
        if (slotNum === questionNum) {
          return { ...cell, answer: answerValue || undefined };
        }
        return cell;
      }),
    }));
    onChange?.({ ...tableProp, rows: updatedRows });
  };

  const handleClearCell = (questionNum: string) => {
    if (disabled) return;
    setCellAnswer(questionNum, "");
  };

  const handleOptionDragStart = (e: React.DragEvent, optionValue: string) => {
    if (disabled) return;
    e.dataTransfer.setData("text/plain", optionValue);
    e.dataTransfer.effectAllowed = "move";
    setDraggingOption(optionValue);
  };

  const handleOptionDragEnd = () => {
    setDraggingOption(null);
    setActiveOverCell(null);
  };

  const handleCellDragOver = (e: React.DragEvent, questionNum: string) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeOverCell !== questionNum) setActiveOverCell(questionNum);
  };

  const handleCellDragLeave = (questionNum: string) => {
    setActiveOverCell((prev) => (prev === questionNum ? null : prev));
  };

  const handleCellDrop = (e: React.DragEvent, questionNum: string) => {
    if (disabled) return;
    e.preventDefault();
    const droppedValue = e.dataTransfer.getData("text/plain") || draggingOption;
    if (droppedValue) setCellAnswer(questionNum, droppedValue);
    setDraggingOption(null);
    setActiveOverCell(null);
  };

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    setSelectedOption((prev) => (prev === optionValue ? null : optionValue));
  };

  const handleCellClick = (questionNum: string) => {
    if (disabled || !selectedOption) return;
    setCellAnswer(questionNum, selectedOption);
    setSelectedOption(null);
  };

  return (
    <SectionSimple title={title} subtitle={subtitle}>
      <div className="space-y-6 select-none">
        <div>
          <Label>Available Options</Label>
          <div className="flex gap-2 flex-wrap min-h-9 items-center">
            {option.map((ops, oIdx) => {
              if (placedAnswers.has(ops)) return null;
              const isSelected = selectedOption === ops;
              const isDragging = draggingOption === ops;
              return (
                <div
                  key={`opt-${ops}-${oIdx}`}
                  draggable={!disabled}
                  onDragStart={(e) => handleOptionDragStart(e, ops)}
                  onDragEnd={handleOptionDragEnd}
                  onClick={() => handleOptionClick(ops)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium
                    px-2.5 py-1 rounded-full border capitalize cursor-grab
                    transition-[background-color,opacity,transform] duration-150 ease-out
                    ${isSelected ? BADGE_SELECTED : BADGE_BASE}
                    ${isDragging ? "opacity-40 scale-95" : "opacity-100 scale-100"}`}
                >
                  <span className="text-indigo-500/50 font-mono pointer-events-none">⋮⋮</span>
                  {ops}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/60">
          <table className="w-full border-collapse table-auto text-sm">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 text-[11px] font-semibold uppercase tracking-widest border-b border-slate-700/50">
                {tableProp.rows[0].cells.map((headerCell, hIdx) => (
                  <th key={`th-${hIdx}`} className="px-4 py-3 text-left font-medium">
                    {headerCell.value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tableProp.rows.slice(1).map((row, rIdx) => (
                <tr key={`row-${rIdx}`} className="hover:bg-slate-800/30 transition-colors">
                  {row.cells.map((cell, cIdx) => {
                    const questionNum = parseQuestionSlot(cell.value);

                    if (questionNum) {
                      const currentAnswer = cell.answer;
                      const isOver = activeOverCell === questionNum;
                      const isClickable = !disabled && !!selectedOption;

                      return (
                        <td key={`cell-${rIdx}-${cIdx}`} className="px-4 py-2 border-r border-slate-800/60 last:border-r-0 min-w-55">
                          <div
                            onDragOver={(e) => handleCellDragOver(e, questionNum)}
                            onDragLeave={() => handleCellDragLeave(questionNum)}
                            onDrop={(e) => handleCellDrop(e, questionNum)}
                            onClick={() => handleCellClick(questionNum)}
                            className={`flex items-center justify-between gap-3 p-1.5 rounded-lg border transition-colors duration-150 ease-out ${
                              isClickable ? "cursor-pointer" : ""
                            } ${
                              isOver
                                ? "border-indigo-400 border-dashed bg-indigo-500/10"
                                : currentAnswer
                                ? "border-indigo-700/40 bg-indigo-950/40"
                                : isClickable
                                ? "border-indigo-700/40 border-dashed bg-indigo-950/20"
                                : "border-slate-700/40 bg-slate-800/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">
                                {questionNum}
                              </span>
                              {currentAnswer ? (
                                <span className="font-medium text-sm text-indigo-300 capitalize">{currentAnswer}</span>
                              ) : (
                                <span className="text-xs text-slate-500 italic select-none">
                                  {isClickable ? "Tap to drop here" : "Drop option here"}
                                </span>
                              )}
                            </div>
                            {currentAnswer && !disabled && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleClearCell(questionNum); }}
                                aria-label="Remove"
                                className="text-indigo-400 hover:text-rose-400 transition-colors text-xs leading-none px-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={`cell-${rIdx}-${cIdx}`} className="px-4 py-3 text-slate-300 border-r border-slate-800/60 last:border-r-0 font-medium">
                        {cell.value || <span className="text-slate-600">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionSimple>
  );
};
TablePropViewer.displayName = "TablePropViewer";

