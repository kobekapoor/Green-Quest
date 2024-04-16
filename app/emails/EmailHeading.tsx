import { Column, Heading, Section } from '@react-email/components'

export function EmailHeading({ siteName }: { siteName: string }) {
  return (
    <Section width={''}>
      <Column>
        <Heading style={siteHeading}>siteName</Heading>
      </Column>
    </Section>
  )
}

const siteHeading = {
  color: '#A05',
}
