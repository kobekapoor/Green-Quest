import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Switch,
} from '@chakra-ui/react'
import type { SwitchProps } from '@chakra-ui/react'
import { useField } from 'remix-validated-form'

type ValidatedSwitchProps = {
  name: string
  label?: string
  description?: string
  helperText?: string
  fallbackDefault?: boolean
}

export const ValidatedSwitch = ({
  name,
  label,
  description,
  helperText,
  fallbackDefault,
  ...rest
}: ValidatedSwitchProps & SwitchProps) => {
  const { error, getInputProps, defaultValue, setTouched } = useField(name)
  return (
    <FormControl isInvalid={!!error}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <Switch
        {...getInputProps({
          id: name,
          ...rest,
        })}
        value={'on'}
        defaultChecked={defaultValue !== undefined ? defaultValue : fallbackDefault}
        onChange={e => {
          setTouched(true)
        }}
      >
        {description}
      </Switch>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
