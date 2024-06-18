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

export function meta({data}) {
  return [{ title: `${data.siteName} - Teams` }]
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
      espnId: true,
      startDate: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      golfers: {
        select: {
          id: true,
          name: true,
          salary: true,
          espnId: true,
        },
      },
      bench: {
        select: {
          id: true,
          name: true,
          salary: true,
          espnId: true,
        },
      },
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      usedPlayers: true,
    },
    orderBy: {
      userId: 'asc',
    },
  })

  return json({
    teams,
    siteName,
    events,
    breadcrumbs: [
      {
        label: 'Events',
        href: '/admin/teams',
        isCurrentPage: true,
      },
    ],
  })
}


export const action = async (args: DataFunctionArgs) => {
  const body = JSON.parse(await args.request.text());
  const tournamentId = body.tournamentId;

  var teams = await prisma.team.findMany({
    where: {
      eventId: tournamentId,
    },
    select: {
      id: true,
      golfers: {
        select: {
          id: true,
          name: true,
          salary: true,
          espnId: true,
          performances: {
            select: {
              id: true,
              score: true,
              status: true,
              day: true,
              golferId: true,
            },
            where: {
              eventId: tournamentId,
            },
          }
        },
      },
      bench: {
        select: {
          id: true,
          name: true,
          salary: true,
          espnId: true,
          performances: {
            select: {
              id: true,
              score: true,
              status: true,
              day: true,
              golferId: true,
            },
            where: {
              eventId: tournamentId,
            },
          }
        },
      },
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      score: true,
      usedPlayers: true,
    },
    orderBy: {
      userId: 'asc',
    },
  });

  for (let i = 0; i < teams.length; i++) {

    //Update usedPlayers based on performances status'
    let team = teams[i];
    let usedPlayers = teams[i].usedPlayers;

    for (let i = 0; i < usedPlayers.length; i++) {
      let day = usedPlayers[i].day;
      let golfers = usedPlayers[i].golfers;
      if(golfers.length === 4){
        continue;
      } else {
        //Find golfers performances for the day
        console.log('Finding golfers performances for day: ', day);

        //Get all performances out of teams[i].golfers and pull them out into a new array
        let performances = [];
        for (let j = 0; j < team.golfers.length; j++) {
          let golfer = team.golfers[j];
          for (let k = 0; k < golfer.performances.length; k++) {
            let performance = golfer.performances[k];
            if(performance.day === day){
              performances.push(performance);
            }
          }
        }

        console.log('Performances: ', performances);

        //Based on their status, add them to the usedPlayers array
        for (let j = 0; j < performances.length; j++) {
          let performance = performances[j];
          if(performance.status !== 'STATUS_SCHEDULED'){
            //Check if the golfer is already in the usedPlayers array
            let found = false;
            for (let k = 0; k < golfers.length; k++) {
              if(golfers[k].id === performance.golferId){
                found = true;
              }
            }
            if(!found){
              //Add the golfer to the usedPlayers array
              for (let k = 0; k < team.golfers.length; k++) {
                let golfer = team.golfers[k];
                if(golfer.id === performance.golferId){
                  golfers.push(golfer.id);
                }
              }
            }
          }
        }
      }
    }

    console.log('Used Players: ', usedPlayers);
    //Update the usedPlayers array in the team
    await prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        usedPlayers: {
          set: usedPlayers,
        },
      },
    });

  }

  return redirect(`/admin/teams`);
}

export default function AdminGolfers() {
  const { teams, events } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [tournamentId, setTournamentId] = useState('')

  const handleRefreshTeams = async () => {
    try {
      const response = await fetch('/admin/teams', {
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
        console.log('Teams refreshed successfully')
      } else {
        // Handle error
        console.error('Failed to refresh Teams')
      }
    } catch (error) {
      console.error('An error occurred while refreshing teams', error)
    }
  }

  return (
    <>
      <Flex mt={4} justifyContent={'space-between'} alignItems={'center'}>
        <Select ml={2} width="25%" placeholder="Select event" onChange={(e) => setTournamentId(e.target.value)}>
          {events.map(event => (
             <option key={event.id} value={event.espnId}>{event.name}</option>
          ))}
        </Select>
        <Button width="15%" onClick={() => handleRefreshTeams()} colorScheme={'blue'}>Refresh Teams</Button>
      </Flex>
      <Card>
        <CardBody>
          <TableContainer>
            <Table variant={'simple'}>
              <Thead>
                <Tr>
                  <Th>User</Th>
                  <Th>Event</Th>
                  <Th>Golfers</Th>
                  <Th>Bench</Th>
                  <Th>Score</Th>
                  <Th>
                    <Link to={'new'}>
                      <AddIcon />
                    </Link>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {teams.map(team => (
                  <Tr
                    key={team.id}
                    onClick={() => navigate(`${team.id}`)}
                    cursor={'pointer'}
                  >
                    <Td>{team.user.firstName} {team.user.lastName}</Td>
                    <Td>{team.event.name}</Td>
                    <Td>{team.golfers.length}</Td>
                    <Td>{team.bench.length}</Td>
                    <Td>{team.score}</Td>
                    <Td>
                      <ChevronRightIcon />
                    </Td>
                  </Tr>
                ))}
                {teams.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign={'center'}>
                      No teams found
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
