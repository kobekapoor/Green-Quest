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

export function meta({data}) {
  return [{ title: `${data.siteName} - Seasons` }]
}

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN))
    throw redirect('/signin') 

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  const seasons = await prisma.season.findMany({
    select: {
      id: true,
      name: true,
      members: true,
      events: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return json({
    seasons,
    siteName,
    breadcrumbs: [
      {
        label: 'Seasons',
        href: '/admin/seasons',
        isCurrentPage: true,
      },
    ],
  })
}

export default function AdminSeasons() {
  const { seasons } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  return (
    <>
      <Card>
        <CardBody>
          <TableContainer>
            <Table variant={'simple'}>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th>Members</Th>
                  <Th>Events</Th>
                  <Th>
                    <Link to={'new'}>
                      <AddIcon />
                    </Link>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {seasons.map(season => (
                  <Tr
                    key={season.id}
                    onClick={() => navigate(`${season.id}`)}
                    cursor={'pointer'}
                  >
                    <Td>{season.name}</Td>
                    <Td>{season.startDate}</Td>
                    <Td>{season.endDate}</Td>
                    <Td>{season.members.length}</Td>
                    <Td>{season.events.length}</Td>
                    <Td>
                      <ChevronRightIcon />
                    </Td>
                  </Tr>
                ))}
                {seasons.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign={'center'}>
                      No seasons found
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
