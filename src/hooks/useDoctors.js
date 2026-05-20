import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AUTO_COLORS = [
  { color: 'bg-green-600',  lightColor: 'bg-green-50',   borderColor: 'border-green-200',  textColor: 'text-green-700',  badgeColor: 'bg-green-100 text-green-700' },
  { color: 'bg-blue-500',   lightColor: 'bg-blue-50',    borderColor: 'border-blue-200',   textColor: 'text-blue-700',   badgeColor: 'bg-blue-100 text-blue-700' },
  { color: 'bg-orange-500', lightColor: 'bg-orange-50',  borderColor: 'border-orange-200', textColor: 'text-orange-700', badgeColor: 'bg-orange-100 text-orange-700' },
  { color: 'bg-purple-500', lightColor: 'bg-purple-50',  borderColor: 'border-purple-200', textColor: 'text-purple-700', badgeColor: 'bg-purple-100 text-purple-700' },
  { color: 'bg-red-600',    lightColor: 'bg-red-50',     borderColor: 'border-red-200',    textColor: 'text-red-700',    badgeColor: 'bg-red-100 text-red-700' },
  { color: 'bg-teal-600',   lightColor: 'bg-teal-50',    borderColor: 'border-teal-200',   textColor: 'text-teal-700',   badgeColor: 'bg-teal-100 text-teal-700' },
  { color: 'bg-pink-500',   lightColor: 'bg-pink-50',    borderColor: 'border-pink-200',   textColor: 'text-pink-700',   badgeColor: 'bg-pink-100 text-pink-700' },
  { color: 'bg-cyan-600',   lightColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',   textColor: 'text-cyan-700',   badgeColor: 'bg-cyan-100 text-cyan-700' },
  { color: 'bg-indigo-600', lightColor: 'bg-indigo-50',  borderColor: 'border-indigo-200', textColor: 'text-indigo-700', badgeColor: 'bg-indigo-100 text-indigo-700' },
];

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0;
  return Math.abs(h);
}

export function autoColor(name) {
  return AUTO_COLORS[hashName(name || '') % AUTO_COLORS.length];
}

export function autoInitials(name) {
  if (!name) return '??';
  const words = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : words[0].substring(0, 2).toUpperCase();
}

export function mapDoctorRow(row) {
  const name = row.name || '';
  const { color, lightColor, borderColor, textColor, badgeColor } = autoColor(name);

  // days is a PostgreSQL text[] — arrives as a JS array e.g. ["Tue", "Sat"]
  const days = Array.isArray(row.days) ? row.days : [];

  // timings is a JSONB object e.g. {"Tue": "6:15 PM - 8:00 PM", "Sat": "6:15 PM - 8:00 PM"}
  const timings = (row.timings !== null && typeof row.timings === 'object') ? row.timings : {};

  // Reconstruct schedule array for BookingModal / StaffDashboard compatibility
  const schedule = days.map((day) => {
    const timeRange = timings[day] || '';
    const parts = timeRange.split(' - ');
    // Strip trailing "onwards" from start so getAvailableDates can append it cleanly
    const startTime = (parts[0] || '').trim().replace(/\s*onwards\s*$/i, '');
    const endTime = (parts[1] || '').trim();
    return { day, startTime, endTime };
  });

  return {
    id: row.id,
    name,
    qualification: row.qualification || '',
    specialty: row.specialty || '',
    category: row.category || '',
    days,
    timings,
    initials: autoInitials(name),
    color,
    lightColor,
    borderColor,
    textColor,
    badgeColor,
    schedule,
    isEyeCamp: !!row.is_eye_camp,
    is_active: row.is_active,
    order_index: row.order_index ?? 0,
  };
}

export function useDoctors({ includeInactive = false } = {}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('doctors')
        .select('id, name, qualification, specialty, category, days, timings, is_active, is_eye_camp, order_index')
        .order('order_index', { ascending: true, nullsFirst: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error: err } = await query;

      if (err) {
        console.error('[useDoctors] query error:', err.message, err);
        setError(err.message);
        setDoctors([]);
      } else {
        console.log('[useDoctors] fetched', data?.length ?? 0, 'doctors');
        setDoctors((data || []).map(mapDoctorRow));
      }
    } catch (e) {
      console.error('[useDoctors] unexpected error:', e);
      setError(e.message);
      setDoctors([]);
    }
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { refetch(); }, [refetch]);

  return { doctors, loading, error, refetch };
}
