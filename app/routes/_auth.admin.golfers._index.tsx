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
  Select,
} from '@chakra-ui/react'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { AddIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { redirect } from 'remix-typedjson'
import { getUser } from '~/utils/auth.server'
import { Role } from '@prisma/client'
import { useState } from 'react'
import { BsEraserFill } from 'react-icons/bs'
import { Decimal } from '@prisma/client/runtime/library'

export function meta({data}) {
  return [{ title: `${data.siteName} - Golfers` }]
}

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin') 

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  const golfers = await prisma.golfer.findMany({
    select: {
      id: true,
      name: true,
      salary: true,
      espnId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      golfers: true,
      performances: true,
      status: true,
      espnId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return json({
    golfers,
    siteName,
    events,
    breadcrumbs: [
      {
        label: 'Golfers',
        href: '/admin/golfers',
        isCurrentPage: true,
      },
    ],
  })
}


export const action = async (args: DataFunctionArgs) => {
  const body = JSON.parse(await args.request.text());
  const tournamentId = body.tournamentId;

  var golfers = await prisma.golfer.findMany({
    select: {
      id: true,
      name: true,
      salary: true,
      espnId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const response = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&region=au&lang=en&event=${tournamentId}`);
  const data = await response.json();

  const competitors = data.events[0].competitions[0].competitors.map((player: any) => {
    return {
      name: player.athlete.displayName,
      salary: 0,
      espnId: player.athlete.id,
      pictureLink: player.athlete?.headshot?.href,
      events: {
        connect: {
          id: tournamentId,
        },
      },
    };
  });

  const golfersToCreate = competitors.filter((competitor: any) => !golfers.find((golfer: any) => golfer.espnId === competitor.espnId));

  await prisma.golfer.createMany({
    data: golfersToCreate,
  });

  const fantasyResponse = await fetch(`https://www.fantasyalarm.com/sports/pga/percentage?group=`);
  const fantasyData = await fantasyResponse.json();

  golfers = await prisma.golfer.findMany({
    select: {
      id: true,
      name: true,
      salary: true,
      espnId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  fantasyData.rows.forEach((row: any) => {
    const golfer = golfers.find((g: any) => 
      g.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === row.Name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase());
    if (golfer) {
      golfer.salary = row["DK $"] ? parseFloat(row["DK $"].replace('$', '')) / 500 : 0;
    }
  });

  for (const golfer of golfers) {
    await prisma.golfer.update({
      where: {
        id: golfer.id,
      },
      data: {
        salary: new Decimal(golfer.salary || 0),
        events: {
          connect: {
            id: tournamentId,
          },
        },
      },
    });
  }

  return redirect(`/admin/golfers`);
}

export default function AdminGolfers() {
  const { golfers, events } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [tournamentId, setTournamentId] = useState('')

  const handleRefreshGolfers = async () => {
    try {
      const response = await fetch('/admin/golfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
        }),
      })
      if (response.ok) {
        // Handle success
        console.log('Golfers refreshed successfully')
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
        <InputGroup width="50%">
          <Input placeholder="Search" />
        </InputGroup>
        <Select ml={2} width="25%" placeholder="Select event" onChange={(e) => setTournamentId(e.target.value)}>
          {events.map(event => (
             <option key={event.id} value={event.espnId}>{event.name}</option>
          ))}
        </Select>
        <Button width="20%" onClick={() => handleRefreshGolfers()} colorScheme={'blue'}>Refresh Golfers</Button>
      </Flex>
      <Card>
        <CardBody>
          <TableContainer>
            <Table variant={'simple'}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Salary</Th>
                  <Th>ESPN Id</Th>
                  <Th>
                    <Link to={'new'}>
                      <AddIcon />
                    </Link>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {golfers.map(golfer => (
                  <Tr
                    key={golfer.id}
                    onClick={() => navigate(`${golfer.id}`)}
                    cursor={'pointer'}
                  >
                    <Td>{golfer.name}</Td>
                    <Td>${golfer.salary}m</Td>
                    <Td>{golfer.espnId}</Td>
                    <Td>
                      <ChevronRightIcon />
                    </Td>
                  </Tr>
                ))}
                {golfers.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign={'center'}>
                      No golfers found
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
