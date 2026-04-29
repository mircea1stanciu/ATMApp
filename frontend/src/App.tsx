import { Routes, Route, Navigate } from 'react-router-dom'

// Pages — TODO: de implementat în Faza 3
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-gray-500 mt-2">TestManager — în construcție 🚧</p></div>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
