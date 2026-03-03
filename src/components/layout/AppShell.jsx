import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar onAddPlayer={() => navigate('/players/new')} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
