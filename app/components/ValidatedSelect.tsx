import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Select,
} from '@chakra-ui/react'
import type { SelectProps } from '@chakra-ui/react'
import { useControlField, useField } from 'remix-validated-form'

type ValidatedSelectProps = {
  name: string
  label?: string
  helperText?: string
  isRequired?: boolean
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export const ValidatedSelect = ({
  name,
  label,
  helperText,
  isRequired,
  onChange,
  ...rest
}: ValidatedSelectProps & SelectProps) => {
  const { error, getInputProps, setTouched } = useField(name)
  const [value, setValue] = useControlField<
    string | number | readonly string[] | undefined
  >(name)
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <Select
        {...getInputProps({
          id: name,
          value,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            setValue(e.target.value)
            setTouched(true)
            onChange?.(e)
          },
          ...rest,
        })}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
