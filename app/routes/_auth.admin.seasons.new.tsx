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


export function meta({data}) {
  return [{ title: `${data.siteName} - New Season` }]
}

const validator = withZod(
  z.object({
    name: zfd.text(),
    startDate: zfd.text(),
    endDate: zfd.text(),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  return json({
    siteName,
    breadcrumbs: [
      {
        label: 'Seasons',
        href: '/admin/seasons',
      },
      {
        label: 'New Season',
        href: '/admin/seasons/new',
        isCurrentPage: true,
      },
    ],
  })
}

export const action = async (args: DataFunctionArgs) => {
  const checkUser = await getUser(args.request)

  if (!checkUser || (checkUser.role !== Role.ADMIN && checkUser.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  if (error) return validationError(error)

  const season = await prisma.season.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    select: {
      name: true,
      startDate: true,
      endDate: true,
    },
  })

  return redirect('/admin/seasons')
}

export default function AdminNewSeason() {
  return (
    <>
      <Card>
        <CardBody>
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              <ValidatedInput name="name" label="Name" isRequired />
              <ValidatedInput name="startDate" label="Start Date" type="date" isRequired />
              <ValidatedInput name="endDate" label="End Date" type="date" isRequired />
              <SubmitButton alwaysShow={true} />
            </Stack>
          </ValidatedForm>
        </CardBody>
      </Card>
    </>
  )
}
