import React, { useState, useEffect } from 'react';
import { Customer, Project, TimeCode } from '../types';
import { getCustomers, getProjects, getTimeCodes, createTimeEntry } from '../api';
import { useAppStore } from '../store';
import { formatDate, formatDisplayDate, getWeekStart, getWeekDays } from '../utils/dateUtils';
import { addWeeks } from 'date-fns';

interface BulkTimeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialWeekStart?: Date;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const BulkTimeEntryDialog: React.FC<BulkTimeEntryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWeekStart,
}) => {
  const { lastUsedCustomerId, lastUsedProjectId, lastUsedTimeCodeId, setLastUsedCustomer, setLastUsedProject, setLastUsedTimeCode } = useAppStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeCodes, setTimeCodes] = useState<TimeCode[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTimeCodeId, setSelectedTimeCodeId] = useState<number | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart ?? getWeekStart(new Date()));
  // Mon=0 .. Sun=6, pre-check Mon-Fri
  const [selectedDays, setSelectedDays] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [isOnSite, setIsOnSite] = useState(false);
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadTimeCodes();
      setSavedCount(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialWeekStart) setWeekStart(initialWeekStart);
  }, [initialWeekStart]);

  useEffect(() => {
    if (selectedCustomerId && isOpen) {
      loadProjects(selectedCustomerId);
    }
  }, [selectedCustomerId, isOpen]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      if (data.length > 0 && !selectedCustomerId) {
        const def = lastUsedCustomerId ? data.find(c => c.id === lastUsedCustomerId) : data[0];
        if (def) setSelectedCustomerId(def.id);
      }
    } catch {
      setError('Failed to load customers');
    }
  };

  const loadProjects = async (customerId: number) => {
    try {
      const data = await getProjects(customerId);
      setProjects(data);
      const active = data.filter(p => p.isActive);
      if (active.length === 1) {
        setSelectedProjectId(active[0].id);
      } else {
        const def = lastUsedProjectId ? data.find(p => p.id === lastUsedProjectId) : null;
        setSelectedProjectId(def?.id ?? (data[0]?.id ?? null));
      }
    } catch {
      setError('Failed to load projects');
    }
  };

  const loadTimeCodes = async () => {
    try {
      const data = await getTimeCodes();
      setTimeCodes(data);
      if (data.length > 0 && !selectedTimeCodeId) {
        const def = lastUsedTimeCodeId ? data.find(tc => tc.id === lastUsedTimeCodeId) : data[0];
        if (def) setSelectedTimeCodeId(def.id);
      }
    } catch {
      setError('Failed to load time codes');
    }
  };

  const toggleDay = (index: number) => {
    setSelectedDays(prev => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handlePrevWeek = () => setWeekStart(addWeeks(weekStart, -1));
  const handleNextWeek = () => setWeekStart(addWeeks(weekStart, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProjectId) { setError('Please select a project'); return; }
    if (!selectedTimeCodeId) { setError('Please select a time code'); return; }

    const hoursNum = parseFloat(hoursPerDay);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      setError('Please enter valid hours (0–24)');
      return;
    }

    const daysToCreate = weekDays.filter((_, i) => selectedDays[i]);
    if (daysToCreate.length === 0) {
      setError('Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      for (const day of daysToCreate) {
        await createTimeEntry({
          projectId: selectedProjectId,
          timeCodeId: selectedTimeCodeId,
          date: formatDate(day),
          hours: hoursNum,
          isOnSite,
          description: description.trim() || undefined,
        });
      }
      setLastUsedCustomer(selectedCustomerId!);
      setLastUsedProject(selectedProjectId);
      setLastUsedTimeCode(selectedTimeCodeId);
      setSavedCount(daysToCreate.length);
      onSave();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save entries');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSavedCount(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Register Week</h2>
          <button onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer */}
          <div className="form-group">
            <label htmlFor="bulk-customer">Customer</label>
            <select
              id="bulk-customer"
              value={selectedCustomerId || ''}
              onChange={(e) => {
                setSelectedCustomerId(parseInt(e.target.value));
                setSelectedProjectId(null);
              }}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="form-group">
            <label htmlFor="bulk-project">Project</label>
            <select
              id="bulk-project"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
              required
              disabled={!selectedCustomerId}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectNumber} - {p.name}</option>
              ))}
            </select>
          </div>

          {/* Time Code */}
          <div className="form-group">
            <label htmlFor="bulk-timecode">Time Code</label>
            <select
              id="bulk-timecode"
              value={selectedTimeCodeId || ''}
              onChange={(e) => setSelectedTimeCodeId(parseInt(e.target.value))}
              required
            >
              <option value="">Select Time Code</option>
              {timeCodes.map((tc) => (
                <option key={tc.id} value={tc.id}>{tc.code} - {tc.description}</option>
              ))}
            </select>
          </div>

          {/* Week navigation */}
          <div className="form-group">
            <label>Week</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handlePrevWeek}>←</button>
              <span style={{ fontWeight: 'bold', minWidth: '140px', textAlign: 'center' }}>
                {formatDisplayDate(weekStart)} – {formatDisplayDate(weekDays[6])}
              </span>
              <button type="button" onClick={handleNextWeek}>→</button>
            </div>
          </div>

          {/* Day checkboxes */}
          <div className="form-group">
            <label>Days</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {weekDays.map((day, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: selectedDays[i] ? '#646cff22' : 'transparent',
                    border: `1px solid ${selectedDays[i] ? '#646cff' : '#444'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays[i]}
                    onChange={() => toggleDay(i)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: 'bold' }}>{DAY_NAMES[i]}</span>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    {formatDisplayDate(day).split(',')[1]?.trim() ?? ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Hours per day */}
          <div className="form-group">
            <label htmlFor="bulk-hours">Hours per Day</label>
            <input
              type="number"
              id="bulk-hours"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              step="0.25"
              min="0.25"
              max="24"
              required
            />
          </div>

          {/* On-site */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={isOnSite} onChange={(e) => setIsOnSite(e.target.checked)} />
              On Site Work
            </label>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="bulk-description">Description (Optional, applied to all days)</label>
            <textarea
              id="bulk-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g., Sprint 12 development"
            />
          </div>

          {savedCount !== null && (
            <div style={{ color: '#4caf50', marginBottom: '0.5rem' }}>
              ✓ Created {savedCount} entr{savedCount === 1 ? 'y' : 'ies'} successfully
            </div>
          )}
          {error && <div className="error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={handleClose} disabled={loading}>
              Close
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading
                ? 'Saving...'
                : `Create ${selectedDays.filter(Boolean).length} Entr${selectedDays.filter(Boolean).length === 1 ? 'y' : 'ies'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
