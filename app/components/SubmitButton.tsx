import { Button } from '@chakra-ui/react'
import { useBeforeUnload } from '@remix-run/react'
import { useCallback } from 'react'
import { useFormContext, useIsSubmitting } from 'remix-validated-form'

type SubmitButtonProps = {
  alwaysShow?: boolean
  textOverride?: string
}

export const SubmitButton = ({ alwaysShow = false, textOverride }: SubmitButtonProps) => {
  const isSubmitting = useIsSubmitting()
  const { touchedFields } = useFormContext()
  useBeforeUnload(
    useCallback(
      e => {
        if (Object.keys(touchedFields).length > 0) {
          e.preventDefault()
          e.returnValue = true
        }
      },
      [touchedFields]
    )
  )
  return (
    <Button
      type="submit"
      isLoading={isSubmitting}
      bg={'blue.400'}
      color={'white'}
      _hover={{
        bg: 'blue.500',
      }}
      display={
        alwaysShow || Object.keys(touchedFields).length > 0 ? 'block' : 'none'
      }
    >
      {textOverride ? textOverride : (isSubmitting ? 'Saving...' : 'Save')}
    </Button>
  )
}
