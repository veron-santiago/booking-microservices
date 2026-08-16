import { useMemo } from 'react'

const SPORT_FILTERS = [
  { key: 'football', label: 'Fútbol', icon: '⚽', color: 'from-emerald-500 to-green-600' },
  { key: 'tennis', label: 'Tenis', icon: '🎾', color: 'from-yellow-500 to-amber-600' },
  { key: 'basket', label: 'Básquet', icon: '🏀', color: 'from-orange-500 to-red-600' },
  { key: 'paddle', label: 'Pádel', icon: '🏓', color: 'from-blue-500 to-indigo-600' },
]

function SearchBar({
  date,
  onDateChange,
  sportTypes = [],
  onSportTypesChange,
  onSearch,
}) {
  const selectedSportsSet = useMemo(
    () => new Set(sportTypes),
    [sportTypes]
  )

  const toggleSport = (sportKey) => {
    if (selectedSportsSet.has(sportKey)) {
      // remover
      onSportTypesChange(sportTypes.filter(s => s !== sportKey))
    } else {
      // agregar
      onSportTypesChange([...sportTypes, sportKey])
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">

      {/* Fecha */}
      <div className="w-full lg:w-44">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Fecha
        </label>
        <input
          type="date"
          className="w-full rounded-xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 focus:outline-none"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Deportes */}
      <div className="flex flex-wrap gap-2">
        {SPORT_FILTERS.map((sport) => {
          const active = selectedSportsSet.has(sport.key)

          return (
            <button
              key={sport.key}
              type="button"
              onClick={() => toggleSport(sport.key)}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                active
                  ? `border-transparent bg-gradient-to-r ${sport.color} text-white shadow-md shadow-${sport.color.split('-')[1]}-300/50 hover:shadow-lg hover:scale-105`
                  : 'border-blue-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-100/60 hover:text-blue-700'
              }`}
            >
              <span className="text-base">{sport.icon}</span>
              <span className="hidden sm:inline">{sport.label}</span>
            </button>
          )
        })}
      </div>

      {/* Botón */}
      <div>
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-300 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-400 active:scale-95"
        >
          Buscar
        </button>
      </div>
    </div>
  )
}

export default SearchBar