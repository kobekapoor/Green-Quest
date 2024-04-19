import type { DataFunctionArgs } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import { prisma } from '~/utils/prisma.server'
import { Card } from '~/components/Card'
import { Button, CardBody, Stack } from '@chakra-ui/react'
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

    },
  })

  if (!event) throw new Error('User not found')

  return json({
    event,
    siteName,
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

  const event = await prisma.event.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      name: true,
    },
  })

  const performances = await prisma.performance.findMany({
    where: {
      eventId: args.params.id,
    },
    select: {
      id: true,
      golfer: {
        select: {
          id: true,
          espnId: true,
        },
      },
      status: true,
      teeTime: true,
      day: true,
      score: true,
    },
  })
  
  const response = await fetch(`https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&region=au&lang=en&event=${args.params.id}&showAirings=buy%2Clive&buyWindow=1m`);
  const data = await response.json();

  const leaderboard = data?.events[0].competitions[0].competitors.map((competitor: any) => {
    const linescores = competitor.linescores.map((line: any) => ({
      round: line.period,
      score: line.displayValue,
      teeTime: new Date(line.teeTime),
      status: line.value ? 'completed' : new Date() > new Date(line.teeTime) ? 'inprogress' : 'notStarted',
    }));

    return {
      id: competitor.id,
      name: competitor.athlete.displayName,
      linescores,
    };
  });

  console.log(leaderboard)
  console.log(leaderboard[0].linescores[0])

  return redirect(`/admin/events/${args.params.id}`)
}

export default function AdminEventDetails() {
  const { event } = useLoaderData<typeof loader>()


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

  return (
    <>
      <Button mb={4} onClick={RefreshEvent}>Refresh Event</Button>
      <Card>
        
      </Card>
    </>
  )
}
