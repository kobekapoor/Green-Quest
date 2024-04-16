import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react'
import type { NumberInputProps } from '@chakra-ui/react'
import { de } from 'date-fns/locale'
import { useControlField, useField } from 'remix-validated-form'

type ValidatedNumberInputProps = {
  name: string
  label?: string
  helperText?: string
  isRequired?: boolean
}

export const ValidatedNumberInput = ({
  name,
  label,
  helperText,
  isRequired,
  ...rest
}: ValidatedNumberInputProps & NumberInputProps) => {
  const { error, getInputProps, setTouched } = useField(name)
  const [value, setValue] = useControlField<string | number | undefined>(name)
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <NumberInput
        {...getInputProps({
          id: name,
          ...rest,
        })}
        value={value ?? ''} //this clears the input when the form is reset
        onChange={valueAsNumber => {
          setValue(valueAsNumber)
          setTouched(true)
        }}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
