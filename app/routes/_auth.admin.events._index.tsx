import type { DataFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { prisma } from '~/utils/prisma.server'
import { Card } from '~/components/Card'
import {
  CardBody,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Flex,
  Code,
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  Button,
} from '@chakra-ui/react'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { AddIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { redirect } from 'remix-typedjson'
import { getUser } from '~/utils/auth.server'
import { Role } from '@prisma/client'
import { useState } from 'react'

export function meta({data}) {
  return [{ title: `${data.siteName} - Events` }]
}

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin') 

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      golfers: true,
      performances: true,
      status: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return json({
    events,
    siteName,
    breadcrumbs: [
      {
        label: 'Events',
        href: '/admin/events',
        isCurrentPage: true,
      },
    ],
  })
}


export const action = async (args: DataFunctionArgs) => {
  const body = JSON.parse(await args.request.text());

  var events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      espnId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const response = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/tourschedule?region=au&lang=en&season=2024`);
  const data = await response.json();

  const season = await prisma.season.findFirst({
    where: {
      name: '2024',
    },
  });

  const tournaments = data.seasons[0].events.map((tournament: any) => {
    return {
      id: tournament.id,
      name: tournament.label,
      startDate: new Date(tournament.startDate).toISOString(),
      endDate: new Date(tournament.endDate).toISOString(),
      espnId: tournament.id,
      location: tournament.locations[0],
      seasonId: season.id,
      status: tournament.status,
    }
  })

  const eventsToCreate = tournaments.filter((tournament: any) => !events.find((event: any) => event.espnId === tournament.espnId));
  const eventsToUpdate = tournaments.filter((tournament: any) => events.find((event: any) => event.espnId === tournament.espnId));

  console.log("events to create: ", eventsToCreate.length)
  console.log("events to update: ", eventsToUpdate.length)

  await prisma.event.createMany({
    data: eventsToCreate,
  });

  await prisma.event.updateMany({
    where: {
      espnId: {
        in: eventsToUpdate.map((event: any) => event.espnId),
      },
    },
    data: eventsToUpdate,
  });


  return redirect(`/admin/events`);
}

export default function AdminGolfers() {
  const { events } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const handleRefreshGolfers = async () => {
    try {
      const response = await fetch('/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        // Handle success
        console.log('Events refreshed successfully')
      } else {
        // Handle error
        console.error('Failed to refresh golfers')
      }
    } catch (error) {
      console.error('An error occurred while refreshing golfers', error)
    }
  }

  return (
    <>
      <Flex mt={4} justifyContent={'space-between'} alignItems={'center'}>
        <InputGroup width="80%">
          <Input placeholder="Search" />
        </InputGroup>
        <Button width="15%" onClick={() => handleRefreshGolfers()} colorScheme={'blue'}>Refresh Events</Button>
      </Flex>
      <Card>
        <CardBody>
          <TableContainer>
            <Table variant={'simple'}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th>Golfers</Th>
                  <Th>Status</Th>
                  <Th>
                    <Link to={'new'}>
                      <AddIcon />
                    </Link>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map(event => (
                  <Tr
                    key={event.id}
                    onClick={() => navigate(`${event.id}`)}
                    cursor={'pointer'}
                  >
                    <Td>{event.name}</Td>
                    <Td>{event.startDate}</Td>
                    <Td>{event.endDate}</Td>
                    <Td>{event.golfers.length}</Td>
                    <Td>{event.status}</Td>
                    <Td>
                      <ChevronRightIcon />
                    </Td>
                  </Tr>
                ))}
                {events.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign={'center'}>
                      No events found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </>
  )
}
