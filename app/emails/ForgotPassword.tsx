import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
} from '@react-email/components'
import { EmailHeading } from './EmailHeading'

type ForgotPasswordProps = {
  user: {
    email: string
    passwordResetToken: string | null
    firstName: string
  },
  siteName: string
}

export function ForgotPasswordEmail({
  user: { email, passwordResetToken, firstName },
  siteName
}: ForgotPasswordProps) {
  const baseUrl = process.env.DOMAIN_URL
    ? `https://${process.env.DOMAIN_URL}`
    : 'http://localhost:3000'
  return (
    <Html lang="en">
      <Head></Head>
      <Preview>Click this link to reset your password</Preview>
      <Body>
        <Container style={container}>
          <EmailHeading siteName={siteName} />
          <Text>
            Dear {firstName},
          </Text>
          <Text>
            You have requested to reset your password. Please click the link
            below to reset your password.
          </Text>
          <Text>
            <Link
              href={`${baseUrl}/reset-password/${passwordResetToken}/${email}`}
            >
              Reset Password
            </Link>
          </Text>
          <Text>
            If you did not request to reset your password, please ignore this
            email.
          </Text>
          <Text>
            Thank you, <br />
            {siteName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const container = {
  width: '480px',
  margin: '0 auto',
  padding: '20px 0 48px',
}
