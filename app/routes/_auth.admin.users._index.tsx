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
} from '@chakra-ui/react'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { AddIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { redirect } from 'remix-typedjson'
import { getUser } from '~/utils/auth.server'
import { Role } from '@prisma/client'
import { useState } from 'react'
import { BsEraserFill } from 'react-icons/bs'
import { env } from 'process'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - Users` }]
}

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin') 


  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      mobileNo: true,
    },
    orderBy: {
      lastName: 'asc',
    },
  })

  return json({
    users,
    breadcrumbs: [
      {
        label: 'Users',
        href: '/admin/users',
        isCurrentPage: true,
      },
    ],
  })
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const filteredUsers = users.filter(
    user =>
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.mobileNo.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <>
      <Card>
        <CardBody>
          <InputGroup>
            <Input
              placeholder={'Search'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <InputRightElement
                onClick={() => setSearch('')}
                cursor={'pointer'}
              >
                <Icon as={BsEraserFill} />
              </InputRightElement>
            )}
          </InputGroup>
          <TableContainer>
            <Table variant={'simple'}>
              <Thead>
                <Tr>
                  <Th>First Name</Th>
                  <Th>Last Name</Th>
                  <Th>Email</Th>
                  <Th>Mobile</Th>
                  <Th>
                    <Link to={'new'}>
                      <AddIcon />
                    </Link>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map(user => (
                  <Tr
                    key={user.id}
                    onClick={() => navigate(`${user.id}/details`)}
                    cursor={'pointer'}
                  >
                    <Td>{user.firstName}</Td>
                    <Td>{user.lastName}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.mobileNo}</Td>
                    <Td>
                      <ChevronRightIcon />
                    </Td>
                  </Tr>
                ))}
                {filteredUsers.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign={'center'}>
                      No users found
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
