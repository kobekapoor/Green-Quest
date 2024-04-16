import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  initialColorMode: 'dark',
  useSystemColorMode: false,
  brand: {
    900: '#1a365d',
    800: '#153e75',
    700: '#2a69ac',
  },
  breakpoints: {
    base: "0em", // 0px
    sm: "38em", // ~480px. em is a relative unit and is dependant on the font-size.
    md: "48em", // ~768px
    lg: "62em", // ~992px
    xl: "80em", // ~1280px
    "2xl": "96em", // ~1536px
  },
  fonts: {
    // heading: `'Open Sans', sans-serif`,
    //body: `'Raleway', sans-serif`,
  },
  semanticTokens: {
    colors: {
      'chakra-border-color': { _light: 'gray.300', _dark: 'gray.700' },
    },
  },
})
