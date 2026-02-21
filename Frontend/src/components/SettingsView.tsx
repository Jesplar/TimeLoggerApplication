import React, { useState, useEffect } from 'react';
import { Settings, UpdateSettingsDto, TimeCode, CreateTimeCodeDto, UpdateTimeCodeDto, ReceiptType, CreateReceiptTypeDto, UpdateReceiptTypeDto } from '../types';
import { getSettings, updateSettings, getTimeCodes, createTimeCode, updateTimeCode, deleteTimeCode, getReceiptTypes, createReceiptType, updateReceiptType, deleteReceiptType, getDatabaseInfo } from '../api';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'timecodes' | 'receipttypes' | 'database'>('general');
  
  // General settings state
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sekToEurRate, setSekToEurRate] = useState('');
  const [hourlyRateEur, setHourlyRateEur] = useState('');
  const [travelHourlyRateEur, setTravelHourlyRateEur] = useState('');
  const [kmCost, setKmCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Time codes state
  const [timeCodes, setTimeCodes] = useState<TimeCode[]>([]);
  const [editingTimeCode, setEditingTimeCode] = useState<TimeCode | null>(null);
  const [newTimeCodeCode, setNewTimeCodeCode] = useState('');
  const [newTimeCodeDescription, setNewTimeCodeDescription] = useState('');
  const [newTimeCodeIsActive, setNewTimeCodeIsActive] = useState(true);
  const [showTimeCodeForm, setShowTimeCodeForm] = useState(false);

  // Receipt types state
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [editingReceiptType, setEditingReceiptType] = useState<ReceiptType | null>(null);
  const [newReceiptTypeName, setNewReceiptTypeName] = useState('');
  const [newReceiptTypeIsActive, setNewReceiptTypeIsActive] = useState(true);
  const [showReceiptTypeForm, setShowReceiptTypeForm] = useState(false);

  // Database state
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);

  // Update state
  const [updateStatus, setUpdateStatus] = useState<{ status: string; version?: string; percent?: number; message?: string } | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const isElectron = !!(window as any).electronAPI;

  useEffect(() => {
    loadSettings();
    loadTimeCodes();
    loadReceiptTypes();
    loadDatabaseInfo();

    // Listen for update status from Electron main process
    if ((window as any).electronAPI?.onUpdateStatus) {
      (window as any).electronAPI.onUpdateStatus((info: any) => setUpdateStatus(info));
    }
    if ((window as any).electronAPI?.getAppVersion) {
      (window as any).electronAPI.getAppVersion().then((v: string) => setAppVersion(v));
    }
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setSekToEurRate(data.sekToEurRate.toString());
      setHourlyRateEur(data.hourlyRateEur.toString());
      setTravelHourlyRateEur(data.travelHourlyRateEur.toString());
      setKmCost(data.kmCost.toString());
    } catch (err) {
      setError('Failed to load settings');
    }
  };

  const loadTimeCodes = async () => {
    try {
      const data = await getTimeCodes();
      setTimeCodes(data);
    } catch (err) {
      console.error('Failed to load time codes', err);
    }
  };

  const loadReceiptTypes = async () => {
    try {
      const data = await getReceiptTypes();
      setReceiptTypes(data);
    } catch (err) {
      console.error('Failed to load receipt types', err);
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const data = await getDatabaseInfo();
      setDatabaseInfo(data);
    } catch (err) {
      console.error('Failed to load database info', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const updateDto: UpdateSettingsDto = {
      sekToEurRate: parseFloat(sekToEurRate),
      hourlyRateEur: parseFloat(hourlyRateEur),
      travelHourlyRateEur: parseFloat(travelHourlyRateEur),
      kmCost: parseFloat(kmCost),
    };

    if (
      isNaN(updateDto.sekToEurRate) ||
      isNaN(updateDto.hourlyRateEur) ||
      isNaN(updateDto.travelHourlyRateEur) ||
      isNaN(updateDto.kmCost)
    ) {
      setError('Please enter valid numbers for all fields');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateSettings(updateDto);
      setSettings(updated);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setSekToEurRate(settings.sekToEurRate.toString());
      setHourlyRateEur(settings.hourlyRateEur.toString());
      setTravelHourlyRateEur(settings.travelHourlyRateEur.toString());
      setKmCost(settings.kmCost.toString());
    }
    setError('');
    setSuccessMessage('');
  };

  // Time Code functions
  const handleAddTimeCode = () => {
    setEditingTimeCode(null);
    setNewTimeCodeCode('');
    setNewTimeCodeDescription('');
    setNewTimeCodeIsActive(true);
    setShowTimeCodeForm(true);
  };

  const handleEditTimeCode = (timeCode: TimeCode) => {
    setEditingTimeCode(timeCode);
    setNewTimeCodeCode(timeCode.code.toString());
    setNewTimeCodeDescription(timeCode.description);
    setNewTimeCodeIsActive(timeCode.isActive);
    setShowTimeCodeForm(true);
  };

  const handleSaveTimeCode = async () => {
    setError('');
    setSuccessMessage('');

    if (!newTimeCodeCode.trim() || !newTimeCodeDescription.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const codeNumber = parseInt(newTimeCodeCode);
    if (isNaN(codeNumber)) {
      setError('Code must be a valid number');
      return;
    }

    setLoading(true);
    try {
      if (editingTimeCode) {
        const updateDto: UpdateTimeCodeDto = {
          code: codeNumber,
          description: newTimeCodeDescription,
          isActive: newTimeCodeIsActive,
        };
        await updateTimeCode(editingTimeCode.id, updateDto);
        setSuccessMessage('Time code updated successfully!');
      } else {
        const createDto: CreateTimeCodeDto = {
          code: codeNumber,
          description: newTimeCodeDescription,
        };
        await createTimeCode(createDto);
        setSuccessMessage('Time code created successfully!');
      }
      await loadTimeCodes();
      setShowTimeCodeForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to save time code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time code?')) return;

    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await deleteTimeCode(id);
      setSuccessMessage('Time code deleted successfully!');
      await loadTimeCodes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to delete time code. It may be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTimeCode = () => {
    setShowTimeCodeForm(false);
    setEditingTimeCode(null);
    setNewTimeCodeCode('');
    setNewTimeCodeDescription('');
    setNewTimeCodeIsActive(true);
    setError('');
  };

  // Receipt Type functions
  const handleAddReceiptType = () => {
    setEditingReceiptType(null);
    setNewReceiptTypeName('');
    setNewReceiptTypeIsActive(true);
    setShowReceiptTypeForm(true);
  };

  const handleEditReceiptType = (receiptType: ReceiptType) => {
    setEditingReceiptType(receiptType);
    setNewReceiptTypeName(receiptType.name);
    setNewReceiptTypeIsActive(receiptType.isActive);
    setShowReceiptTypeForm(true);
  };

  const handleSaveReceiptType = async () => {
    setError('');
    setSuccessMessage('');

    if (!newReceiptTypeName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    try {
      if (editingReceiptType) {
        const updateDto: UpdateReceiptTypeDto = {
          name: newReceiptTypeName,
          isActive: newReceiptTypeIsActive,
        };
        await updateReceiptType(editingReceiptType.id, updateDto);
        setSuccessMessage('Receipt category updated successfully!');
      } else {
        const createDto: CreateReceiptTypeDto = {
          name: newReceiptTypeName,
        };
        await createReceiptType(createDto);
        setSuccessMessage('Receipt category created successfully!');
      }
      await loadReceiptTypes();
      setShowReceiptTypeForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to save receipt category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceiptType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this receipt category?')) return;

    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await deleteReceiptType(id);
      setSuccessMessage('Receipt category deleted successfully!');
      await loadReceiptTypes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to delete receipt category. It may be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReceiptType = () => {
    setShowReceiptTypeForm(false);
    setEditingReceiptType(null);
    setNewReceiptTypeName('');
    setNewReceiptTypeIsActive(true);
    setError('');
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="settings-view">
      <h2>Application Settings</h2>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'timecodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('timecodes')}
        >
          Time Codes
        </button>
        <button
          className={`tab ${activeTab === 'receipttypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipttypes')}
        >
          Receipt Categories
        </button>
        <button
          className={`tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          Database
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {activeTab === 'general' && (
        <>
          <p className="settings-description">
            Configure billing rates and conversion factors used in reports and invoicing.
          </p>

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <h3>Currency Conversion</h3>
              <div className="form-group">
                <label htmlFor="sekToEurRate">SEK to EUR Conversion Rate</label>
                <input
                  type="number"
                  id="sekToEurRate"
                  value={sekToEurRate}
                  onChange={(e) => setSekToEurRate(e.target.value)}
                  step="0.0001"
                  min="0"
                  required
                />
                <small>Current rate: 1 EUR = {sekToEurRate} SEK</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Billing Rates</h3>
              <div className="form-group">
                <label htmlFor="hourlyRateEur">Standard Hourly Rate (€)</label>
                <input
                  type="number"
                  id="hourlyRateEur"
                  value={hourlyRateEur}
                  onChange={(e) => setHourlyRateEur(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
                <small>Applied to regular work hours and on-site work</small>
              </div>

              <div className="form-group">
                <label htmlFor="travelHourlyRateEur">Travel Hourly Rate (€)</label>
                <input
                  type="number"
                  id="travelHourlyRateEur"
                  value={travelHourlyRateEur}
                  onChange={(e) => setTravelHourlyRateEur(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
                <small>Applied to travel time</small>
              </div>

              <div className="form-group">
                <label htmlFor="kmCost">Travel Distance Cost (€/km)</label>
                <input
                  type="number"
                  id="kmCost"
                  value={kmCost}
                  onChange={(e) => setKmCost(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
                <small>Cost per kilometer traveled</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleReset} disabled={loading}>
                Reset
              </button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {settings.modifiedDate && (
            <div className="settings-info">
              <small>
                Last updated: {new Date(settings.modifiedDate).toLocaleString()}
              </small>
            </div>
          )}
        </>
      )}

      {activeTab === 'timecodes' && (
        <div className="management-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p>Manage time codes used in time entries.</p>
            <button onClick={handleAddTimeCode} className="primary">
              + Add Time Code
            </button>
          </div>

          {showTimeCodeForm && (
            <div className="form-card" style={{ marginBottom: '1.5rem' }}>
              <h3>{editingTimeCode ? 'Edit Time Code' : 'New Time Code'}</h3>
              <div className="form-group">
                <label>Code</label>
                <input
                  type="text"
                  value={newTimeCodeCode}
                  onChange={(e) => setNewTimeCodeCode(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newTimeCodeDescription}
                  onChange={(e) => setNewTimeCodeDescription(e.target.value)}
                  placeholder="e.g., Regular Work"
                />
              </div>
              {editingTimeCode && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newTimeCodeIsActive}
                      onChange={(e) => setNewTimeCodeIsActive(e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              )}
              <div className="form-actions">
                <button onClick={handleCancelTimeCode} disabled={loading}>
                  Cancel
                </button>
                <button onClick={handleSaveTimeCode} className="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeCodes.map((tc) => (
                <tr key={tc.id}>
                  <td>{tc.code}</td>
                  <td>{tc.description}</td>
                  <td>
                    <button
                      onClick={() => handleEditTimeCode(tc)}
                      className="secondary"
                      style={{ marginRight: '0.5rem', fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTimeCode(tc.id)}
                      className="danger"
                      style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'receipttypes' && (
        <div className="management-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p>Manage receipt categories used when adding receipts.</p>
            <button onClick={handleAddReceiptType} className="primary">
              + Add Category
            </button>
          </div>

          {showReceiptTypeForm && (
            <div className="form-card" style={{ marginBottom: '1.5rem' }}>
              <h3>{editingReceiptType ? 'Edit Receipt Category' : 'New Receipt Category'}</h3>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newReceiptTypeName}
                  onChange={(e) => setNewReceiptTypeName(e.target.value)}
                  placeholder="e.g., Hotel"
                />
              </div>
              {editingReceiptType && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newReceiptTypeIsActive}
                      onChange={(e) => setNewReceiptTypeIsActive(e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              )}
              <div className="form-actions">
                <button onClick={handleCancelReceiptType} disabled={loading}>
                  Cancel
                </button>
                <button onClick={handleSaveReceiptType} className="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receiptTypes.map((rt) => (
                <tr key={rt.id}>
                  <td>{rt.name}</td>
                  <td>{rt.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      onClick={() => handleEditReceiptType(rt)}
                      className="secondary"
                      style={{ marginRight: '0.5rem', fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReceiptType(rt.id)}
                      className="danger"
                      style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="database-section">
          <p className="settings-description">
            Database configuration and information
          </p>

          {databaseInfo ? (
            <div className="database-info">
              <div className="info-section">
                <h3>Database Information</h3>
                
                <div className="info-row">
                  <strong>Mode:</strong>
                  <span className={`mode-badge ${databaseInfo.isPortable ? 'portable' : 'installed'}`}>
                    {databaseInfo.mode}
                  </span>
                </div>

                <div className="info-row">
                  <strong>Provider:</strong>
                  <span>{databaseInfo.provider}</span>
                </div>

                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={databaseInfo.exists ? 'status-ok' : 'status-error'}>
                    {databaseInfo.exists ? '✓ Connected' : '✗ Not Found'}
                  </span>
                </div>

                {databaseInfo.exists && (
                  <>
                    <div className="info-row">
                      <strong>Size:</strong>
                      <span>{databaseInfo.sizeFormatted}</span>
                    </div>

                    {databaseInfo.lastModified && (
                      <div className="info-row">
                        <strong>Last Modified:</strong>
                        <span>{new Date(databaseInfo.lastModified).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="info-row">
                  <strong>Location:</strong>
                  <div className="path-display">
                    <code>{databaseInfo.path}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(databaseInfo.path);
                        setSuccessMessage('Path copied to clipboard!');
                        setTimeout(() => setSuccessMessage(''), 2000);
                      }}
                      className="copy-button"
                      title="Copy path to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Application Update</h3>
                <div className="info-row">
                  <strong>Version:</strong>
                  <span>{appVersion ?? ((window as any).electronAPI ? 'Loading...' : 'Development')}</span>
                </div>
                {updateStatus && (
                  <div className="info-row">
                    <strong>Status:</strong>
                    <span className={
                      updateStatus.status === 'available' || updateStatus.status === 'downloaded' ? 'status-ok' :
                      updateStatus.status === 'error' ? 'status-error' : undefined
                    }>
                      {updateStatus.status === 'checking' && 'Checking for updates...'}
                      {updateStatus.status === 'up-to-date' && '✓ Up to date'}
                      {updateStatus.status === 'available' && `Version ${updateStatus.version} available`}
                      {updateStatus.status === 'downloading' && `Downloading... ${updateStatus.percent ?? 0}%`}
                      {updateStatus.status === 'downloaded' && `✓ Version ${updateStatus.version} ready — restart to install`}
                      {updateStatus.status === 'error' && `Update error: ${updateStatus.message}`}
                    </span>
                  </div>
                )}
                {isElectron && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      onClick={() => (window as any).electronAPI.checkForUpdates()}
                      className="secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Check for Updates
                    </button>
                  </div>
                )}
              </div>

              <div className="info-section">
                <div>
                  <p className="settings-description">
                    <strong>Installed Mode:</strong> Database is stored in your user profile 
                    ({'{AppData}'}/TimeLogger). Persists across application updates.
                  </p>
                  <p className="settings-description">
                    <strong>Portable Mode:</strong> Database is stored alongside the application 
                    in the Data folder. Perfect for USB drives or running without installation.
                  </p>
                  <p className="settings-description">
                    <strong>Note:</strong> The mode is determined when the application starts 
                    based on whether a portable.txt marker file exists in the application directory.
                  </p>
                </div>
              </div>

              <div className="info-section">
                <h3>Backup</h3>
                <div>
                  <p className="settings-description">
                    To backup your database, simply copy the file from the location shown above.
                    The database is a single SQLite file that contains all your data.
                  </p>
                  <p className="settings-description">
                    To restore a backup, replace the database file with your backup copy while 
                    the application is closed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>Loading database information...</div>
          )}
        </div>
      )}
    </div>
  );
};
