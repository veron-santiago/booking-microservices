import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, User, Building2 } from 'lucide-react'
import authService from '../../services/authService'

const REGISTER_TYPES = {
  user: 'Usuario',
  club: 'Club',
}

function RegisterForm() {
  const [registerType, setRegisterType] = useState('user')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = { ...formData }
      if (registerType === 'user') {
        await authService.registerUser(payload)
      } else {
        await authService.registerClub(payload)
      }

      setSuccess('Registro exitoso. Ya puedes iniciar sesión.')
      setFormData({ name: '', email: '', password: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo completar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 p-1.5 shadow-inner">
        {Object.entries(REGISTER_TYPES).map(([value, label]) => (
          <button
            key={value}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              registerType === value
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-300'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            onClick={() => setRegisterType(value)}
            type="button"
          >
            {value === 'user' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      <form className="space-y-5" onSubmit={handleRegister}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">
            Nombre
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              {registerType === 'user' ? <User className="h-5 w-5 text-slate-400" /> : <Building2 className="h-5 w-5 text-slate-400" />}
            </div>
            <input
              className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              id="name"
              name="name"
              onChange={handleChange}
              placeholder={registerType === 'user' ? 'Tu nombre' : 'Nombre del club'}
              required
              type="text"
              value={formData.name}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-email">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              id="register-email"
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
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-password">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-12 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              id="register-password"
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
        {success && (
          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <button
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}

export default RegisterForm
