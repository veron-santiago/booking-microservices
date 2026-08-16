import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function getMapboxToken() {
  return import.meta.env.VITE_MAPBOX_TOKEN || null
}

function LocationClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return null
}

function MapController({ recenterTarget }) {
  const map = useMap()

  useEffect(() => {
    if (!recenterTarget) return
    map.setView([recenterTarget.lat, recenterTarget.lon], map.getZoom(), { animate: true })
  }, [map, recenterTarget])

  return null
}

function LocationSelector({ 
  isOpen, 
  onClose, 
  initialData, 
  onConfirm,
  showRadius = false,
  compact = false,
  embedded = false 
}) {
  const [addressQuery, setAddressQuery] = useState(initialData?.name || '')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [radius, setRadius] = useState(initialData?.radius ?? 5)
  const [geoMessage, setGeoMessage] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [recenterTarget, setRecenterTarget] = useState(null)
  const [picked, setPicked] = useState(() => {
    if (initialData?.lat != null && initialData?.lon != null) return { lat: initialData.lat, lng: initialData.lon }
    return null
  })

  const debounceTimerRef = useRef(null)
  const mapCleanupRef = useRef(null)
  const idleCursorTimerRef = useRef(null)
  const reverseRequestIdRef = useRef(0)
  const hasMapboxToken = useMemo(() => Boolean(getMapboxToken()), [])

  useEffect(() => {
    if (!isOpen) return
    setRadius(initialData?.radius ?? 5)
    setGeoMessage('')
    setSuggestions([])
    setRecenterTarget(null)
    const name = initialData?.name || ''
    setAddressQuery(name)
    if (initialData?.lat != null && initialData?.lon != null) {
      setPicked({ lat: initialData.lat, lng: initialData.lon })
    } else {
      setPicked(null)
    }
  }, [initialData, isOpen])

  useEffect(() => {
    // Leaflet marker icons: Vite bundling requires explicit URLs.
    delete L.Icon.Default.prototype._getIconUrl
    const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString()
    const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString()
    const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString()

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl,
    })
  }, [])

  useEffect(() => {
    return () => {
      if (mapCleanupRef.current) mapCleanupRef.current()
      if (idleCursorTimerRef.current) window.clearTimeout(idleCursorTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isOpen) return
    if (mapCleanupRef.current) {
      mapCleanupRef.current()
      mapCleanupRef.current = null
    }
    if (idleCursorTimerRef.current) {
      window.clearTimeout(idleCursorTimerRef.current)
      idleCursorTimerRef.current = null
    }
  }, [isOpen])

  const fetchForwardLocations = useCallback(
    async (q, controller) => {
      const token = getMapboxToken()
      if (!token) return []

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q,
      )}.json?access_token=${encodeURIComponent(token)}&autocomplete=true&country=ar&limit=5`

      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return []
      const data = await res.json()
      const features = Array.isArray(data?.features) ? data.features : []
      return features
        .map((f) => {
          const name = f?.place_name
          const center = f?.center
          const lon = Array.isArray(center) ? center[0] : null
          const lat = Array.isArray(center) ? center[1] : null
          if (typeof name !== 'string' || typeof lat !== 'number' || typeof lon !== 'number') return null
          return { name, lat, lon }
        })
        .filter(Boolean)
    },
    [],
  )

  const reverseGeocodeMapbox = useCallback(async (lat, lon, controller) => {
    const token = getMapboxToken()
    if (!token) return null

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      lon,
    )},${encodeURIComponent(lat)}.json?access_token=${encodeURIComponent(token)}&limit=1`

    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const data = await res.json()
    const feature = Array.isArray(data?.features) ? data.features[0] : null
    const name = feature?.place_name
    return typeof name === 'string' ? name : null
  }, [])

  const reverseGeocodeFallback = useCallback(async (lat, lon, controller) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat,
    )}&lon=${encodeURIComponent(lon)}&zoom=18`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const name = data?.display_name
    return typeof name === 'string' ? name : null
  }, [])

  const resolveAddress = useCallback(async (lat, lon) => {
    const requestId = ++reverseRequestIdRef.current
    const controller = new AbortController()

    try {
      let address = null
      if (hasMapboxToken) {
        address = await reverseGeocodeMapbox(lat, lon, controller)
      }
      if (!address) {
        address = await reverseGeocodeFallback(lat, lon, controller)
      }

      if (requestId !== reverseRequestIdRef.current) return null
      return address
    } catch {
      if (requestId !== reverseRequestIdRef.current) return null
      return null
    }
  }, [hasMapboxToken, reverseGeocodeFallback, reverseGeocodeMapbox])

  const applyPickedLocation = useCallback(
    async (lat, lon) => {
      setPicked({ lat, lng: lon })

      const address = await resolveAddress(lat, lon)
      const finalAddress = address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`
      setAddressQuery(finalAddress)

      if (embedded && onConfirm) {
        const result = {
          lat,
          lon,
          name: finalAddress,
        }
        if (showRadius) {
          result.radius = radius
        }
        onConfirm(result)
      }
    },
    [resolveAddress, embedded, onConfirm, showRadius, radius],
  )

  useEffect(() => {
    const q = String(addressQuery || '').trim()
    if (!isOpen) return

    if (!hasMapboxToken || q.length < 3) {
      setSuggestions([])
      return
    }

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current)

    const controller = new AbortController()
    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        setSuggestionsLoading(true)
        const list = await fetchForwardLocations(q, controller)
        setSuggestions(list)
      } finally {
        setSuggestionsLoading(false)
      }
    }, 600)

    return () => controller.abort()
  }, [addressQuery, fetchForwardLocations, hasMapboxToken, isOpen])

  const initialCenter = useMemo(() => {
    if (initialData?.lat != null && initialData?.lon != null) return [initialData.lat, initialData.lon]
    return [-34.6, -58.4]
  }, [initialData])

  if (!isOpen) return null

  const mapHeight = compact ? 'h-80' : 'h-[420px]'

  if (embedded) {
    return (
      <div className={`relative ${mapHeight} w-full overflow-hidden`}>
        <style>{`
          .leaflet-container {
            cursor: grab;
          }
          .leaflet-container:active {
            cursor: grabbing;
          }
          .leaflet-container.idle {
            cursor: pointer;
          }
        `}</style>

        <button
          type="button"
          className="absolute left-12 top-3 z-[500] inline-flex items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (!navigator.geolocation) {
              setGeoMessage('Geolocalización no disponible en este navegador.')
              return
            }

            setIsLocating(true)
            setGeoMessage('')
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                setRecenterTarget({ lat, lon, at: Date.now() })
                await applyPickedLocation(lat, lon)
                setIsLocating(false)
              },
              (error) => {
                if (error?.code === error.PERMISSION_DENIED) {
                  setGeoMessage('Permiso de ubicación denegado.')
                } else if (error?.code === error.TIMEOUT) {
                  setGeoMessage('No se pudo obtener tu ubicación a tiempo.')
                } else {
                  setGeoMessage('No se pudo obtener la ubicación actual.')
                }
                setIsLocating(false)
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              },
            )
          }}
          disabled={isLocating}
        >
          <span aria-hidden="true">📍</span>
          {isLocating ? 'Ubicando...' : 'Ubicación actual'}
        </button>

        <MapContainer
          center={initialCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
          whenCreated={(map) => {
            const container = map.getContainer()

            const setIdleTimer = () => {
              container.classList.remove('idle')
              if (idleCursorTimerRef.current) window.clearTimeout(idleCursorTimerRef.current)
              idleCursorTimerRef.current = window.setTimeout(() => {
                container.classList.add('idle')
              }, 2000)
            }

            const onMove = () => setIdleTimer()
            const onDown = () => container.classList.remove('idle')
            const onUp = () => setIdleTimer()

            container.addEventListener('mousemove', onMove)
            container.addEventListener('mousedown', onDown)
            container.addEventListener('mouseup', onUp)
            container.addEventListener('touchstart', onDown)
            container.addEventListener('touchend', onUp)
            setIdleTimer()

            mapCleanupRef.current = () => {
              container.removeEventListener('mousemove', onMove)
              container.removeEventListener('mousedown', onDown)
              container.removeEventListener('mouseup', onUp)
              container.removeEventListener('touchstart', onDown)
              container.removeEventListener('touchend', onUp)
            }
          }}
        >
          <MapController recenterTarget={recenterTarget} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationClickHandler
            onPick={(pos) => {
              setSuggestions([])
              applyPickedLocation(pos.lat, pos.lng)
            }}
          />

          {picked?.lat != null && picked?.lng != null ? (
            <>
              <Marker position={[picked.lat, picked.lng]} />
              {showRadius && <Circle center={[picked.lat, picked.lng]} radius={radius * 1000} pathOptions={{ color: '#2563eb' }} />}
            </>
          ) : null}
        </MapContainer>

        {geoMessage ? <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-600 bg-white bg-opacity-90 p-2 rounded">{geoMessage}</div> : null}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${compact ? 'max-w-2xl' : 'max-w-4xl'} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Seleccionar ubicación</div>
            <div className="text-xs text-slate-500">Busca una dirección o haz clic en el mapa</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className={`grid gap-3 ${showRadius ? 'md:grid-cols-2' : 'md:grid-cols-1'} md:items-end`}>
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Buscar dirección"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
              />

              {hasMapboxToken && suggestions.length ? (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {suggestionsLoading ? (
                    <div className="px-4 py-3 text-sm text-slate-600">Buscando...</div>
                  ) : (
                    suggestions.map((s, idx) => (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        className="block w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                          setPicked({ lat: s.lat, lng: s.lon })
                          setAddressQuery(s.name)
                          setSuggestions([])

                          if (embedded && onConfirm) {
                            const result = {
                              lat: s.lat,
                              lon: s.lon,
                              name: s.name,
                            }
                            if (showRadius) {
                              result.radius = radius
                            }
                            onConfirm(result)
                          }
                        }}
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              {!hasMapboxToken ? (
                <div className="mt-2 text-xs text-slate-500">Puedes seleccionar la ubicación desde el mapa.</div>
              ) : null}
            </div>

            {showRadius && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="radius">
                  Radio: {radius} km
                </label>
                <input
                  id="radius"
                  type="range"
                  min={1}
                  max={10}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className={`relative ${mapHeight} w-full overflow-hidden`}>
          <style>{`
            .leaflet-container {
              cursor: grab;
            }
            .leaflet-container:active {
              cursor: grabbing;
            }
            .leaflet-container.idle {
              cursor: pointer;
            }
          `}</style>

          <button
            type="button"
            className="absolute left-3 top-3 z-[500] inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              if (!navigator.geolocation) {
                setGeoMessage('Geolocalización no disponible en este navegador.')
                return
              }

              setIsLocating(true)
              setGeoMessage('')
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const lat = position.coords.latitude
                  const lon = position.coords.longitude
                  setRecenterTarget({ lat, lon, at: Date.now() })
                  await applyPickedLocation(lat, lon)
                  setIsLocating(false)
                },
                (error) => {
                  if (error?.code === error.PERMISSION_DENIED) {
                    setGeoMessage('Permiso de ubicación denegado.')
                  } else if (error?.code === error.TIMEOUT) {
                    setGeoMessage('No se pudo obtener tu ubicación a tiempo.')
                  } else {
                    setGeoMessage('No se pudo obtener la ubicación actual.')
                  }
                  setIsLocating(false)
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0,
                },
              )
            }}
            disabled={isLocating}
          >
            <span aria-hidden="true">📍</span>
            {isLocating ? 'Ubicando...' : 'Ubicación actual'}
          </button>

          <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            whenCreated={(map) => {
              const container = map.getContainer()

              const setIdleTimer = () => {
                container.classList.remove('idle')
                if (idleCursorTimerRef.current) window.clearTimeout(idleCursorTimerRef.current)
                idleCursorTimerRef.current = window.setTimeout(() => {
                  container.classList.add('idle')
                }, 2000)
              }

              const onMove = () => setIdleTimer()
              const onDown = () => container.classList.remove('idle')
              const onUp = () => setIdleTimer()

              container.addEventListener('mousemove', onMove)
              container.addEventListener('mousedown', onDown)
              container.addEventListener('mouseup', onUp)
              container.addEventListener('touchstart', onDown)
              container.addEventListener('touchend', onUp)
              setIdleTimer()

              mapCleanupRef.current = () => {
                container.removeEventListener('mousemove', onMove)
                container.removeEventListener('mousedown', onDown)
                container.removeEventListener('mouseup', onUp)
                container.removeEventListener('touchstart', onDown)
                container.removeEventListener('touchend', onUp)
              }
            }}
          >
            <MapController recenterTarget={recenterTarget} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationClickHandler
              onPick={(pos) => {
                setSuggestions([])
                applyPickedLocation(pos.lat, pos.lng)
              }}
            />

            {picked?.lat != null && picked?.lng != null ? (
              <>
                <Marker position={[picked.lat, picked.lng]} />
                {showRadius && <Circle center={[picked.lat, picked.lng]} radius={radius * 1000} pathOptions={{ color: '#2563eb' }} />}
              </>
            ) : null}
          </MapContainer>
        </div>

        {geoMessage ? <div className="px-5 pt-3 text-xs text-slate-600">{geoMessage}</div> : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={picked?.lat == null || picked?.lng == null}
            onClick={() => {
              if (picked?.lat == null || picked?.lng == null) return
              const name = String(addressQuery || '').trim() || `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`
              const result = {
                lat: picked.lat,
                lon: picked.lng,
                name,
              }
              if (showRadius) {
                result.radius = radius
              }
              onConfirm(result)
              onClose()
            }}
          >
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationSelector
