import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { LogOut, Settings, Calendar, CalendarClock, MapPin, Building2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import clubService from '../services/clubService'
import translateSport from '../utils/sportTranslations'
import LocationSelector from '../components/shared/LocationSelector'
import WeeklyScheduleEditor from '../components/schedule/WeeklyScheduleEditor'
import ExceptionsEditor from '../components/schedule/ExceptionsEditor'
import { groupByDay, validateWeekly } from '../utils/schedule'

delete L.Icon.Default.prototype._getIconUrl
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString()
const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString()
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString()
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl,
})


function getClubId(club) {
  return club?.id ?? club?.clubId ?? club?._id ?? club?.club_id ?? null
}

function getClubLatLng(club) {
  if (!club) return null

  const latRaw =
    club.latitude ??
    club.lat ??
    club.location?.latitude ??
    club.location?.lat

  const lngRaw =
    club.longitude ??
    club.lng ??
    club.lon ??
    club.location?.longitude ??
    club.location?.lng

  const lat = Number(latRaw)
  const lng = Number(lngRaw)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  return { lat, lng }
}

function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 shadow-lg shadow-blue-300/50 ring-1 ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/60 hover:ring-blue-400/70 ${className}`}>{children}</div>
}

function SectionTitle({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-300">
            <Icon className="h-4 w-4 text-white" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  )
}

function normalizeFacilitiesList(list) {
  const safe = Array.isArray(list) ? list : []
  return safe.map((f) => ({
    id: f.id ?? f.facilityId ?? f._id ?? f.sportsFacilityId ?? f.sportsFacility_id,
    name: f.name ?? f.facilityName ?? '',
    sportType: f.sportType ?? f.sport_type ?? f.type ?? '',
  }))
}

function normalizeSportsTypes(list) {
  const safe = Array.isArray(list) ? list : []
  return safe
    .map((s) => {
      if (typeof s === 'string') return { value: s, label: s }
      const value = s.sportType ?? s.value ?? s.id ?? s.type ?? s.name
      const label = s.sportType ?? s.label ?? s.name ?? String(value ?? '')
      if (!value && !label) return null
      return { value, label }
    })
    .filter(Boolean)
}

function normalizeBookings(list) {
  const safe = Array.isArray(list) ? list : []
  return safe.map((b) => ({
    sportsFacilityId: b.sportsFacilityId ?? b.facilityId ?? b.sports_facility_id ?? '',
    start: b.start ?? b.startTime ?? b.from ?? '',
    end: b.end ?? b.endTime ?? b.to ?? '',
  }))
}

function formatBookingDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatBookingTimeRange(start, end) {
  if (!start) return '-'
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return '-'
  
  const startTime = startDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  if (!end) return startTime
  const endDate = new Date(end)
  if (Number.isNaN(endDate.getTime())) return startTime
  
  const endTime = endDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  return `${startTime} - ${endTime}`
}

function getFacilityName(facilities, facilityId) {
  const facility = facilities.find(f => f.id === facilityId)
  return facility?.name || facilityId || '-'
}

function LocationClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return null
}


function Topbar({ onLogout, onOpenSettings }) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 shadow-xl shadow-indigo-300/40">
      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-white/15 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 right-1/3 h-32 w-32 translate-x-6 translate-y-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent blur-xl"></div>
        <div className="absolute left-1/4 bottom-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-gradient-to-br from-violet-400/15 to-transparent blur-xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-indigo-200" />
              <h1 className="text-2xl font-bold text-white md:text-3xl">Panel de club</h1>
            </div>
            <p className="mt-2 text-sm text-indigo-100 md:text-base">
              Gestiona tus instalaciones y reservas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="group flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 hover:shadow-lg border border-white/20"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </button>
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
    </div>
  )
}

function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-gradient-to-br from-blue-50/95 to-indigo-50/95 shadow-2xl shadow-indigo-300/50 ring-1 ring-indigo-300/60">
        <div className="flex items-center justify-between border-b border-indigo-200/50 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-300">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
            onClick={onClose}
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function ClubSettingsModal({
  mapLatLng,
  setMapLatLng,
  addressDraft,
  setAddressDraft,
  locationError,
  locationSaving,
  handleSaveLocation,
  clubHours,
  setClubHours,
  scheduleError,
  scheduleSaving,
  handleSaveSchedule,
  clubExceptions,
  clubExceptionsError,
  clubExceptionsLoading,
  handleAddClubException,
  handleDeleteClubException,
  facilities,
  facilitiesLoading,
  scheduleFacilityId,
  setScheduleFacilityId,
  facilityHours,
  setFacilityHours,
  facilityExceptions,
  facilityScheduleError,
  facilityScheduleLoading,
  facilityScheduleSaving,
  handleSaveFacilitySchedule,
  handleAddFacilityException,
  handleDeleteFacilityException,
}) {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle title="Ubicación" subtitle="Selecciona un punto en el mapa, actualiza la dirección y guarda." icon={MapPin} />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col items-center">
            <div className="w-[400px] h-[320px] overflow-hidden rounded-2xl border-2 border-indigo-200/60 bg-white shadow-lg shadow-indigo-300/30 relative">
              <LocationSelector
                isOpen={true}
                onClose={() => {}}
                initialData={{
                  lat: mapLatLng?.lat ?? null,
                  lon: mapLatLng?.lng ?? null,
                  name: addressDraft ?? '',
                }}
                onConfirm={(locationData) => {
                  setMapLatLng({ lat: locationData.lat, lng: locationData.lon })
                  setAddressDraft(locationData.name)
                }}
                compact={true}
                embedded={true}
              />
            </div>
          </div>

          <div>
            {locationError ? <div className="mb-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{locationError}</div> : null}
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 p-4 shadow-md shadow-indigo-300/30">
                <div className="text-xs font-medium text-slate-500">Coordenadas seleccionadas</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {mapLatLng ? `${mapLatLng.lat.toFixed(6)}, ${mapLatLng.lng.toFixed(6)}` : '-'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="address">
                  Dirección
                </label>
                <input
                  id="address"
                  className="mt-2 w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  placeholder="Ingresa la dirección"
                />
              </div>

              <button
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleSaveLocation}
                disabled={!mapLatLng || locationSaving || !addressDraft.trim()}
              >
                {locationSaving ? 'Guardando...' : 'Guardar ubicación'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle
          title="Horario semanal"
          subtitle="Un día sin intervalos queda cerrado."
          icon={Calendar}
        />

        {scheduleError ? <div className="mb-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{scheduleError}</div> : null}

        <div className="space-y-4">
          <WeeklyScheduleEditor
            value={clubHours}
            onChange={setClubHours}
            disabled={scheduleSaving}
          />

          <button
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleSaveSchedule}
            disabled={scheduleSaving}
          >
            {scheduleSaving ? 'Guardando...' : 'Guardar horario'}
          </button>
        </div>
      </div>

      <div>
        <SectionTitle
          title="Excepciones del club"
          subtitle="Fechas puntuales que sobrescriben el horario semanal."
          icon={CalendarClock}
        />

        {clubExceptionsError ? <div className="mb-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{clubExceptionsError}</div> : null}

        {clubExceptionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
            <span>Cargando excepciones...</span>
          </div>
        ) : (
          <ExceptionsEditor
            exceptions={clubExceptions}
            onAdd={handleAddClubException}
            onDelete={handleDeleteClubException}
          />
        )}
      </div>

      <div>
        <SectionTitle
          title="Horarios y Excepciones por instalación"
          subtitle="Si los horarios de una cancha no están declarados se usarán los del club. "
          icon={MapPin}
        />

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="scheduleFacility">
            Instalación
          </label>
          <select
            id="scheduleFacility"
            className="w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            value={scheduleFacilityId}
            onChange={(e) => setScheduleFacilityId(e.target.value)}
            disabled={facilitiesLoading}
          >
            <option value="">Selecciona una instalación</option>
            {facilities.map((f) => (
              <option key={String(f.id)} value={f.id}>
                {f.name} ({translateSport(f.sportType)})
              </option>
            ))}
          </select>
        </div>

        {facilityScheduleError ? <div className="mb-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{facilityScheduleError}</div> : null}

        {!scheduleFacilityId ? (
          <div className="text-sm text-slate-600">
            Selecciona una instalación para configurar su horario.
          </div>
        ) : facilityScheduleLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
            <span>Cargando horario de la instalación...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <WeeklyScheduleEditor
                value={facilityHours}
                onChange={setFacilityHours}
                disabled={facilityScheduleSaving}
              />

              <button
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleSaveFacilitySchedule}
                disabled={facilityScheduleSaving}
              >
                {facilityScheduleSaving ? 'Guardando...' : 'Guardar horario de la instalación'}
              </button>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Excepciones de la instalación
              </div>
              <ExceptionsEditor
                exceptions={facilityExceptions}
                onAdd={handleAddFacilityException}
                onDelete={handleDeleteFacilityException}
                allowBlocked
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClubDashboard({ onLogout }) {
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState('')
  const [selectedDateFilter, setSelectedDateFilter] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleOpenSettings = () => setSettingsOpen(true)
  const handleCloseSettings = () => setSettingsOpen(false)

  const [club, setClub] = useState(null)
  const [clubLoading, setClubLoading] = useState(true)
  const [clubError, setClubError] = useState('')

  const clubId = useMemo(() => getClubId(club), [club])

  // Facilities
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [facilities, setFacilities] = useState([])
  const [sportsTypesLoading, setSportsTypesLoading] = useState(false)
  const [sportsTypes, setSportsTypes] = useState([])
  const [facilityCreateLoading, setFacilityCreateLoading] = useState(false)
  const [facilityCreateSportType, setFacilityCreateSportType] = useState('')

  // Club weekly schedule + exceptions for modal
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [clubHours, setClubHours] = useState([])
  const [clubExceptions, setClubExceptions] = useState([])
  const [clubExceptionsLoading, setClubExceptionsLoading] = useState(false)
  const [clubExceptionsError, setClubExceptionsError] = useState('')

  // Per-facility schedule + exceptions for modal
  const [scheduleFacilityId, setScheduleFacilityId] = useState('')
  const [facilityHours, setFacilityHours] = useState([])
  const [facilityExceptions, setFacilityExceptions] = useState([])
  const [facilityScheduleLoading, setFacilityScheduleLoading] = useState(false)
  const [facilityScheduleSaving, setFacilityScheduleSaving] = useState(false)
  const [facilityScheduleError, setFacilityScheduleError] = useState('')

  // Location for modal
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [mapLatLng, setMapLatLng] = useState(null)
  const [addressDraft, setAddressDraft] = useState('')

  // Bookings
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookings, setBookings] = useState([])

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
  let filtered = bookings

  if (selectedFacilityFilter) {
    filtered = filtered.filter(
      booking => String(booking.sportsFacilityId) === String(selectedFacilityFilter)
    )
  }

  if (selectedDateFilter) {
    filtered = filtered.filter(booking => {

      const bookingDate = new Date(booking.start)

      if (Number.isNaN(bookingDate.getTime())) {
        return false
      }

      const bookingKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`

      return bookingKey === selectedDateFilter
    })
  }

  return [...filtered].sort((a, b) => new Date(a.start) - new Date(b.start))
}, [bookings, selectedFacilityFilter, selectedDateFilter])

  const fetchClub = useCallback(async () => {
    setClubLoading(true)
    setClubError('')
    try {
      const data = await clubService.getClub()
      setClub(data)

      // Initialize location state
      const latLng = getClubLatLng(data)
      setMapLatLng(latLng)
      setAddressDraft(data?.address ?? data?.location?.address ?? '')
      
      // Initialize weekly schedule state
      setClubHours(Array.isArray(data?.openingHours) ? data.openingHours : [])
    } catch (e) {
      setClubError(e?.response?.data?.message || 'Failed to load club')
    } finally {
      setClubLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClub()
  }, [fetchClub])

  const refreshFacilities = useCallback(async () => {
    if (!clubId) return
    setFacilitiesLoading(true)
    try {
      const list = await clubService.getClubFacilities(clubId)
      setFacilities(normalizeFacilitiesList(list))
    } catch {
      setFacilities([])
    } finally {
      setFacilitiesLoading(false)
    }
  }, [clubId])

  const refreshSportsTypes = useCallback(async () => {
    setSportsTypesLoading(true)
    try {
      const list = await clubService.getSportsTypes()
      setSportsTypes(normalizeSportsTypes(list))
    } catch {
      setSportsTypes([])
    } finally {
      setSportsTypesLoading(false)
    }
  }, [])

  const refreshBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const list = await clubService.getClubBookings()
      setBookings(normalizeBookings(list))
    } catch {
      setBookings([])
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  const refreshClubExceptions = useCallback(async () => {
    setClubExceptionsLoading(true)
    setClubExceptionsError('')
    try {
      const list = await clubService.getClubExceptions()
      setClubExceptions(list)
    } catch (e) {
      setClubExceptions([])
      setClubExceptionsError(e?.response?.data?.message || 'No se pudieron cargar las excepciones.')
    } finally {
      setClubExceptionsLoading(false)
    }
  }, [])

  const loadFacilitySchedule = useCallback(async (facilityId) => {
    if (!facilityId) {
      setFacilityHours([])
      setFacilityExceptions([])
      return
    }
    setFacilityScheduleLoading(true)
    setFacilityScheduleError('')
    try {
      const [facility, exceptions] = await Promise.all([
        clubService.getFacility(facilityId),
        clubService.getFacilityExceptions(facilityId),
      ])
      setFacilityHours(Array.isArray(facility?.openingHours) ? facility.openingHours : [])
      setFacilityExceptions(exceptions)
    } catch (e) {
      setFacilityHours([])
      setFacilityExceptions([])
      setFacilityScheduleError(e?.response?.data?.message || 'No se pudo cargar el horario de la instalación.')
    } finally {
      setFacilityScheduleLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!clubId) return
    refreshFacilities()
    refreshSportsTypes()
    refreshBookings()
    refreshClubExceptions()
  }, [clubId, refreshFacilities, refreshSportsTypes, refreshBookings, refreshClubExceptions])

  useEffect(() => {
    loadFacilitySchedule(scheduleFacilityId)
  }, [scheduleFacilityId, loadFacilitySchedule])

  const handleCreateFacility = async () => {
    if (!facilityCreateSportType) return
    setFacilityCreateLoading(true)
    try {
      await clubService.createFacility({ sportType: facilityCreateSportType })
      setFacilityCreateSportType('')
      await refreshFacilities()
    } catch (e) {
      // keep UI simple; show nothing beyond console
      console.error(e)
    } finally {
      setFacilityCreateLoading(false)
    }
  }

  const handleDeleteFacility = async (facilityId) => {
    setFacilitiesLoading(true)
    try {
      await clubService.deleteFacility(facilityId)
      if (String(facilityId) === String(scheduleFacilityId)) {
        setScheduleFacilityId('')
      }
      await refreshFacilities()
    } catch (e) {
      console.error(e)
    } finally {
      setFacilitiesLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    setScheduleError('')

    const validationError = validateWeekly(groupByDay(clubHours))
    if (validationError) {
      setScheduleError(validationError)
      return
    }

    setScheduleSaving(true)
    try {
      await clubService.updateSchedule({ openingHours: clubHours })
      await fetchClub()
    } catch (e) {
      setScheduleError(e?.response?.data?.message || 'No se pudo guardar el horario.')
    } finally {
      setScheduleSaving(false)
    }
  }

  // ExceptionsEditor surfaces the error itself, so let failures propagate.
  const handleAddClubException = async (payload) => {
    setClubExceptionsError('')
    await clubService.addClubException(payload)
    await refreshClubExceptions()
  }

  const handleDeleteClubException = async (exceptionId) => {
    setClubExceptionsError('')
    try {
      await clubService.deleteClubException(exceptionId)
      await refreshClubExceptions()
    } catch (e) {
      setClubExceptionsError(e?.response?.data?.message || 'No se pudo eliminar la excepción.')
    }
  }

  const handleSaveFacilitySchedule = async () => {
    if (!scheduleFacilityId) return
    setFacilityScheduleError('')

    const validationError = validateWeekly(groupByDay(facilityHours))
    if (validationError) {
      setFacilityScheduleError(validationError)
      return
    }

    setFacilityScheduleSaving(true)
    try {
      await clubService.updateFacilitySchedule(scheduleFacilityId, { openingHours: facilityHours })
      await loadFacilitySchedule(scheduleFacilityId)
    } catch (e) {
      setFacilityScheduleError(e?.response?.data?.message || 'No se pudo guardar el horario de la instalación.')
    } finally {
      setFacilityScheduleSaving(false)
    }
  }

  const handleAddFacilityException = async (payload) => {
    if (!scheduleFacilityId) return
    setFacilityScheduleError('')
    await clubService.addFacilityException(scheduleFacilityId, payload)
    await loadFacilitySchedule(scheduleFacilityId)
  }

  const handleDeleteFacilityException = async (exceptionId) => {
    if (!scheduleFacilityId) return
    setFacilityScheduleError('')
    try {
      await clubService.deleteFacilityException(scheduleFacilityId, exceptionId)
      await loadFacilitySchedule(scheduleFacilityId)
    } catch (e) {
      setFacilityScheduleError(e?.response?.data?.message || 'No se pudo eliminar la excepción.')
    }
  }

  const handleSaveLocation = async () => {
    if (!mapLatLng) return
    if (!addressDraft.trim()) return
    setLocationSaving(true)
    setLocationError('')
    try {
      await clubService.updateClubLocation({
        latitude: mapLatLng.lat,
        longitude: mapLatLng.lng,
        address: addressDraft,
      })
      await fetchClub()
    } catch (e) {
      setLocationError(e?.response?.data?.message || 'Failed to save location')
    } finally {
      setLocationSaving(false)
    }
  }

  if (clubLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 px-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
          <span>Cargando club...</span>
        </div>
      </div>
    )
  }

  if (clubError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 px-4">
        <Card className="bg-gradient-to-br from-red-50/80 to-red-100/50 shadow-red-300/50 ring-red-300/60">
          <div className="text-sm text-red-700">{clubError}</div>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-400/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-400/25 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/25 to-indigo-400/25 blur-3xl"></div>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <Topbar onLogout={onLogout} onOpenSettings={handleOpenSettings} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 shadow-blue-300/50 ring-blue-300/60 hover:shadow-blue-400/60 hover:ring-blue-400/70">
              <SectionTitle title="Reservas" subtitle="Ver y filtrar las reservas de tu club." icon={Calendar} />
              
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Instalación</label>
                  <select
                    className="mt-2 w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    value={selectedFacilityFilter}
                    onChange={(e) => setSelectedFacilityFilter(e.target.value)}
                    disabled={facilitiesLoading}
                  >
                    <option value="">Todas las instalaciones</option>
                    {facilities.map((f) => (
                      <option key={String(f.id)} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Fecha</label>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                  />
                </div>
              </div>

              {bookingsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                  <span>Cargando reservas...</span>
                </div>
              ) : filteredBookings.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-slate-500">
                        <th className="border-b border-indigo-200/60 pb-3 pr-3">Instalación</th>
                        <th className="border-b border-indigo-200/60 pb-3 pr-3">Fecha</th>
                        <th className="border-b border-indigo-200/60 pb-3 pr-3">Horario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b, idx) => (
                        <tr key={`${String(b.sportsFacilityId)}-${idx}`} className="align-top">
                          <td className="border-b border-indigo-100/50 py-3 pr-3 font-medium text-slate-900">
                            {getFacilityName(facilities, b.sportsFacilityId)}
                          </td>
                          <td className="border-b border-indigo-100/50 py-3 pr-3">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-200/60 to-blue-200/60 px-2.5 py-1.5">
                              <span className="text-sm font-semibold text-indigo-900">{formatBookingDate(b.start)}</span>
                            </div>
                          </td>
                          <td className="border-b border-indigo-100/50 py-3 pr-3">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-200/60 to-purple-200/60 px-2.5 py-1.5">
                              <span className="text-sm font-semibold text-violet-900">{formatBookingTimeRange(b.start, b.end)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-slate-600">
                  {selectedFacilityFilter || selectedDateFilter 
                    ? 'No hay reservas que coincidan con los filtros seleccionados.' 
                    : 'No se encontraron reservas.'}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-violet-50/80 to-purple-50/80 shadow-violet-300/50 ring-violet-300/60 hover:shadow-violet-400/60 hover:ring-violet-400/70">
              <SectionTitle title="Instalaciones" subtitle="" icon={MapPin} />

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700">Crear instalación</label>
                <div className="mt-2 space-y-3">
                  <select
                    className="w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                    value={facilityCreateSportType}
                    onChange={(e) => setFacilityCreateSportType(e.target.value)}
                    disabled={sportsTypesLoading || facilityCreateLoading}
                  >
                    <option value="">
                      {sportsTypesLoading ? 'Cargando deportes...' : 'Selecciona un tipo de deporte'}
                    </option>
                    {sportsTypes.map((s) => (
                      <option key={String(s.value)} value={s.value}>
                        {translateSport(s.label)}
                      </option>
                    ))}
                  </select>

                  <button
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleCreateFacility}
                    type="button"
                    disabled={!facilityCreateSportType || facilityCreateLoading}
                  >
                    {facilityCreateLoading ? 'Creando...' : 'Agregar instalación'}
                  </button>
                </div>
              </div>

              {facilitiesLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"></div>
                  <span>Cargando instalaciones...</span>
                </div>
              ) : facilities.length ? (
                <div className="space-y-3">
                  {facilities.map((f) => (
                    <div key={String(f.id)} className="rounded-xl border-2 border-violet-200/60 bg-gradient-to-br from-white to-violet-50/30 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-violet-300/80">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {f.name || '-'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {translateSport(f.sportType) || '-'}
                          </div>
                        </div>
                        <button
                          className="ml-2 rounded-xl border-2 border-red-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-all duration-200 hover:bg-red-50 hover:border-red-300/80 disabled:cursor-not-allowed disabled:flex-shrink-0 disabled:opacity-60"
                          onClick={() => handleDeleteFacility(f.id)}
                          type="button"
                          disabled={!f.id || facilitiesLoading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-600">No se encontraron instalaciones.</div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={settingsOpen}
        onClose={handleCloseSettings}
        title="Configuración del club"
      >
        <ClubSettingsModal
          mapLatLng={mapLatLng}
          setMapLatLng={setMapLatLng}
          addressDraft={addressDraft}
          setAddressDraft={setAddressDraft}
          locationError={locationError}
          locationSaving={locationSaving}
          handleSaveLocation={handleSaveLocation}
          clubHours={clubHours}
          setClubHours={setClubHours}
          scheduleError={scheduleError}
          scheduleSaving={scheduleSaving}
          handleSaveSchedule={handleSaveSchedule}
          clubExceptions={clubExceptions}
          clubExceptionsError={clubExceptionsError}
          clubExceptionsLoading={clubExceptionsLoading}
          handleAddClubException={handleAddClubException}
          handleDeleteClubException={handleDeleteClubException}
          facilities={facilities}
          facilitiesLoading={facilitiesLoading}
          scheduleFacilityId={scheduleFacilityId}
          setScheduleFacilityId={setScheduleFacilityId}
          facilityHours={facilityHours}
          setFacilityHours={setFacilityHours}
          facilityExceptions={facilityExceptions}
          facilityScheduleError={facilityScheduleError}
          facilityScheduleLoading={facilityScheduleLoading}
          facilityScheduleSaving={facilityScheduleSaving}
          handleSaveFacilitySchedule={handleSaveFacilitySchedule}
          handleAddFacilityException={handleAddFacilityException}
          handleDeleteFacilityException={handleDeleteFacilityException}
        />
      </Modal>
    </main>
  )
}

