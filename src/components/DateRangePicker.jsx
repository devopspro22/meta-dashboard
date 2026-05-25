import { useState } from 'react';
import { DATE_PRESETS } from '../utils/formatters';

export function DateRangePicker({ value, onChange }) {
  // value is either a preset string ('last_30d') or a custom object ({ since, until })
  const isCustomActive = typeof value === 'object';

  // Init custom inputs from current value if already custom
  const [customFrom, setCustomFrom] = useState(isCustomActive ? value.since : '');
  const [customTo,   setCustomTo]   = useState(isCustomActive ? value.until : '');

  const handleApply = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      onChange({ since: customFrom, until: customTo });
    }
  };

  const handlePreset = (key) => {
    onChange(key);
  };

  return (
    <div className="date-range-picker-wrap">
      {/* Quick presets */}
      <div className="date-range-picker">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            className={`range-btn ${!isCustomActive && value === preset.key ? 'range-btn-active' : ''}`}
            onClick={() => handlePreset(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <div className={`custom-range ${isCustomActive ? 'custom-range-active' : ''}`}>
        <input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="date-input"
          max={customTo || undefined}
        />
        <span className="date-sep">עד</span>
        <input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="date-input"
          min={customFrom || undefined}
        />
        <button
          className={`range-btn ${isCustomActive ? 'range-btn-active' : ''}`}
          onClick={handleApply}
          disabled={!customFrom || !customTo || customFrom > customTo}
        >
          החל
        </button>
      </div>
    </div>
  );
}
