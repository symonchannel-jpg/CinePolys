"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icon (broken image in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface LocationMapProps {
  lat: number | null
  lng: number | null
  onPositionChange: (lat: number, lng: number) => void
  onAddressFound?: (address: string) => void
  interactive?: boolean
  zoom?: number
  className?: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

export function LocationMap({
  lat,
  lng,
  onPositionChange,
  onAddressFound,
  interactive = true,
  zoom = 13,
  className = "",
}: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultLat = lat || 19.4326
    const defaultLng = lng || -99.1332

    const map = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: interactive,
    }).addTo(map)

    if (lat && lng) marker.setLatLng([lat, lng])

    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      onPositionChange(pos.lat, pos.lng)
      if (onAddressFound) reverseGeocode(pos.lat, pos.lng)
    })

    if (interactive) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onPositionChange(e.latlng.lat, e.latlng.lng)
        if (onAddressFound) reverseGeocode(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map
    markerRef.current = marker

    // Fix map rendering after initialization
    const timer = setTimeout(() => {
      if (mapRef.current) {
        map.invalidateSize()
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Update marker position when lat/lng props change
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current?.setView([lat, lng], mapRef.current.getZoom())
    }
  }, [lat, lng])

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
        { headers: { "User-Agent": "CinePolys/1.0" } }
      )
      const data = await res.json()
      if (data?.display_name && onAddressFound) onAddressFound(data.display_name)
    } catch {}
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)

    if (value.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&accept-language=es`,
          { headers: { "User-Agent": "CinePolys/1.0" } }
        )
        const data = await res.json()
        setSearchResults(data)
        setShowResults(data.length > 0)
      } catch {}
      setSearching(false)
    }, 400)
  }

  function selectResult(result: SearchResult) {
    const newLat = parseFloat(result.lat)
    const newLng = parseFloat(result.lon)
    onPositionChange(newLat, newLng)
    if (onAddressFound) onAddressFound(result.display_name)
    setSearchQuery(result.display_name.split(",")[0])
    setShowResults(false)
    setSearchResults([])

    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng])
      mapRef.current.setView([newLat, newLng], 16)
    }
  }

  // Close results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="space-y-3 relative">
      {interactive && (
        <div ref={searchContainerRef} className="relative z-[1000]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Buscar dirección, ciudad, lugar..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all shadow-sm"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                Buscando...
              </span>
            )}
          </div>

          {showResults && (
            <div className="absolute top-full left-0 right-0 z-[1010] mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-fade-in max-h-48 overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="w-full px-3 py-2.5 text-left text-sm text-popover-foreground hover:bg-accent transition-colors border-b border-border last:border-0"
                >
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`rounded-xl overflow-hidden border border-border ${className}`}
        style={{ height: "280px", width: "100%" }}
      />
    </div>
  )
}
