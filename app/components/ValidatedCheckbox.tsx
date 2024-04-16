import { Checkbox, FormErrorMessage, FormHelperText } from '@chakra-ui/react'
import type { CheckboxProps } from '@chakra-ui/react'
import { useField } from 'remix-validated-form'

type ValidatedCheckboxProps = {
  name: string
  label?: string
  helperText?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const ValidatedCheckbox = ({
  name,
  label,
  helperText,
  onChange,
  defaultChecked,
  ...rest
}: ValidatedCheckboxProps & CheckboxProps) => {
  const { error, getInputProps, defaultValue, setTouched } = useField(name)
  return (
    <>
      <Checkbox
        {...getInputProps({
          id: name,
          ...rest,
        })}
        isInvalid={!!error}
        value={'on'}
        defaultChecked={defaultChecked !== undefined ? defaultChecked : defaultValue}
        onChange={e => {
          setTouched(true)
          onChange?.(e)
        }}
      >
        {label}
      </Checkbox>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </>
  )
}