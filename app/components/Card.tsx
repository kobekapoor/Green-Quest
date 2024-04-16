import { Card as ChakraCard } from '@chakra-ui/react'
import type { CardProps as ChakraCardProps } from '@chakra-ui/react'

export const Card = ({
  children,
  size,
  variant,
  marginTop,
  ...rest
}: ChakraCardProps) => {
  return (
    <ChakraCard
      size={size ?? { base: 'sm', lg: 'md' }}
      variant={variant ?? 'outline'}
      marginTop={marginTop ?? 4}
      {...rest}
    >
      {children}
    </ChakraCard>
  )
}
