import { useEffect, useState } from 'react';
import { getUserSession } from '../../lib/storage';

function App() {
  const [user, setUser] = useState<any>(null);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    void loadData();
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <h1 className="text-lg font-bold">HireExtension</h1>
        <p className="text-sm opacity-90">Jobright resume matching workspace</p>
      </div>

      <div className="space-y-4 p-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jobs scanned</span>
                <span className="text-2xl font-bold text-blue-600">{jobCount}</span>
              </div>
            </div>

            <button
              onClick={openSidePanel}
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Open Side Panel
            </button>

            <div className="space-y-1 text-xs text-gray-500">
              <p>Open Jobright recommended jobs to scan listings</p>
              <p>Upload multiple resumes in the side panel</p>
              <p>Sort, filter, and inspect AI match details</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Sign in to start matching jobs with your resume.
            </p>
            <button
              onClick={openSidePanel}
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Sign In
            </button>
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">Auth, resumes, scraping, and AI matching enabled</p>
      </div>
    </div>
  );
}

export default App;
