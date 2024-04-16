import { Layout } from '~/components/layout'
import {
  Box,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
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
import { ValidatedInput } from '~/components/ValidatedInput'
import { createId } from '@paralleldrive/cuid2'
import { sendSingleEmail } from '~/utils/email.server'
import { ForgotPasswordEmail } from '~/emails/ForgotPassword'
import { useActionData } from '@remix-run/react'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';
const schema = z.object({
  email: zfd.text(z.string().email()),
})

const validator = withZod(schema)

export const action = async (args: DataFunctionArgs) => {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  const user = await prisma.user.update({
    where: { email: data.email },
    data: {
      passwordResetToken: createId(),
    },
    select: {
      firstName: true,
      email: true,
      passwordResetToken: true,
    },
  })

  if (user) {
    await sendSingleEmail({
      to: user.email,
      subject: 'Password reset',
      component: <ForgotPasswordEmail user={user} siteName={siteName} />,
    })
  }

  return json({ submitted: true })
}

export default function ForgotPassword() {
  const data = useActionData()
  return (
    <Layout>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Forgotten your password?</Heading>
          <Text fontSize={'lg'} color={'gray.600'} align={'center'}>
            That's ok, we all forget things. <br /> Just enter your email
            address below and we'll send you a link to reset your password.
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <ValidatedForm
            validator={validator}
            method="post"
            resetAfterSubmit={true}
          >
            <Stack spacing={4}>
              <ValidatedInput name="email" label="Email address" isRequired />
              <Stack spacing={10}>
                <ForgotPasswordButton />
              </Stack>
              {data && data.submitted && (
                <Alert status="success">
                  <AlertIcon />
                  Your password reset request has been submitted. Please check
                  your email for further instructions.
                </Alert>
              )}
            </Stack>
          </ValidatedForm>
        </Box>
      </Stack>
    </Layout>
  )
}

export const ForgotPasswordButton = () => {
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
      {isSubmitting ? 'Requesting password reset...' : 'Request password reset'}
    </Button>
  )
}
