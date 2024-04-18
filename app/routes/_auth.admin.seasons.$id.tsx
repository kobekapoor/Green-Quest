import type { DataFunctionArgs } from '@remix-run/node'
import { redirect, json } from '@remix-run/node'
import { prisma } from '~/utils/prisma.server'
import { Card } from '~/components/Card'
import { CardBody, Stack } from '@chakra-ui/react'
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
  return [{ title: `${data.siteName} - Season Details` }]
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

  const season = await prisma.season.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      name: true,
      events: true,
      members: true,
    },
  })

  if (!season) throw new Error('User not found')

  return json({
    season,
    siteName,
    breadcrumbs: [
      {
        label: 'Seasons',
        href: '/admin/seasons',
      },
      {
        label: `${season.name}`,
        href: `/admin/seasons/${season.id}`,
        isCurrentPage: true,
      },
    ],
  })
}

export const action = async (args: DataFunctionArgs) => {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  await prisma.season.update({
    where: {
      id: args.params.id,
    },
    data: {
      name: data.name,
    },
  })

  return redirect(`/admin/seasons`)
}

export default function AdminSeasonDetails() {
  const { season } = useLoaderData<typeof loader>()
  return (
    <>
      <Card>
        <CardBody>
          <ValidatedForm
            validator={validator}
            defaultValues={season}
            method="post"
            // resetAfterSubmit={true}
          >
            <Stack spacing={4}>
              
              <ValidatedInput name="name" label="Name" />
              
              <SubmitButton />
            </Stack>
          </ValidatedForm>
        </CardBody>
      </Card>
    </>
  )
}
