import React, { useState, useEffect } from 'react';
import { WeeklySummary, TimeEntry, Customer, Project } from '../types';
import { getWeeklySummary, getCustomers, getProjects, deleteTimeEntry, exportTimeEntries } from '../api';
import { getWeekStart, getWeekDays, formatDate, formatDisplayDate, todayDate } from '../utils/dateUtils';
import { addWeeks } from 'date-fns';
import { TimeEntryDialog } from './TimeEntryDialog';

export const WeeklyView: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(todayDate()));
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState<number | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [newEntryDate, setNewEntryDate] = useState<Date | undefined>();

  useEffect(() => {
    loadData();
    loadCustomers();
  }, [currentWeekStart, filterCustomerId, filterProjectId]);

  useEffect(() => {
    if (filterCustomerId) {
      loadProjects(filterCustomerId);
    } else {
      setProjects([]);
      setFilterProjectId(null);
    }
  }, [filterCustomerId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWeeklySummary(
        formatDate(currentWeekStart),
        filterCustomerId || undefined,
        filterProjectId || undefined
      );
      setSummary(data);
    } catch (err) {
      setError('Failed to load weekly summary');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  const loadProjects = async (customerId: number) => {
    try {
      const data = await getProjects(customerId);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(todayDate()));
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setNewEntryDate(undefined);
    setIsDialogOpen(true);
  };

  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!confirm(`Delete time entry for ${entry.projectName}?`)) {
      return;
    }

    try {
      await deleteTimeEntry(entry.id);
      loadData();
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const handleAddEntry = (date?: Date) => {
    setEditingEntry(null);
    setNewEntryDate(date);
    setIsDialogOpen(true);
  };

  const handleDialogSave = () => {
    loadData();
  };

  const handleExport = async () => {
    try {
      const weekEnd = addWeeks(currentWeekStart, 1);
      const blob = await exportTimeEntries(
        formatDate(currentWeekStart),
        formatDate(weekEnd)
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-entries-${formatDate(currentWeekStart)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data');
    }
  };

  const weekDays = getWeekDays(currentWeekStart);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Weekly Overview</h2>
        <button className="primary" onClick={() => handleAddEntry()}>
          + New Entry
        </button>
      </div>

      <div className="toolbar">
        <div className="week-navigation">
          <button onClick={handlePreviousWeek}>← Prev Week</button>
          <button onClick={handleToday}>Today</button>
          <button onClick={handleNextWeek}>Next Week →</button>
          <span style={{ fontWeight: 'bold', marginLeft: '1rem' }}>
            Week of {formatDisplayDate(currentWeekStart)}
          </span>
        </div>
      </div>

      <div className="filters">
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <select
            value={filterCustomerId || ''}
            onChange={(e) => setFilterCustomerId(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {filterCustomerId && (
          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <select
              value={filterProjectId || ''}
              onChange={(e) => setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} - {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleExport}>Export to CSV</button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : summary ? (
        <>
          <div className="project-totals">
            <h3>Project Totals</h3>
            {summary.projectTotals.length === 0 ? (
              <div style={{ color: '#888' }}>No entries this week</div>
            ) : (
              summary.projectTotals.map((pt) => (
                <div key={pt.projectId} className="project-total">
                  <span>
                    <strong>{pt.customerName}</strong> - {pt.projectNumber} {pt.projectName}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{pt.totalHours.toFixed(2)}h</span>
                </div>
              ))
            )}
            <div className="total-hours">
              Total: {summary.totalHours.toFixed(2)}h
            </div>
          </div>

          <div className="week-grid">
            {summary.days.map((day, index) => {
              const dayDate = weekDays[index];
              const isToday = formatDate(dayDate) === formatDate(todayDate());
              
              return (
                <div key={day.date} className="day-card" style={{ borderLeft: isToday ? '4px solid #646cff' : 'none' }}>
                  <div className="day-header">
                    <span style={{ fontWeight: 'bold' }}>
                      {formatDisplayDate(day.date)}
                      {isToday && <span style={{ color: '#646cff', marginLeft: '0.5rem' }}>• Today</span>}
                    </span>
                    <div>
                      <span style={{ marginRight: '1rem' }}>{day.dailyTotal.toFixed(2)}h</span>
                      <button onClick={() => handleAddEntry(dayDate)} style={{ padding: '0.25rem 0.5rem' }}>
                        +
                      </button>
                    </div>
                  </div>

                  {day.entries.length === 0 ? (
                    <div style={{ color: '#888', fontSize: '0.9em', marginTop: '0.5rem' }}>
                      No entries
                    </div>
                  ) : (
                    day.entries.map((entry) => (
                      <div key={entry.id} className="time-entry" onClick={() => handleEditEntry(entry)}>
                        <div className="time-entry-header">
                          <span style={{ fontWeight: 'bold' }}>
                            {entry.customerName} - {entry.projectNumber}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>
                            {entry.hours ? `${entry.hours.toFixed(2)}h` : 
                             `${entry.startTime?.substring(0, 5)} - ${entry.endTime?.substring(0, 5)}`}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#888' }}>
                          {entry.projectName}
                        </div>
                        {entry.description && (
                          <div style={{ fontSize: '0.85em', marginTop: '0.25rem', fontStyle: 'italic' }}>
                            {entry.description}
                          </div>
                        )}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntry(entry);
                            }}
                            className="danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85em' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <TimeEntryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleDialogSave}
        editEntry={editingEntry}
        initialDate={newEntryDate}
      />
    </div>
  );
};
