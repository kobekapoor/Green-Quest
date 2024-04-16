import { Layout } from '~/components/layout'
import {
  Box,
  Checkbox,
  Stack,
  Link,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Container,
  useBreakpointValue,
} from '@chakra-ui/react'
import { DataFunctionArgs, redirect } from '@remix-run/node'
import type { LoaderFunction } from '@remix-run/node'
import { createUserSession, getUser } from '~/utils/auth.server'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { withZod } from '@remix-validated-form/with-zod'
import { prisma } from '~/utils/prisma.server'
import bcrypt from 'bcryptjs'
import {
  ValidatedForm,
  useIsSubmitting,
  validationError,
} from 'remix-validated-form'
import { ValidatedInput } from '~/components/ValidatedInput'
import { Link as RemixLink } from '@remix-run/react'

export const loader: LoaderFunction = async ({ request }) => {
  return (await getUser(request)) ? redirect('/') : null // redirect to home if user is already logged in
}

const schema = z.object({
  email: zfd.text(z.string().email()),
  password: zfd.text(),
})

const clientValidator = withZod(schema)

export const action = async (args: DataFunctionArgs) => {
  const params = new URLSearchParams(args.request.url.split('?')[1])
  const redirectUrl = params.get('redirectUrl') || '/'

  const serverValidator = withZod(
    schema.refine(
      async data => {
        const user = await prisma.user.findUnique({
          where: { email: data.email },
        })
        return (
          user && (await bcrypt.compare(data.password, user.password))
        )
      },
      {
        message: 'Invalid email or password',
        path: ['password'],
      }
    )
  )

  const { data, error } = await serverValidator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (!user) throw new Error('User not found')

  return await createUserSession(user.id, redirectUrl)
}

export default function Signin() {
  return (
    <>
      <Layout>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
          <Stack align={'center'}>
            <Heading fontSize={'4xl'}>Sign in to your account</Heading>
            <Text fontSize={'lg'} color={'gray.600'}>
              Don't have an account?{' '}
              <RemixLink to={'/signup'}>
                <Link color={'blue.400'}>Sign Up</Link>
              </RemixLink>
            </Text>
          </Stack>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            <ValidatedForm validator={clientValidator} method="post">
              <Stack spacing={4}>
                <ValidatedInput
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete={'username'}
                  isRequired
                />
                <ValidatedInput
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete={'current-password'}
                  isRequired
                />
                <Stack spacing={10}>
                  <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    align={'start'}
                    justify={'space-between'}
                  >
                    <Checkbox>Remember me</Checkbox>
                    <RemixLink to={'/forgot-password'}>
                      <Link color={'blue.400'}>Forgot password?</Link>
                    </RemixLink>
                  </Stack>
                  <SignInButton />
                </Stack>
              </Stack>
            </ValidatedForm>
          </Box>
        </Stack>
      </Layout>
    </>
  )
}

export const SignInButton = () => {
  const isSubmitting = useIsSubmitting()
  return (
    <Button
      type="submit"
      isLoading={isSubmitting}
      bg={'blue.400'}
      color={'white'}
      _hover={{
        bg: 'blue.500',
      }}
    >
      {isSubmitting ? 'Signing in...' : 'Sign In'}
    </Button>
  )
}
