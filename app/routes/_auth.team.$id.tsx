import { Card } from '~/components/Card'
import { CardBody, Stack } from '@chakra-ui/react'
import { Role } from '@prisma/client'
import { json, redirect } from '@remix-run/node'
import type { DataFunctionArgs } from '@remix-run/node'
import { withZod } from '@remix-validated-form/with-zod'
import { ValidatedForm, validationError } from 'remix-validated-form'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { SubmitButton } from '~/components/SubmitButton'
import { ValidatedInput } from '~/components/ValidatedInput'
import { getUser } from '~/utils/auth.server'
import { prisma } from '~/utils/prisma.server'
import { useLoaderData } from '@remix-run/react'


export function meta({data}) {
  return [{ title: `${data.siteName} - Update Team` }]
}

const validator = withZod(
  z.object({
    golfers: zfd.repeatable(
      z.array(
        z.object({
          id: zfd.text(),
          golferId: zfd.text(),
          enabled: zfd.checkbox(),
        })
      )
    ),
    bench: z.array(zfd.text()).optional(),
    intent: zfd.text().optional(),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  const team = await prisma.team.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      golfers: true,
      bench: true,
    },
  })

  return json({
    siteName,
    team,
    breadcrumbs: [
      {
        label: 'Team',
        href: '/team',
      },
      {
        label: 'Update Team',
        href: '/team/$',
        isCurrentPage: true,
      },
    ],
  })
}

export const action = async (args: DataFunctionArgs) => {
  console.log("ARGS: ", args)

  const checkTeam = await prisma.team.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      golfers: true,
      bench: true,
    },
  })

  const data = JSON.parse(await args.request.text());
  console.log("data: ", data)

  if(data.intent === "addGolfer") {

    if (data.seat === "team" && checkTeam?.golfers.length >= 4) {
      return redirect(`/`);
    }
    if (data.seat === "bench" && checkTeam?.bench.length >= 2) {
      return redirect(`/`);
    }

    if(data.seat === "team") {
      const newGolfers = [...checkTeam.golfers.map(golfer => golfer.id), data.golfer];

      const team = await prisma.team.update({
        where: {
          id: args.params.id,
        },
        data: {
          golfers: {
            connect: newGolfers.map(golferId => ({ id: golferId })),
          },
        }
      })
    }

    if(data.seat === "bench") {
      const newBench = [...checkTeam.bench.map(golfer => golfer.id), data.golfer];

      const team = await prisma.team.update({
        where: {
          id: args.params.id,
        },
        data: {
          bench: {
            connect: newBench.map(golferId => ({ id: golferId })),
          },
        }
      })
    }

    return redirect(`/`)
  }

  if(data.intent === "removeGolfer") {

    if(data.seat === "team") {
    const newGolfers = checkTeam.golfers.map(golfer => golfer.id).filter(golferId => golferId !== data.golfer);

    const team = await prisma.team.update({
      where: {
        id: args.params.id,
      },
      data: {
        golfers: {
          connect: newGolfers.map(golferId => ({ id: golferId })),
          disconnect: [{ id: data.golfer }],
        },
      }
    })
  }

  if(data.seat === "bench") {
    const newBench = checkTeam.bench.map(golfer => golfer.id).filter(golferId => golferId !== data.golfer);

    const team = await prisma.team.update({
      where: {
        id: args.params.id,
      },
      data: {
        bench: {
          connect: newBench.map(golferId => ({ id: golferId })),
          disconnect: [{ id: data.golfer }],
        },
      }
    })
  }

    return redirect(`/`)
  }

  await prisma.team.update({
    where: {
      id: args.params.id,
    },
    data: {
      golfers: {
        set: data.golfers,
      },
      bench: {
        set: data.bench,
      },
    }
  })

  return redirect('/')
}

export default function AdminNewSeason() {
  return (
    <>
      <Card>
        <CardBody>
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              {/*  */}
              <SubmitButton alwaysShow={true} />
            </Stack>
          </ValidatedForm>
        </CardBody>
      </Card>
    </>
  )
}
