import { Button, ButtonGroup, Flex, Spacer, Stack } from '@chakra-ui/react'
import { NavLink, Outlet, useNavigation } from '@remix-run/react'
import { useState } from 'react'

export default function AdminUsers() {
  const { state } = useNavigation()
  const [clicked, setClicked] = useState('')
  const buttons = [
    { label: 'Details', href: 'details' },
  ]
  return (
    <>
      <Stack spacing={4} pt={4}>
        <Flex minWidth={'max-content'}>
          <ButtonGroup gap={2}>
            {buttons.map(button => (
              <NavLink to={`${button.href}`} key={button.href}>
                {({ isActive }) => (
                  <Button
                    colorScheme="teal"
                    variant={isActive ? 'solid' : 'outline'}
                    isLoading={state === 'loading' && clicked === button.href}
                    onClick={() => setClicked(button.href)}
                  >
                    {button.label}
                  </Button>
                )}
              </NavLink>
            ))}
          </ButtonGroup>
          <Spacer />
        </Flex>
      </Stack>
      <Outlet />
    </>
  )
}
