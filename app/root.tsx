import React, { useContext, useEffect, useMemo } from 'react'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { cssBundleHref } from '@remix-run/css-bundle'
import type {
  DataFunctionArgs,
  LinksFunction,
  V2_MetaFunction,
} from '@remix-run/node'
import { ChakraProvider, cookieStorageManagerSSR } from '@chakra-ui/react'
import { withEmotionCache } from '@emotion/react'
import { ServerStyleContext, ClientStyleContext } from './context'
import { theme } from './theme'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export const meta: V2_MetaFunction = () => [{ title: siteName }]

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
]

interface DocumentProps {
  children: React.ReactNode
  colorMode?: string
}

const Document = withEmotionCache(
  ({ children, colorMode }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext)
    const clientStyleData = useContext(ClientStyleContext)

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head
      // re-inject tags
      const tags = emotionCache.sheet.tags
      emotionCache.sheet.flush()
      tags.forEach(tag => {
        ;(emotionCache.sheet as any)._insertTag(tag)
      })
      // reset cache to reapply global styles
      clientStyleData?.reset()
    }, [])
    return (
      <html
        lang="en"
        {...(colorMode && {
          'data-theme': colorMode,
          style: { colorScheme: colorMode },
        })}
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          {/* <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          /> */}
          <link rel="manifest" href="/site.webmanifest" />
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(' ')}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body
          {...(colorMode && {
            className: `chakra-ui-${colorMode}`,
          })}
        >
          {children}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    )
  }
)

export const loader = ({ request }: DataFunctionArgs) => {
  return request.headers.get('cookie') ?? ''
}

export default function App() {
  function getColorMode(cookies: string) {
    const match = cookies.match(
      new RegExp(`(^| )${CHAKRA_COOKIE_COLOR_KEY}=([^;]+)`)
    )
    return match == null ? void 0 : match[2]
  }

  const DEFAULT_COLOR_MODE: 'dark' | 'light' | null = 'light'
  const CHAKRA_COOKIE_COLOR_KEY = 'chakra-ui-color-mode'
  let cookies = useLoaderData()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const mediaWatcher = window.matchMedia('(prefers-color-scheme: dark)')
    document.cookie = `chakra-ui-color-mode=${
      mediaWatcher.matches ? 'dark' : 'light'
    }; path=/`

    function updatePrefersDark(e: { matches: any }) {
      document.cookie = `chakra-ui-color-mode=${
        e.matches ? 'dark' : 'light'
      }; path=/`
    }
    mediaWatcher.addEventListener('change', updatePrefersDark)

    return function cleanup() {
      mediaWatcher.removeEventListener('change', updatePrefersDark)
    }
  }, [])

  if (typeof document !== 'undefined') {
    cookies = document.cookie
  }

  let colorMode = useMemo(() => {
    let color = getColorMode(cookies)

    if (!color && DEFAULT_COLOR_MODE) {
      color = DEFAULT_COLOR_MODE
    }

    return color
  }, [cookies])

  return (
    <Document colorMode={colorMode}>
      <ChakraProvider
        colorModeManager={cookieStorageManagerSSR(cookies)}
        theme={theme}
      >
        <Outlet />
      </ChakraProvider>
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    )
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    )
  } else {
    return <h1>Unknown Error</h1>
  }
}
