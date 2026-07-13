import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { BggProvider } from './hooks/BggContext.jsx';
import ToastContainer from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import GamePage from './pages/GamePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LogPlayPage from './pages/LogPlayPage.jsx';

export default function App() {
  return (
    <BggProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/log-play" element={<LogPlayPage />} />
          </Route>
        </Routes>
        <ToastContainer />
        <Analytics />
      </BrowserRouter>
    </BggProvider>
  );
}
