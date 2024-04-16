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

type NewUserProps = {
  siteName: string
  user: {
    email: string
    passwordResetToken: string | null
    firstName: string
    lastName: string
  }
}

export function NewUserEmail({
  user: { email, passwordResetToken, firstName, lastName },
  siteName,
}: NewUserProps) {
  const baseUrl = process.env.DOMAIN_URL
    ? `https://${process.env.DOMAIN_URL}`
    : 'http://localhost:3000'
  return (
    <Html lang="en">
      <Head></Head>
      <Preview>Welcome to {siteName}</Preview>
      <Body>
        <Container style={container}>
          <EmailHeading siteName={siteName} />
          <Text>
            Dear {firstName} {lastName},
          </Text>
          <Text>
            A new account for {siteName} has been created for you. Before you
            can signin, you must reset your password. Please click the reset
            password link below to get started.
          </Text>
          <Text>
            <Link
              href={`${baseUrl}/reset-password/${passwordResetToken}/${email}`}
            >
              Reset Password
            </Link>
          </Text>
          <Text>
            Thanks! <br />
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
