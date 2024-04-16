import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from '@chakra-ui/react'
import { useField } from 'remix-validated-form'
import ReactQuill from './react-quill.client'
import { ClientOnly } from 'remix-utils'
import { useState } from 'react'
import type { ReactQuillProps } from 'react-quill'

type ValidatedQuillProps = {
  name: string
  label?: string
  helperText?: string
  theme?: string
  isRequired?: boolean
}

export const ValidatedQuill = ({
  name,
  label,
  helperText,
  theme,
  isRequired,
  ...rest
}: ValidatedQuillProps & ReactQuillProps) => {
  const { error, getInputProps, defaultValue, setTouched, validate } =
    useField(name)
  const [value, setValue] = useState(defaultValue ?? '')
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <ClientOnly
        fallback={
          <Input
            {...getInputProps({
              id: name,
              ...rest,
            })}
            defaultValue={defaultValue}
          />
        }
      >
        {() => (
          <>
            <input type="hidden" name={name} value={value} />
            <ReactQuill
              theme={theme}
              value={value}
              onChange={content => {
                setValue(content)
                validate()
                setTouched(true)
              }}
            />
          </>
        )}
      </ClientOnly>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}
