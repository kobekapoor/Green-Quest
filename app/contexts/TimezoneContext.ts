import { formatInTimeZone } from "date-fns-tz";
import { createContext, useContext } from "react";

export const TimeZoneContext = createContext('')  

export function useTimeZoneContext() {
  return useContext(TimeZoneContext)
}

export function useFormatInUserTimeZone() {
  const timezone = useTimeZoneContext()
  return (date: Date, format: string) => {
    return formatInTimeZone(date, timezone, format)
  }
}