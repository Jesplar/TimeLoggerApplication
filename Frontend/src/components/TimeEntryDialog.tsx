import React, { useState, useEffect } from 'react';
import { Customer, Project, TimeCode, CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntry } from '../types';
import { getCustomers, getProjects, getTimeCodes, createTimeEntry, updateTimeEntry } from '../api';
import { useAppStore } from '../store';
import { formatDate, todayDate, yesterdayDate, parseTimeString } from '../utils/dateUtils';

interface TimeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editEntry?: TimeEntry | null;
  initialDate?: Date;
}

export const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editEntry,
  initialDate,
}) => {
  const { lastUsedCustomerId, lastUsedProjectId, lastUsedTimeCodeId, setLastUsedCustomer, setLastUsedProject, setLastUsedTimeCode } = useAppStore();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeCodes, setTimeCodes] = useState<TimeCode[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTimeCodeId, setSelectedTimeCodeId] = useState<number | null>(null);
  const [date, setDate] = useState(formatDate(initialDate || todayDate()));
  const [entryMode, setEntryMode] = useState<'hours' | 'times'>('hours');
  const [hours, setHours] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [isOnSite, setIsOnSite] = useState(false);
  const [travelHours, setTravelHours] = useState('');
  const [travelKm, setTravelKm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadTimeCodes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editEntry) {
      setSelectedCustomerId(editEntry.customerId);
      setSelectedProjectId(editEntry.projectId);
      setSelectedTimeCodeId(editEntry.timeCodeId);
      setDate(formatDate(editEntry.date));
      setDescription(editEntry.description || '');
      setIsOnSite(editEntry.isOnSite);
      setTravelHours(editEntry.travelHours?.toString() || '');
      setTravelKm(editEntry.travelKm?.toString() || '');
      
      if (editEntry.hours) {
        setEntryMode('hours');
        setHours(editEntry.hours.toString());
      } else if (editEntry.startTime && editEntry.endTime) {
        setEntryMode('times');
        setStartTime(editEntry.startTime.substring(0, 5));
        setEndTime(editEntry.endTime.substring(0, 5));
      }
    } else {
      // Reset form for new entry
      setSelectedCustomerId(lastUsedCustomerId);
      setSelectedProjectId(lastUsedProjectId);
      setSelectedTimeCodeId(null);
      setDate(formatDate(initialDate || todayDate()));
      setEntryMode('hours');
      setHours('');
      setStartTime('');
      setEndTime('');
      setDescription('');
      setIsOnSite(false);
      setTravelHours('');
      setTravelKm('');
    }
    setError('');
  }, [editEntry, isOpen, lastUsedCustomerId, lastUsedProjectId, initialDate]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadProjects(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      
      if (!editEntry && data.length > 0 && !selectedCustomerId) {
        const defaultCustomer = lastUsedCustomerId 
          ? data.find(c => c.id === lastUsedCustomerId) 
          : data[0];
        if (defaultCustomer) {
          setSelectedCustomerId(defaultCustomer.id);
        }
      }
    } catch (err) {
      setError('Failed to load customers');
    }
  };

  const loadProjects = async (customerId: number) => {
    try {
      const data = await getProjects(customerId);
      setProjects(data);
      
      if (!editEntry && data.length > 0 && !selectedProjectId) {
        const defaultProject = lastUsedProjectId 
          ? data.find(p => p.id === lastUsedProjectId) 
          : data[0];
        if (defaultProject) {
          setSelectedProjectId(defaultProject.id);
        }
      }
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const loadTimeCodes = async () => {
    try {
      const data = await getTimeCodes();
      setTimeCodes(data);
      
      if (!editEntry && data.length > 0 && !selectedTimeCodeId) {
        const defaultTimeCode = lastUsedTimeCodeId 
          ? data.find(tc => tc.id === lastUsedTimeCodeId) 
          : data[0];
        if (defaultTimeCode) {
          setSelectedTimeCodeId(defaultTimeCode.id);
        }
      }
    } catch (err) {
      setError('Failed to load time codes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    if (!selectedTimeCodeId) {
      setError('Please select a time code');
      return;
    }

    const dto: CreateTimeEntryDto | UpdateTimeEntryDto = {
      projectId: selectedProjectId,
      timeCodeId: selectedTimeCodeId,
      date: date,
      description: description.trim() || undefined,
      isOnSite: isOnSite,
      travelHours: travelHours ? parseFloat(travelHours) : undefined,
      travelKm: travelKm ? parseFloat(travelKm) : undefined,
    };

    if (entryMode === 'hours') {
      const hoursNum = parseFloat(hours);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        setError('Please enter valid hours');
        return;
      }
      dto.hours = hoursNum;
    } else {
      const start = parseTimeString(startTime);
      const end = parseTimeString(endTime);
      
      if (!start || !end) {
        setError('Please enter valid times in HH:MM format');
        return;
      }
      
      dto.startTime = start;
      dto.endTime = end;
    }

    setLoading(true);
    try {
      if (editEntry) {
        await updateTimeEntry(editEntry.id, dto);
      } else {
        await createTimeEntry(dto);
        setLastUsedCustomer(selectedCustomerId!);
        setLastUsedProject(selectedProjectId);
        setLastUsedTimeCode(selectedTimeCodeId);
      }
      onSave();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editEntry ? 'Edit Time Entry' : 'New Time Entry'}</h2>
          <button onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customer">Customer</label>
            <select
              id="customer"
              value={selectedCustomerId || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedCustomerId(id);
                setSelectedProjectId(null);
              }}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="project">Project</label>
            <select
              id="project"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
              required
              disabled={!selectedCustomerId}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="timecode">Time Code</label>
            <select
              id="timecode"
              value={selectedTimeCodeId || ''}
              onChange={(e) => setSelectedTimeCodeId(parseInt(e.target.value))}
              required
            >
              <option value="">Select Time Code</option>
              {timeCodes.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.code} - {tc.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setDate(formatDate(todayDate()))}>
                Today
              </button>
              <button type="button" onClick={() => setDate(formatDate(yesterdayDate()))}>
                Yesterday
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Entry Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={entryMode === 'hours' ? 'primary' : 'secondary'}
                onClick={() => setEntryMode('hours')}
              >
                Hours
              </button>
              <button
                type="button"
                className={entryMode === 'times' ? 'primary' : 'secondary'}
                onClick={() => setEntryMode('times')}
              >
                Start/End Times
              </button>
            </div>
          </div>

          {entryMode === 'hours' ? (
            <div className="form-group">
              <label htmlFor="hours">Hours</label>
              <input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                step="0.25"
                min="0"
                max="24"
                placeholder="e.g., 8 or 7.5"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={isOnSite}
                onChange={(e) => setIsOnSite(e.target.checked)}
              />
              On Site Work
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="travelHours">Travel Time (Hours, Optional)</label>
            <input
              type="number"
              id="travelHours"
              value={travelHours}
              onChange={(e) => setTravelHours(e.target.value)}
              step="0.25"
              min="0"
              max="24"
              placeholder="e.g., 2 or 1.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="travelKm">Travel Distance (km, Optional)</label>
            <input
              type="number"
              id="travelKm"
              value={travelKm}
              onChange={(e) => setTravelKm(e.target.value)}
              step="1"
              min="0"
              placeholder="e.g., 150"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add notes about this time entry..."
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving...' : editEntry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
