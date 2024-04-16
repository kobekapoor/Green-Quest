import { Flex, useColorModeValue } from '@chakra-ui/react'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      minH={'95vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      {children}
    </Flex>
  )
}
