import { useEffect, useState } from 'react';
import { getUserSession } from '../../lib/storage';

function App() {
  const [user, setUser] = useState<any>(null);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const session = await getUserSession();
    setUser(session);

    const result = await browser.storage.local.get('scraped_jobs');
    const jobs = result.scraped_jobs || [];
    setJobCount(jobs.length);
  };

  const openSidePanel = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab.windowId && browser.sidePanel) {
      await browser.sidePanel.open({ windowId: tab.windowId });
    }
    window.close();
  };

  return (
    <div className="w-80 bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <h1 className="text-lg font-bold">HireExtension</h1>
        <p className="text-sm opacity-90">AI Job Matching</p>
      </div>

      <div className="p-4 space-y-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.displayName}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jobs Scanned</span>
                <span className="text-2xl font-bold text-blue-600">{jobCount}</span>
              </div>
            </div>

            <button
              onClick={openSidePanel}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Open Side Panel
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Navigate to Jobright to scan jobs</p>
              <p>• Upload resumes in the side panel</p>
              <p>• Get AI-powered job matches</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Sign in to start matching jobs with your resume.
            </p>
            <button
              onClick={openSidePanel}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">Phase 1 Complete ✓</p>
      </div>
    </div>
  );
}

export default App;
