import { Card } from '~/components/Card'
import { Button, CardBody, Text } from '@chakra-ui/react'
import { Role } from '@prisma/client'
import { json, redirect } from '@remix-run/node'
import type { DataFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import cuid from 'cuid'
import { getUser } from '~/utils/auth.server'
import { prisma } from '~/utils/prisma.server'
import { env } from 'process'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - DB` }]
}

const migrationToken = 'clj2ixj30000008l18101588a' //https://www.getuniqueid.com/cuid
const migrationName = 'Add iCal Token to Publishers'

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || user.role !== Role.SUPER_ADMIN) throw redirect('/signin')

  const migrationHistory = await prisma.dataMigrationHistory.findUnique({
    where: {
      token: migrationToken,
    },
    select: {
      id: true,
    },
  })

  return json({
    hasMigration: migrationHistory === null,
    breadcrumbs: [
      { label: 'DB Maintenance', href: '/superadmin/db', isCurrentPage: true },
    ],
  })
}

export const action = async ({ request }: DataFunctionArgs) => {
  // const publishers = await prisma.publisher.findMany({
  //   where: {
  //     iCalToken: null,
  //   },
  //   select: {
  //     id: true,
  //   },
  // })

  // await Promise.all(
  //   publishers.map(async publisher => {
  //     await prisma.publisher.update({
  //       where: {
  //         id: publisher.id,
  //       },
  //       data: {
  //         iCalToken: cuid(),
  //       },
  //     })
  //   })
  // )

  // await prisma.dataMigrationHistory.create({
  //   data: {
  //     token: migrationToken,
  //     name: migrationName,
  //   },
  // })

  return redirect('/superadmin/db')
}

export default function SuperAdminCities() {
  const { hasMigration } = useLoaderData<typeof loader>()
  return (
    <>
      <Card>
        <CardBody>
          <Form method="POST">
            {hasMigration && <Button type="submit">{migrationName}</Button>}
            {!hasMigration && <Text>No pending migrations.</Text>}
          </Form>
        </CardBody>
      </Card>
    </>
  )
}
