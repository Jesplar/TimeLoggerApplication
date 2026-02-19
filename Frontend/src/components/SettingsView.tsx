import React, { useState, useEffect } from 'react';
import { Settings, UpdateSettingsDto } from '../types';
import { getSettings, updateSettings } from '../api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sekToEurRate, setSekToEurRate] = useState('');
  const [hourlyRateEur, setHourlyRateEur] = useState('');
  const [travelHourlyRateEur, setTravelHourlyRateEur] = useState('');
  const [kmCost, setKmCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
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

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="settings-view">
      <h2>Application Settings</h2>
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

        {error && <div className="error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}

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
    </div>
  );
};
