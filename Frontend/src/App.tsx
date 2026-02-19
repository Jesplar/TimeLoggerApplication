import { useState } from 'react';
import './index.css';
import { WeeklyView } from './components/WeeklyView';
import { ManagementView } from './components/ManagementView';
import { ReportsView } from './components/ReportsView';

function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'management' | 'reports'>('weekly');

  return (
    <div>
      <h1>⏱️ Time Logger</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly View
        </button>
        <button
          className={`tab ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          Manage
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'weekly' && <WeeklyView />}
      {activeTab === 'management' && <ManagementView />}
      {activeTab === 'reports' && <ReportsView />}
    </div>
  );
}

export default App;
