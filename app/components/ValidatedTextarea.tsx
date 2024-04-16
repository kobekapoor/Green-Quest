import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Textarea,
} from '@chakra-ui/react'
import type { TextareaProps } from '@chakra-ui/react'
import { useField } from 'remix-validated-form'

type ValidatedTextareaProps = {
  name: string
  label?: string
  helperText?: string
  isRequired?: boolean
}

export const ValidatedTextarea = ({
  name,
  label,
  helperText,
  isRequired,
  ...rest
}: ValidatedTextareaProps & TextareaProps) => {
  const { error, getInputProps, defaultValue, setTouched } = useField(name)
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <Textarea
        {...getInputProps({
          id: name,
          ...rest,
        })}
        defaultValue={defaultValue}
        borderColor="whiteAlpha.200"
        borderStyle="solid"
        borderWidth={1}
        onChange={e => {
          setTouched(true)
        }}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
