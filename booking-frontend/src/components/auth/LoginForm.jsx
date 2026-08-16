import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import authService from '../../services/authService'

function LoginForm({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = await authService.login(formData)
      onLoginSuccess(token)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
          Correo electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Mail className="h-5 w-5 text-slate-400" />
          </div>
          <input
            className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            id="email"
            name="email"
            onChange={handleChange}
            placeholder="tu@correo.com"
            required
            type="email"
            value={formData.email}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <input
            className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-12 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            id="password"
            name="password"
            onChange={handleChange}
            required
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
          />
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}

export default LoginForm
