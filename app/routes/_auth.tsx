import { Form, Outlet, useLoaderData, useNavigate } from '@remix-run/react'
import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { getUser } from '~/utils/auth.server'
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react'
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons'
import { Role } from '@prisma/client'
import { redirect } from 'remix-typedjson'
import { TimeZoneContext } from '~/contexts/TimezoneContext'
import { useBreadcrumbs } from '~/hooks/useBreadcrumbs'

interface NavItem {
  label: string
  subLabel?: string
  children?: Array<NavItem>
  href?: string
}

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request)

  if (!user) throw redirect(`/signin?redirectUrl=${request.url}`)

  const navItems: Array<NavItem> = [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'Settings',
      href: '/',
    },
  ]

  const adminNavItems: Array<NavItem> = [
    {
      label: 'Admin',
      children: [
        {
          label: 'Users',
          href: '/admin/users',
        },
      ],
    },
    
  ]

  const superAdminNavItems: Array<NavItem> = [
    {
      label: 'Super Admin',
      children: [
        {
          label: 'DB',
          href: '/superadmin/db',
        },
      ],
    },
  ]

  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    navItems.push(...adminNavItems)
  }

  if (user.role === Role.SUPER_ADMIN) {
    navItems.push(...superAdminNavItems)
  }

  return json({
    navItems: navItems,
  })
}

function Nav() {
  const { isOpen, onToggle } = useDisclosure()
  const { navItems } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
      >
        <Container maxW={'container.xl'}>
          <Flex minH={'40px'} align={'center'}>
            <Flex
              flex={{ base: 1, lg: 'auto' }}
              ml={{ base: -2 }}
              display={{ base: 'flex', lg: 'none' }}
            >
              <IconButton
                onClick={onToggle}
                icon={
                  isOpen ? (
                    <CloseIcon w={3} h={3} />
                  ) : (
                    <HamburgerIcon w={5} h={5} />
                  )
                }
                variant={'ghost'}
                aria-label={'Toggle Navigation'}
              />
            </Flex>
            <Link href="/" _hover={{ textDecoration: 'none' }}>
              {siteName}
            </Link>
            <Flex flex={{ base: 1 }} justify={{ base: 'center', lg: 'start' }}>
              <Flex display={{ base: 'none', lg: 'flex' }} ml={10}>
                <DesktopNav navItems={navItems} />
              </Flex>
            </Flex>

            <Stack
              flex={{ base: 1, lg: 0 }}
              justify={'flex-end'}
              direction={'row'}
              spacing={6}
            >
              <Form action="/signout" method="post">
                <Button
                  type="submit"
                  fontSize={'md'}
                  fontWeight={400}
                  variant={'link'}
                >
                  Sign Out
                </Button>
              </Form>
            </Stack>
          </Flex>
        </Container>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav navItems={navItems} />
      </Collapse>
    </Box>
  )
}

interface NavProps {
  navItems: Array<NavItem>
}

const DesktopNav = ({ navItems }: NavProps) => {

  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const linkHoverColor = useColorModeValue('gray.800', 'white')
  const popoverContentBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Stack direction={'row'} spacing={4}>
      {navItems.map(navItem => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                href={navItem.href ?? '#'}
                fontSize={'md'}
                fontWeight={400}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
              >
                {navItem.label}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack>
                  {navItem.children.map(child => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  )
}

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      href={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}
    >
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'pink.400' }}
            fontWeight={400}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'pink.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  )
}

const MobileNav = ({ navItems }: NavProps) => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ lg: 'none' }}
    >
      {navItems.map(navItem => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as={Link}
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
      >
        <Text
          fontWeight={400}
          color={useColorModeValue('gray.600', 'gray.200')}
        >
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}
        >
          {children &&
            children.map(child => (
              <Link key={child.label} py={2} href={child.href}>
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default function Auth() {
  const { timezone } = useLoaderData<typeof loader>()
  const breadcrumbs = useBreadcrumbs()
  return (
    <>
      <Nav />
      <Container
        maxWidth={'container.xl'}
        marginTop={0}
        px={{ base: 1, md: 4 }}
        py={3}
      >
        {/* <Button onClick={() => toggleColorMode()}>Set Dark</Button> */}
        <Breadcrumb
          pl={2}
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" />}
          listProps={{ flexWrap: 'wrap' }}
        >
          {breadcrumbs &&
            breadcrumbs.map((breadcrumb, index) => (
              <BreadcrumbItem
                isCurrentPage={breadcrumb.isCurrentPage}
                key={index}
              >
                <BreadcrumbLink href={breadcrumb.href}>
                  {breadcrumb.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
        </Breadcrumb>
        <TimeZoneContext.Provider value={timezone}>
          <Outlet />
        </TimeZoneContext.Provider>
      </Container>
    </>
  )
}
