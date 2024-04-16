import { Layout } from '~/components/layout'
import {
  Box,
  Stack,
  Button,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react'
import { DataFunctionArgs, json } from '@remix-run/node'
import { withZod } from '@remix-validated-form/with-zod'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import {
  ValidatedForm,
  useIsSubmitting,
  validationError,
} from 'remix-validated-form'
import { prisma } from '~/utils/prisma.server'
import bcrypt from 'bcryptjs'
import { createUserSession } from '~/utils/auth.server'
import { ValidatedInput } from '~/components/ValidatedInput'
import { useLoaderData } from '@remix-run/react'
import { redirect } from 'remix-typedjson'

const schema = z
  .object({
    email: zfd.text(),
    password: zfd.text(),
    confirmPassword: zfd.text(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const validator = withZod(schema)

export const loader = async ({ params }: DataFunctionArgs) => {
  const user = await prisma.user.findFirst({
    where: {
      email: params.email,
      passwordResetToken: params.token,
    },
    select: {
      email: true,
    },
  })

  if (!user) throw redirect('/')

  return json({ user })
}

export const action = async (args: DataFunctionArgs) => {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: args.params.token,
    },
    select: {
      id: true,
    },
  })

  if (!user) throw new Error('User not found')

  const passwordHash = await bcrypt.hash(data.password, 10)

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: passwordHash,
      passwordResetToken: null,
    },
  })

  return createUserSession(user.id, '/')
}

export default function ResetPassword() {
  const { user } = useLoaderData<typeof loader>()
  return (
    <Layout>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Reset your password</Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              <ValidatedInput
                name="email"
                type="hidden"
                autoComplete={'username'}
                value={user.email}
              />
              <ValidatedInput
                name="password"
                label="New Password"
                type="password"
                autoComplete="new-password"
              />
              <ValidatedInput
                name="confirmPassword"
                label="Confirm password"
                type="password"
              />
              <Stack spacing={10}>
                <ResetPasswordButton />
              </Stack>
            </Stack>
          </ValidatedForm>
        </Box>
      </Stack>
    </Layout>
  )
}

export const ResetPasswordButton = () => {
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
      {isSubmitting ? 'Resetting password...' : 'Reset Password'}
    </Button>
  )
}
