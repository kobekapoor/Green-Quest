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

type NewSignupProps = {
  siteName: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

export function NewSignupEmail({
  siteName,
  user: { id, firstName, lastName },
}: NewSignupProps) {
  const baseUrl = process.env.DOMAIN_URL
    ? `https://${process.env.DOMAIN_URL}`
    : 'http://localhost:3000'
  return (
    <Html lang="en">
      <Head></Head>
      <Preview>New signup for {siteName}</Preview>
      <Body>
        <Container style={container}>
          <EmailHeading siteName={siteName} />
          <Text>Hi {firstName},</Text>
          <Text>
            <b>
              {firstName} {lastName}
            </b>{' '}
            has just signed up for a new {siteName} Harbour Witnessing account.{' '}
          </Text>
          <Text>
            Please click the link below to view their details and approve their
            account.
          </Text>
          <Text>
            <Link href={`${baseUrl}/admin/users/${id}/details`}>
              {firstName} {lastName}'s Account
            </Link>
          </Text>
          <Text>
            Warm regards, <br />
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
