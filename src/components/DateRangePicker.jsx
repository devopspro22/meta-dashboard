import { DATE_PRESETS } from '../utils/formatters';

export function DateRangePicker({ value, onChange }) {
  return (
    <div className="date-range-picker">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className={`range-btn ${value === preset.key ? 'range-btn-active' : ''}`}
          onClick={() => onChange(preset.key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
