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

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - User Details` }]
}

const validator = withZod(
  z.object({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(z.string().email()),
    mobileNo: zfd.text(),
    role: z.enum([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const checkUser = await getUser(args.request)

  if (!checkUser || (checkUser.role !== Role.ADMIN && checkUser.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  const user = await prisma.user.findUnique({
    where: {
      id: args.params.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      mobileNo: true,
      role: true,
    },
  })

  if (!user) throw new Error('User not found')

  return json({
    user,
    breadcrumbs: [
      {
        label: 'Users',
        href: '/admin/users',
      },
      {
        label: `${user.firstName} ${user.lastName}`,
        href: `/admin/users/${user.id}/details`,
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

  await prisma.user.update({
    where: {
      id: args.params.id,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNo: data.mobileNo,
      role: data.role,
    },
  })

  return redirect(`/admin/users`)
}

export default function AdminUserDetails() {
  const { user } = useLoaderData<typeof loader>()
  return (
    <>
      <Card>
        <CardBody>
          <ValidatedForm
            validator={validator}
            defaultValues={user}
            method="post"
            // resetAfterSubmit={true}
          >
            <Stack spacing={4}>
              <Stack spacing={4} direction="row">
                <ValidatedInput name="firstName" label="First Name" />
                <ValidatedInput name="lastName" label="Last Name" />
              </Stack> 
              <ValidatedInput name="email" label="Email" />
              <ValidatedInput name="mobileNo" label="Mobile" />
              <ValidatedSelect name="role" label="Role">
                <option value={Role.USER}>User</option>
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.SUPER_ADMIN}>Super Admin</option>
              </ValidatedSelect>
              <SubmitButton />
            </Stack>
          </ValidatedForm>
        </CardBody>
      </Card>
    </>
  )
}
