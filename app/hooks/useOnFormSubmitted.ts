import { useEffect, useRef } from "react"
import { useIsSubmitting, useIsValid } from "remix-validated-form"

function useSubmitComplete(isSubmitting: boolean, callback: () => void) {
    const isPending = useRef(false)
    useEffect(() => {
      if (isSubmitting) {
        isPending.current = true
      }
  
      if (!isSubmitting && isPending.current) {
        isPending.current = false
        callback()
      }
    })
  }

export function useOnFormSubmitted(formId?:string, callback?: () => void) {
    const isSubmitting = useIsSubmitting(formId)
    const isValid = useIsValid(formId)
    useSubmitComplete(isSubmitting, () => {
    if (isValid) {
        callback?.()
    }
  })    
}