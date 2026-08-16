import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

const AUTH_TABS = {
  login: 'Iniciar sesión',
  register: 'Registrarse',
}

function AuthPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login')

  const handleLoginSuccess = (token) => {
    onLoginSuccess(token)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-400/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-400/25 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/25 to-indigo-400/25 blur-3xl"></div>
      </div>
      <section className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-white/95 to-blue-50/90 p-8 shadow-2xl shadow-indigo-300/50 ring-1 ring-indigo-300/60 backdrop-blur-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-900">Booking System</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Inicia sesión o crea una nueva cuenta.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 p-1.5 shadow-inner">
          {Object.entries(AUTH_TABS).map(([value, label]) => (
            <button
              key={value}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === value
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-300'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'login' ? (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm />
          )}
        </div>
      </section>
    </main>
  )
}

export default AuthPage
