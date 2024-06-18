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
  Button,
  Select,
} from '@chakra-ui/react'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { AddIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { redirect } from 'remix-typedjson'
import { getUser } from '~/utils/auth.server'
import { Role } from '@prisma/client'
import { useState } from 'react'

export function meta({data}) {
  return [{ title: `${data.siteName} - New Team` }]
}

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request)
  

  return json({
    breadcrumbs: [
      {
        label: 'Teams',
        href: '/team/new',
        isCurrentPage: true,
      },
    ],
  })
}


export const action = async (args: DataFunctionArgs) => {
  const body = await args.request.json();
  const eventId = body.eventId;
  const userId = body.userId;

  console.log('creating team for event with body', body);

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
    },
  })
  
  const currentSeasonId = event?.seasonId;

  const newTeam = await prisma.team.create({
    data: {
      seasonId: currentSeasonId,
      eventId: eventId,
      userId: userId,
    },
  })

  return redirect(`/`);
}

export default function AdminNewTeam() {

  return (
    <>
      
    </>
  )
}
