import type { DataFunctionArgs } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import { prisma } from '~/utils/prisma.server'
import { Card } from '~/components/Card'
import { Button, CardBody, Stack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { withZod } from '@remix-validated-form/with-zod'
import { zfd } from 'zod-form-data'
import { ValidatedForm, validationError } from 'remix-validated-form'
import { ValidatedInput } from '~/components/ValidatedInput'
import { ValidatedSelect } from '~/components/ValidatedSelect'
import { SubmitButton } from '~/components/SubmitButton'
import { getUser } from '~/utils/auth.server'

export function meta({data}) {
  return [{ title: `${data.siteName} - Event Details` }]
}

const validator = withZod(
  z.object({
    name: zfd.text(),    
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const checkUser = await getUser(args.request)

  if (!checkUser || (checkUser.role !== Role.ADMIN && checkUser.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  const event = await prisma.event.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      name: true,
      performances: {
        select: {
          id: true,
          status: true,
          teeTime: true,
          day: true,
          score: true,
          golfer: {
            select: {
              id: true,
              name: true,
              espnId: true,
            },
          },
        },
      },
    },
  })

  const leaderboard: any[] = [];

  event.performances.reduce((acc, performance) => {
    const { golfer, score, status, teeTime, day } = performance;
    const { id, name, espnId } = golfer;
    const existingGolfer = acc.find((g) => g.id === id);
    if (existingGolfer) {
      existingGolfer.linescores.push({ round: day, score, status, teeTime });
      existingGolfer.totalScore += score;
    } else {
      acc.push({
        id,
        name,
        espnId,
        linescores: [{ round: day, score, status, teeTime }],
        totalScore: score,
      });
    }
    return acc;
  }, leaderboard);

  if (!event) throw new Error('User not found');

  return json({
    event,
    siteName,
    leaderboard,
    breadcrumbs: [
      {
        label: 'Events',
        href: '/admin/events',
      },
      {
        label: `${event.name}`,
        href: `/admin/events/${event.id}`,
        isCurrentPage: true,
      },
    ],
  })
}

export const action = async (args: DataFunctionArgs) => {

  const golfers = await prisma.golfer.findMany({
    select: {
      id: true,
      espnId: true,
    },
  });

  const response = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&region=au&lang=en&event=${args.params.id}&showAirings=buy%2Clive&buyWindow=1m`);
  const data = await response.json();

  const leaderboard = data?.events[0].competitions[0].competitors.map((competitor: any) => ({
    id: competitor.id,
    name: competitor.athlete.displayName,
    linescores: competitor.linescores.map((line: any) => ({
      golferId: golfers.find((golfer) => golfer.espnId === competitor.id)?.id,
      eventId: args.params.id,
      day: line.period,
      status: competitor.status.period === line.period ? competitor.status.type.name : 'STATUS_FINISH',
      teeTime: line.teeTime ? new Date(line.teeTime) : null,
      score: line.displayValue ? (line.displayValue === '+' ? parseInt(line.displayValue + line.value) :
         line.displayValue === '-' ? parseInt(line.displayValue + line.value) :
         line.displayValue === 'E' ? 0 : parseInt(line.displayValue)) : 0,
      holesPlayed: competitor.status.period === line.period ? competitor.status.hole : 18,
    })),
  }));



// Create/update performance objects based on leaderboard
if (leaderboard) {

  const updates = [];
  const creates = [];

  const performances = await prisma.performance.findMany({
    where: {
      eventId: args.params.id,
    },
    select: {
      id: true,
      golferId: true,
      golfer: {
        select: {
          espnId: true,
        },
      },
      day: true,
    },
  });


  for (const competitor of leaderboard) {
    const existingPerformances = performances.filter(perf => perf.golfer.espnId === competitor.id);

    for (const line of competitor.linescores) {
      const exists = existingPerformances.some(perf => perf.day === line.day);
      if (exists) {
        // Prepare the update data
        updates.push({
          where: {
            golferId_eventId_day: {
            golferId: line.golferId, // Assuming `competitor.id` corresponds to `golferId`
            eventId: args.params.id,
            day: line.day,
            },
          },
          data: {
            status: line.status,
            teeTime: line.teeTime ? new Date(line.teeTime) : null,
            score: line.score,
            holesPlayed: line.holesPlayed,
          },
        });
      } else {
        // Prepare the create data
        creates.push({
          golferId: line.golferId, // Assuming `competitor.id` corresponds to `golferId`
          eventId: args.params.id,
          day: line.day,
          status: line.status,
          teeTime: line.teeTime ? new Date(line.teeTime) : null,
          score: line.score,
          holesPlayed: line.holesPlayed,
        });
      }
    }
  }

  // Perform batch updates and creates
  if (updates.length) {
    for (const update of updates) {
      await prisma.performance.update({
        where: update.where,
        data: update.data,
      });
    }
  }

  if (creates.length) {
    await prisma.performance.createMany({
      data: creates,
      skipDuplicates: true, // This helps in avoiding creation of duplicate records
    });
  }

  console.log('Updated:', updates.length, 'Created:', creates.length);

}

  return redirect(`/admin/events/${args.params.id}`)
}

export default function AdminEventDetails() {
  const { event, leaderboard } = useLoaderData<typeof loader>()

  const RefreshEvent = async () => {
    try {
      const response = await fetch(`/admin/events/${event.id}`, {
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

  const sortedLeaderboard = leaderboard.sort((a, b) => a.totalScore - b.totalScore);

  return (
    <>
      
      <Card>
        <CardBody>
          <Stack spacing={4}>
            <h1>{event.name}</h1>
            <Button mb={4} onClick={RefreshEvent}>Refresh Event</Button>
          </Stack>

          <Stack spacing={4}>
            <h2>Leaderboard</h2>
            <Table>
              <Thead>
                <Tr>
                  <Th>Golfer</Th>
                  <Th textAlign="right">Round 1</Th>
                  <Th textAlign="right">Round 2</Th>
                  <Th textAlign="right">Round 3</Th>
                  <Th textAlign="right">Round 4</Th>
                  <Th textAlign="right">Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedLeaderboard.map((golfer) => (
                  <Tr key={golfer.id}>
                    <Td>{golfer.name}</Td>
                    <Td textAlign="right">{golfer.linescores.find((line) => line.round === 1)?.status === 'STATUS_FINISH' ? golfer.linescores.find((line) => line.round === 1).score : golfer.linescores.find((line) => line.round === 1)?.status}</Td>
                    <Td textAlign="right">{golfer.linescores.find((line) => line.round === 2)?.status === 'STATUS_FINISH' ? golfer.linescores.find((line) => line.round === 2).score : golfer.linescores.find((line) => line.round === 2)?.status}</Td>
                    <Td textAlign="right">{golfer.linescores.find((line) => line.round === 3)?.status === 'STATUS_FINISH' ? golfer.linescores.find((line) => line.round === 3).score : golfer.linescores.find((line) => line.round === 3)?.status}</Td>
                    <Td textAlign="right">{golfer.linescores.find((line) => line.round === 4)?.status === 'STATUS_FINISH' ? golfer.linescores.find((line) => line.round === 4).score : golfer.linescores.find((line) => line.round === 4)?.status}</Td>
                    <Td textAlign="right">{golfer.totalScore}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Stack>
        </CardBody>
      </Card>
    </>
  )
}
