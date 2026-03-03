import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import RosterPage from './pages/RosterPage'
import ProspectsPage from './pages/ProspectsPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import PlayerFormPage from './pages/PlayerFormPage'
import ComparePage from './pages/ComparePage'
import GamesPage from './pages/GamesPage'
import GameDetailPage from './pages/GameDetailPage'
import TagsPage from './pages/TagsPage'
import ActivityLogPage from './pages/ActivityLogPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/partners" element={<RosterPage />} />
        <Route path="/prospects" element={<ProspectsPage />} />
        <Route path="/players/new" element={<PlayerFormPage />} />
        <Route path="/players/:id" element={<PlayerDetailPage />} />
        <Route path="/players/:id/edit" element={<PlayerFormPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/activity" element={<ActivityLogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
