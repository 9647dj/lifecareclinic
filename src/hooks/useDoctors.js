import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function mapDoctorRow(row) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    role: row.role,
    category: row.category,
    initials: row.initials,
    color: row.color || 'bg-green-600',
    lightColor: row.light_color || 'bg-green-50',
    borderColor: row.border_color || 'border-green-200',
    textColor: row.text_color || 'text-green-700',
    badgeColor: row.badge_color || 'bg-green-100 text-green-700',
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    isEyeCamp: !!row.is_eye_camp,
    everyDay: !!row.every_day,
    is_active: row.is_active,
    order_index: row.order_index,
  };
}

export function useDoctors({ includeInactive = false } = {}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    let query = supabase.from('doctors').select('*').order('order_index', { ascending: true });
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setDoctors((data || []).map(mapDoctorRow));
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { refetch(); }, [refetch]);

  return { doctors, loading, error, refetch };
}
