import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ReportsPage from './pages/ReportsPage';
import OsintPage from './pages/OsintPage';
import GraphBuilderPage from './pages/GraphBuilderPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="osint" element={<OsintPage />} />
          <Route path="graph-builder" element={<GraphBuilderPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="evidence" element={<div className="p-4 text-cyber-text">Evidence gallery coming soon...</div>} />
          <Route path="settings" element={<div className="p-4 text-cyber-text">Settings coming soon...</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
