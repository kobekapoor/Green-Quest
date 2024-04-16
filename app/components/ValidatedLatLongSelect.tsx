import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from '@chakra-ui/react'
import { useCallback, useEffect, useRef } from 'react'
import { useField } from 'remix-validated-form'

type ValidatedLatLongSelectProps = {
  center: string
  zoom: number
  height: number
  latName: string
  lngName: string
  label?: string
  helperText?: string
  isRequired?: boolean
}

export function ValidatedLatLongSelect({
  center,
  zoom,
  height,
  latName,
  lngName,
  label,
  helperText,
  isRequired,
}: ValidatedLatLongSelectProps) {
  const mapDivRef = useRef(null)
  const latInputRef = useRef<HTMLInputElement>(null)
  const lngInputRef = useRef<HTMLInputElement>(null)

  const {
    setTouched: latSetTouched,
    defaultValue: latDefaultValue,
    getInputProps: latGetInputProps,
    error: latError,
  } = useField(latName)
  const {
    setTouched: lngSetTouched,
    defaultValue: lngDefaultValue,
    getInputProps: lngGetInputProps,
    error: lngError,
  } = useField(lngName)

  const setTouched = useCallback(() => {
    latSetTouched(true)
    lngSetTouched(true)
  }, [latSetTouched, lngSetTouched])

  useEffect(() => {
    if (!mapDivRef.current) return

    const geocoder = new window.google.maps.Geocoder()

    const map = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: 0, lng: 0 },
      zoom,
    })

    let marker: google.maps.Marker | null = null

    if (latDefaultValue && lngDefaultValue) {
      marker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(latDefaultValue),
          lng: parseFloat(lngDefaultValue),
        },
        draggable: true,
        map,
      })

      map.setCenter(marker.getPosition()!)

      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        latInputRef.current!.value = e.latLng!.lat().toString()
        lngInputRef.current!.value = e.latLng!.lng().toString()
        setTouched()
      })
    }

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      latInputRef.current!.value = e.latLng!.lat().toString()
      lngInputRef.current!.value = e.latLng!.lng().toString()
      setTouched()

      if (!marker) {
        marker = new window.google.maps.Marker({
          position: e.latLng,
          draggable: true,
          map,
        })

        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          latInputRef.current!.value = e.latLng!.lat().toString()
          lngInputRef.current!.value = e.latLng!.lng().toString()
          setTouched()
        })
      } else {
        marker.setPosition(e.latLng)
      }
    })

    if (!marker) {
      //if no marker, then center the map on the address
      geocoder.geocode({ address: center }, (results, status) => {
        if (status !== 'OK' || !results) return

        map.setCenter(results[0].geometry.location)
      })
    }
  }, [mapDivRef, center, zoom, setTouched, latDefaultValue, lngDefaultValue])

  return (
    <>
      <FormControl isInvalid={!!latError || !!lngError} isRequired={isRequired}>
        {label && <FormLabel htmlFor={latName}>{label}</FormLabel>}
        <input
          {...latGetInputProps({
            id: latName,
          })}
          type="text"
          name={latName}
          ref={latInputRef}
          style={{ display: 'none' }} //hack to get around type="hidden" not working
        />
        <input
          {...lngGetInputProps({
            id: latName,
          })}
          type="text"
          name={lngName}
          ref={lngInputRef}
          style={{ display: 'none' }} //hack to get around type="hidden" not working
        />
        <div ref={mapDivRef} id="map" style={{ height }} />
        {latError && <FormErrorMessage>{latError}</FormErrorMessage>}
        {lngError && <FormErrorMessage>{lngError}</FormErrorMessage>}
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </>
  )
}
