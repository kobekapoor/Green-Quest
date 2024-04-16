import { ClientOnly } from 'remix-utils'
import DOMPurify from './dompurify.client'
import { Spinner } from '@chakra-ui/react'

type SanitizedHTMLProps = {
  html: string
}

export const SanitizedHTML = ({ html }: SanitizedHTMLProps) => {
  return (
    <ClientOnly fallback={<Spinner />}>
      {() => (
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
      )}
    </ClientOnly>
  )
}
