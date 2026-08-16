import ClubDashboard from './ClubDashboard'

function Dashboard({ onLogout }) {
  // MVP: the authenticated role for this flow is CLUB.
  return <ClubDashboard onLogout={onLogout} />
}

export default Dashboard
