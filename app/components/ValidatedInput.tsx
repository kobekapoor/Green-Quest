import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from '@chakra-ui/react'
import type { InputProps } from '@chakra-ui/react'
import { useField } from 'remix-validated-form'

type ValidatedInputProps = {
  name: string
  label?: string
  helperText?: string
  isRequired?: boolean
}

export const ValidatedInput = ({
  name,
  label,
  helperText,
  type,
  isRequired,
  ...rest
}: ValidatedInputProps & InputProps) => {
  const { error, getInputProps, defaultValue, setTouched } = useField(name)
  let defaultValueString = undefined
  if(defaultValue)
  {
    if (type === 'date') {
      let date = new Date(defaultValue)
      defaultValueString = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date
        .getDate()
        .toString()
        .padStart(2, '0')}`
    } else if (type === 'datetime-local') {
      let date = new Date(defaultValue)
      defaultValueString = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date
        .getDate()
        .toString()
        .padStart(2, '0')}T${date
        .getHours()
        .toString()
        .padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
    }
  }
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <Input
        {...getInputProps({
          id: name,
          ...rest,
        })}
        type={type}
        borderColor="whiteAlpha.200"
        borderStyle="solid"
        borderWidth={1}
        defaultValue={ defaultValueString ?? defaultValue }
        onChange={e => {
          setTouched(true)
        }}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
