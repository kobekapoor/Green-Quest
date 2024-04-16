import { FormErrorMessage, Input } from '@chakra-ui/react'
import type { InputProps } from '@chakra-ui/react'
import { useField } from 'remix-validated-form'

type ValidatedHidenInputProps = {
  name: string
}

export const ValidatedHiddenInput = ({
  name,
  ...rest
}: ValidatedHidenInputProps & InputProps) => {
  const { error, getInputProps, defaultValue, setTouched } = useField(name)
  return (
    <>
      <Input
        {...getInputProps({
          id: name,
          ...rest,
        })}
        type={'hidden'}
        defaultValue={defaultValue}
        onChange={e => {
          setTouched(true)
        }}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </>
  )
}
