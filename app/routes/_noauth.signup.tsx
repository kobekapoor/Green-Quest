import { Layout } from '~/components/layout'
import {
  Box,
  Stack,
  Button,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react'
import { DataFunctionArgs } from '@remix-run/node'
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
import { Role } from '@prisma/client'
import { sendSingleEmail } from '~/utils/email.server'
import { NewSignupEmail } from '~/emails/NewSignup'
import { env } from 'process'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

const schema = z
  .object({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(z.string().email()),
    mobileNo: zfd.text(),
    password: zfd.text(),
    confirmPassword: zfd.text(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const clientValidator = withZod(schema)

export const action = async (args: DataFunctionArgs) => {
  const serverValidator = withZod(
    schema
      .refine(
        async data => {
          const exists = await prisma.user.count({
            where: { email: data.email },
          })
          return exists === 0
        },
        {
          message: 'User already exists',
          path: ['email'],
        }
      )
  )

  const { data, error } = await serverValidator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  const passwordHash = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNo: data.mobileNo,
      password: passwordHash,
    },
  })

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN || Role.SUPER_ADMIN },
    select: { email: true },
  })

  await Promise.all(
    admins.map(async admin => {
      await sendSingleEmail({
        to: admin.email,
        subject: 'New User Signup',
        component: (
          <NewSignupEmail siteName={siteName} user={user} />
        ),
      })
    })
  )

  return createUserSession(user.id, '/')
}

export default function Signup() {
  return (
    <Layout>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Sign up for an account</Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <ValidatedForm validator={clientValidator} method="post">
            <Stack spacing={4}>
              <ValidatedInput name="firstName" label="First name" isRequired />
              <ValidatedInput name="lastName" label="Last name" isRequired />
              <ValidatedInput
                name="mobileNo"
                label="Mobile number"
                isRequired
              />
              <ValidatedInput
                name="email"
                label="Email address"
                autoComplete={'username'}
                isRequired
              />
              <ValidatedInput
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                isRequired
              />
              <ValidatedInput
                name="confirmPassword"
                label="Confirm password"
                type="password"
                isRequired
              />
              <Stack spacing={10}>
                <SignUpButton />
              </Stack>
            </Stack>
          </ValidatedForm>
        </Box>
      </Stack>
    </Layout>
  )
}

export const SignUpButton = () => {
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
      {isSubmitting ? 'Signing up...' : 'Sign Up'}
    </Button>
  )
}
