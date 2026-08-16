import { useEffect, useMemo, useState } from 'react'
import { MapPin, LogOut, Search, Calendar, Clock, LayoutDashboard } from 'lucide-react'
import userService from '../services/userService'
import BookingList from '../components/user/BookingList'
import SearchBar from '../components/user/SearchBar'
import SearchResults from '../components/user/SearchResults'
import MapModal from '../components/user/MapModal'
import BookingModal from '../components/user/BookingModal'

function parseBookingStart(booking) {
  return booking?.start ?? booking?.startTime ?? booking?.from ?? null
}

function UserDashboard({ onLogout }) {
  const [bookings, setBookings] = useState([])
  const [results, setResults] = useState([])

  const [location, setLocation] = useState(null)
  const [radius, setRadius] = useState(5)
  const [date, setDate] = useState('')
  const [sportTypes, setSportTypes] = useState([])

  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [mapOpen, setMapOpen] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)

  const refetchBookings = async () => {
    setLoadingBookings(true)
    try {
      const list = await userService.getUserBookings()
      setBookings(Array.isArray(list) ? list : [])
    } catch {
      setBookings([])
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    refetchBookings()
  }, [])

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return
    try {
      await userService.cancelBooking(bookingId)
      await refetchBookings()
    } catch {
      // ignore cancellation errors; the list stays as-is
    }
  }

  const handleCreateBooking = (facility) => {
    const facilityId = facility?.facilityId ?? facility?.id ?? facility?.facility_id
    const clubId = facility?.clubId ?? facility?.club_id
    if (!facilityId) return

    setSelectedFacility({
      ...facility,
      facilityId,
      clubId,
    })
    setBookingModalOpen(true)
  }

  const handleBookingSuccess = () => {
    refetchBookings()
  }

  const handleSearch = async () => {
    setSearchError('')

    if (!location) {
      setSearchError('Selecciona una ubicación.')
      return
    }

    if (!date) {
      setSearchError('Selecciona una fecha.')
      return
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      setSearchError('Fecha inválida.')
      return
    }

    setLoadingSearch(true)
    setResults([])

    try {
      const res = await userService.searchFacilities({
        lat: location.lat,
        lon: location.lon,
        radius,
        sportTypes,
        date: parsedDate.toISOString(),
      })

      setResults(res)
    } catch (e) {
      setResults([])
      setSearchError(e?.response?.data?.message || 'No se pudo buscar.')
    } finally {
      setLoadingSearch(false)
    }
  }

  const sortedBookings = useMemo(() => {
    return [...(bookings || [])].sort((a, b) => {
      const aStart = parseBookingStart(a)
      const bStart = parseBookingStart(b)
      const ad = aStart ? new Date(aStart).getTime() : Number.POSITIVE_INFINITY
      const bd = bStart ? new Date(bStart).getTime() : Number.POSITIVE_INFINITY
      return ad - bd
    })
  }, [bookings])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-400/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-400/25 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/25 to-indigo-400/25 blur-3xl"></div>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-8">

        {/* HEADER */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 shadow-xl shadow-indigo-300/40">
          <div className="relative px-6 py-8 md:px-8 md:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-white/15 to-transparent blur-2xl"></div>
            <div className="absolute bottom-0 right-1/3 h-32 w-32 translate-x-6 translate-y-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent blur-xl"></div>
            <div className="absolute left-1/4 bottom-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-gradient-to-br from-violet-400/15 to-transparent blur-xl"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-6 w-6 text-indigo-200" />
                  <h1 className="text-2xl font-bold text-white md:text-3xl">Panel de usuario</h1>
                </div>
                <p className="mt-2 text-sm text-indigo-100 md:text-base">
                  Buscar instalaciones y gestionar tus reservas.
                </p>
              </div>

              <button
                type="button"
                className="group flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 hover:shadow-lg border border-white/20"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH + LOCATION */}
        <div className="mt-8 flex gap-4 items-stretch">

          <div className="w-72 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/80 p-5 shadow-lg shadow-indigo-300/50 ring-1 ring-indigo-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-400/60 hover:ring-indigo-400/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-300">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="text-sm font-semibold text-slate-900">Ubicación</div>
              </div>
              <div className="mt-3 text-sm text-slate-700">
                {location ? (
                  <span className="truncate block font-medium text-indigo-900">{location.name}</span>
                ) : (
                  <span className="text-slate-500 italic">No seleccionada</span>
                )}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Radio: {radius} km</span>
                </div>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98]"
              onClick={() => setMapOpen(true)}
            >
              Ajustar ubicación
            </button>
          </div>

          <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 p-5 shadow-lg shadow-blue-300/50 ring-1 ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/60 hover:ring-blue-400/70">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-300">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-900">Buscar instalaciones</div>
            </div>
            <SearchBar
              date={date}
              onDateChange={setDate}
              sportTypes={sportTypes}
              onSportTypesChange={setSportTypes}
              onSearch={handleSearch}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <section className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 shadow-lg shadow-blue-300/50 ring-1 ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/60 hover:ring-blue-400/70 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-300">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Resultados</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{results.length} encontradas</span>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              {location
                ? <>Buscando cerca de <span className="font-semibold text-blue-600">{location.name}</span></>
                : 'Selecciona una ubicación para buscar.'}
            </div>

            <div className="mt-4">
              {loadingSearch ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                  <span>Buscando instalaciones...</span>
                </div>
              ) : searchError ? (
                <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{searchError}</div>
              ) : (
                <SearchResults results={results} onCreateBooking={handleCreateBooking} />
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/80 p-6 shadow-lg shadow-violet-300/50 ring-1 ring-violet-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-violet-400/60 hover:ring-violet-400/70">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-300">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Próximas reservas</h2>
            </div>

            <div className="mt-4">
              {loadingBookings ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"></div>
                  <span>Cargando reservas...</span>
                </div>
              ) : (
                <BookingList bookings={sortedBookings} onCancel={handleCancelBooking} />
              )}
            </div>
          </section>
        </div>
      </div>

      <MapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        initialData={{
          lat: location?.lat ?? null,
          lon: location?.lon ?? null,
          name: location?.name ?? '',
          radius,
        }}
        onConfirm={(data) => {
          setLocation({ lat: data.lat, lon: data.lon, name: data.name })
          setRadius(data.radius)
        }}
      />

      <BookingModal
        sportsFacilityId={selectedFacility?.facilityId}
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </main>
  )
}

export default UserDashboard