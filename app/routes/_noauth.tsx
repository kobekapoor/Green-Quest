import {
  Box,
  Text,
  useColorModeValue,
  Flex,
  Container,
  useBreakpointValue,
} from '@chakra-ui/react'
import { json } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { env } from 'process'

export const loader = async () => {

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  return json({
    siteName,
  })
}

export default function NoAuth() {
  const { siteName } = useLoaderData<typeof loader>()

  return (
    <>
      <Box>
        <Flex
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.600', 'white')}
          py={{ base: 2 }}
          px={{ base: 4 }}
          borderBottom={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.900')}
        >
          <Container maxW={'container.xl'}>
            <Flex minH={'40px'} align={'center'}>
              <Flex
                flex={{ base: 1 }}
                justify={{ base: 'center', lg: 'start' }}
              >
                <Text
                  textAlign={useBreakpointValue({ base: 'center', lg: 'left' })}
                  fontSize={'lg'}
                  fontFamily={'heading'}
                  fontWeight={500}
                  color={useColorModeValue('gray.800', 'white')}
                >
                  {siteName}
                </Text>
              </Flex>
            </Flex>
          </Container>
        </Flex>
      </Box>
      <Outlet />
    </>
  )
}
