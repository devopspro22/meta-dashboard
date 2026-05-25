import { useState } from 'react';
import { DATE_PRESETS } from '../utils/formatters';

export function DateRangePicker({ value, onChange }) {
  // value is either a preset string ('last_30d') or a custom object ({ since, until })
  const isCustomActive = typeof value === 'object';

  const [customFrom, setCustomFrom] = useState(isCustomActive ? value.since : '');
  const [customTo,   setCustomTo]   = useState(isCustomActive ? value.until : '');

  const canApply = customFrom && customTo && customFrom <= customTo;

  const handleApply = () => {
    if (canApply) onChange({ since: customFrom, until: customTo });
  };

  return (
    <div className="date-picker-row">
      {/* Quick presets */}
      <div className="date-presets">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            className={`range-btn ${!isCustomActive && value === preset.key ? 'range-btn-active' : ''}`}
            onClick={() => onChange(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="date-divider" />

      {/* Custom date range */}
      <div className="date-custom">
        <input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className={`date-input${isCustomActive ? ' date-input-active' : ''}`}
          max={customTo || undefined}
        />
        <span className="date-sep">עד</span>
        <input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className={`date-input${isCustomActive ? ' date-input-active' : ''}`}
          min={customFrom || undefined}
        />
        <button
          className={`range-btn range-btn-apply${isCustomActive ? ' range-btn-active' : ''}`}
          onClick={handleApply}
          disabled={!canApply}
        >
          החל
        </button>
      </div>
    </div>
  );
}
