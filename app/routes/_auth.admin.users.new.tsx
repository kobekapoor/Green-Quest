import { Card } from '~/components/Card'
import { CardBody, Stack } from '@chakra-ui/react'
import { Role } from '@prisma/client'
import { json, redirect } from '@remix-run/node'
import type { DataFunctionArgs } from '@remix-run/node'
import { withZod } from '@remix-validated-form/with-zod'
import { generate } from 'generate-password'
import { ValidatedForm, validationError } from 'remix-validated-form'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { SubmitButton } from '~/components/SubmitButton'
import { ValidatedInput } from '~/components/ValidatedInput'
import { ValidatedSelect } from '~/components/ValidatedSelect'
import { getUser } from '~/utils/auth.server'
import { prisma } from '~/utils/prisma.server'
import bcrypt from 'bcryptjs'
import { sendSingleEmail } from '~/utils/email.server'
import { NewUserEmail } from '~/emails/NewUser'
import { createId } from '@paralleldrive/cuid2'
import { env } from 'process'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - New User` }]
}

const validator = withZod(
  z.object({
    firstName: zfd.text(),
    lastName: zfd.text(),
    email: zfd.text(z.string().email()),
    mobileNo: zfd.text(),
    role: z.enum([Role.USER, Role.ADMIN]),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin')

  return json({
    breadcrumbs: [
      {
        label: 'Users',
        href: '/admin/users',
      },
      {
        label: 'New User',
        href: '/admin/users/new',
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

  const password = generate({ length: 10, numbers: true })
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNo: data.mobileNo,
      role: data.role,
      password: passwordHash,
      passwordResetToken: createId(),
      
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      passwordResetToken: true,
    },
  })

  await sendSingleEmail({
    to: user.email,
    subject: `Welcome to ${siteName}`,
    component: <NewUserEmail user={user} siteName={siteName} />,
  })

  return redirect('/admin/users')
}

export default function AdminNewUser() {
  return (
    <>
      <Card>
        <CardBody>
          <ValidatedForm validator={validator} method="post">
            <Stack spacing={4}>
              <ValidatedInput name="firstName" label="First Name" isRequired />
              <ValidatedInput name="lastName" label="Last Name" isRequired />
              <ValidatedInput name="email" label="Email" isRequired />
              <ValidatedInput name="mobileNo" label="Mobile" isRequired />
              <ValidatedSelect name="role" label="Role">
                <option value={Role.USER}>User</option>
                <option value={Role.ADMIN}>Admin</option>
              </ValidatedSelect>
              <SubmitButton alwaysShow={true} />
            </Stack>
          </ValidatedForm>
        </CardBody>
      </Card>
    </>
  )
}
