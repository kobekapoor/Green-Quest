import { useEffect, useRef } from 'react'

type MapProps = {
  center: {
    lat: number
    lng: number
  }
  zoom: number
  markers: {
    name: string
    position: {
      lat: number
      lng: number
    }
  }[]
  fitToMarkers?: boolean
  tilt?: number
  mapTypeId?: string
  height: number
}

export function Map({
  center,
  zoom,
  markers,
  fitToMarkers,
  tilt,
  mapTypeId,
  height,
}: MapProps) {
  const mapDivRef = useRef(null)

  useEffect(() => {
    if (!mapDivRef.current) return

    // const geocoder = new window.google.maps.Geocoder()

    const map = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom,
      mapTypeId,
    })

    if (tilt) map.setTilt(tilt)

    const gMarkers = markers.map(
      marker =>
        new window.google.maps.Marker({
          position: marker.position,
          map,
          title: marker.name,
          icon: `https://chart.apis.google.com/chart?chst=d_bubble_text_small_withshadow&chld=bbT|${marker.name}|AA0055|FFFFFF`,
        })
    )

    if (fitToMarkers) {
      const bounds = new window.google.maps.LatLngBounds()
      gMarkers.forEach(marker => bounds.extend(marker.getPosition()!))

      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        const currentZoom = map.getZoom()
        if (!currentZoom || currentZoom > 19) map.setZoom(19)
        if (tilt) map.setTilt(tilt)
      })

      map.fitBounds(bounds)
    }

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      // latInputRef.current!.value = e.latLng!.lat().toString()
      // lngInputRef.current!.value = e.latLng!.lng().toString()
      // setTouched()
      // if (!marker) {
      //   marker = new window.google.maps.Marker({
      //     position: e.latLng,
      //     draggable: true,
      //     map,
      //   })
      //   marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      //     latInputRef.current!.value = e.latLng!.lat().toString()
      //     lngInputRef.current!.value = e.latLng!.lng().toString()
      //     setTouched()
      //   })
      // } else {
      //   marker.setPosition(e.latLng)
      // }
    })

    // if (!marker) {
    //   //if no marker, then center the map on the address
    //   geocoder.geocode({ address: center }, (results, status) => {
    //     if (status !== 'OK' || !results) return

    //     map.setCenter(results[0].geometry.location)
    //   })
    // }
  }, [mapDivRef, center, zoom, mapTypeId, tilt, markers, fitToMarkers])

  return (
    <>
      <div ref={mapDivRef} id="map" style={{ height }} />
    </>
  )
}
