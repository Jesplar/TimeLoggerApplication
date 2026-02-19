import { useState } from 'react';
import './index.css';
import { WeeklyView } from './components/WeeklyView';
import { ManagementView } from './components/ManagementView';

function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'management'>('weekly');

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
      </div>

      {activeTab === 'weekly' ? <WeeklyView /> : <ManagementView />}
    </div>
  );
}

export default App;
