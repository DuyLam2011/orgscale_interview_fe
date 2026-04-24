import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/campaigns" className="text-lg font-semibold text-gray-900">
          Campaign Manager
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/campaigns"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Campaigns
          </Link>
          <Link
            to="/campaigns/new"
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
          >
            New Campaign
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
