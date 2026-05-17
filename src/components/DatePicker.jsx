import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, max, placeholder = 'Select date', error }) {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const [viewDate, setViewDate] = useState(() => {
    const base = value
      ? new Date(value + 'T00:00:00')
      : max
      ? new Date(max + 'T00:00:00')
      : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const triggerRef = useRef(null);

  const maxDate = max ? new Date(max + 'T00:00:00') : null;
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e) {
      const popup = document.getElementById('dp-popup');
      if (triggerRef.current?.contains(e.target)) return;
      if (popup?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function openPicker() {
    if (open) { setOpen(false); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    const POPUP_H = 330;
    const POPUP_W = 282;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const top = spaceBelow >= POPUP_H
      ? rect.bottom + 4
      : Math.max(8, rect.top - POPUP_H - 4);
    let left = rect.left;
    if (left + POPUP_W > window.innerWidth - 8) left = window.innerWidth - POPUP_W - 8;
    setPopupStyle({ top, left, width: POPUP_W });
    setOpen(true);
  }

  function selectDay(day) {
    const d = new Date(year, month, day);
    if (maxDate && d > maxDate) return;
    onChange(d.toISOString().split('T')[0]);
    setOpen(false);
  }

  function isDisabled(day) {
    return maxDate ? new Date(year, month, day) > maxDate : false;
  }

  function isSelected(day) {
    return selectedDate
      ? selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      : false;
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      >
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar portal — rendered outside modal to avoid overflow clipping */}
      {open && createPortal(
        <div
          id="dp-popup"
          style={{ position: 'fixed', top: popupStyle.top, left: popupStyle.left, width: popupStyle.width, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
        >
          {/* Month / Year header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
              <select
                value={month}
                onChange={(e) => setViewDate(new Date(year, +e.target.value, 1))}
                className="bg-transparent outline-none cursor-pointer hover:text-blue-600 transition"
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setViewDate(new Date(+e.target.value, month, 1))}
                className="bg-transparent outline-none cursor-pointer hover:text-blue-600 transition"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabled && selectDay(day)}
                  disabled={disabled}
                  className={[
                    'flex items-center justify-center text-sm rounded-lg h-8 w-full transition',
                    selected
                      ? 'bg-clinic-green text-white font-semibold'
                      : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-clinic-green-lite hover:text-clinic-green cursor-pointer',
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
