import { useMemo, useState } from 'react'
import translateSport from '../../utils/sportTranslations'

function parseResultId(result) {
  return result?.facilityId ?? result?.id ?? result?._id ?? result?.facility_id ?? null
}

function groupByClub(results) {
  const map = {}

  results.forEach((r) => {
    const clubKey = r.clubId ?? r.club_id ?? r.clubName ?? 'unknown'

    if (!map[clubKey]) {
      map[clubKey] = {
        clubName: r.clubName || 'Club',
        address: r.address,
        facilities: []
      }
    }

    map[clubKey].facilities.push(r)
  })

  return Object.values(map)
}

function SearchResults({ results, onCreateBooking }) {
  const [openClubs, setOpenClubs] = useState({})

  const grouped = useMemo(() => {
    if (!Array.isArray(results)) return []
    return groupByClub(results)
  }, [results])

  const toggleClub = (clubName) => {
    setOpenClubs((prev) => ({
      ...prev,
      [clubName]: !prev[clubName]
    }))
  }

  return (
    <div className="space-y-3">
      {grouped.length ? (
        grouped.map((club, idx) => {
          const isOpen = openClubs[club.clubName]

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-blue-300/60 bg-gradient-to-br from-blue-100/70 to-indigo-100/70 shadow-md shadow-blue-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/60"
            >
              {/* HEADER CLUB */}
              <button
                onClick={() => toggleClub(club.clubName)}
                className="flex w-full items-center justify-between bg-gradient-to-r from-blue-200/60 to-indigo-200/60 px-4 py-3 text-left transition-colors hover:from-blue-300/70 hover:to-indigo-300/70"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {club.clubName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {club.address || '-'}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-white/60 px-2 py-1 text-sm font-medium text-blue-600 shadow-sm">
                  <span className="text-xs text-slate-500">{club.facilities.length}</span>
                  <span className="text-blue-600">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* CONTENIDO */}
              {isOpen && (
                <div className="border-t border-blue-300/50 bg-gradient-to-b from-blue-50/60 to-indigo-50/60 p-3 space-y-2">
                  {club.facilities.map((r, fIdx) => {
                    const id = parseResultId(r) ?? fIdx
                    const facilityId = r.facilityId ?? r.id ?? r.facility_id

                    return (
                      <div
                        key={id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-blue-300/60 bg-white p-3 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md hover:shadow-blue-200/40"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{translateSport(r.sportType) === 'Fútbol' ? '⚽' : translateSport(r.sportType) === 'Tenis' ? '🎾' : translateSport(r.sportType) === 'Básquet' ? '🏀' : translateSport(r.sportType) === 'Pádel' ? '🏓' : '🏟️'}</span>
                            <div className="text-sm font-semibold text-slate-900">
                              {r.facilityName || 'Instalación'}
                            </div>
                          </div>

                          <div className="mt-1 text-sm text-slate-700">
                            {translateSport(r.sportType) || 'Deporte'}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-300 transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-400 active:scale-95 disabled:opacity-60"
                          onClick={() => onCreateBooking({ ...r, facilityId })}
                          disabled={!onCreateBooking}
                        >
                          Reservar
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-blue-300/60 bg-gradient-to-br from-blue-100/70 to-indigo-100/70 p-6 text-center">
          <div className="text-sm font-medium text-slate-600">
            No hay resultados de búsqueda.
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResults