// Import necessary libraries and components
import { json, redirect } from '@remix-run/node';
import type { DataFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { getUser } from '~/utils/auth.server';
import { prisma } from '~/utils/prisma.server';
import { Box, Button, Card, CardBody, CardHeader, Flex, FormControl, FormLabel, HStack, Heading, Input, Spacer, Stack, Table, Tbody, Td, Textarea, Th, Thead, Tr, useBreakpointValue } from '@chakra-ui/react';
import { env } from 'process'
import type { ToDo } from '@prisma/client';
import { z } from 'zod';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { ValidatedInput } from '~/components/ValidatedInput';
import { ValidatedTextarea } from '~/components/ValidatedTextarea';
import { SubmitButton } from '~/components/SubmitButton';

export function meta({data}) {

  return [{ title: `${data.siteName} - Home` }]
}

const validator = withZod(
  z.object({
    intent: zfd.text().optional(),
    id: zfd.text().optional(),
    title: zfd.text().optional(),
    description: zfd.text().optional(),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request);
  if (!user) {
    throw redirect('/signin');
  }

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  return json({ user, siteName });
};

export async function action(args: DataFunctionArgs) {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  const user = await getUser(args.request)
  if (!user) throw new Error('User not found')

  if (error) return validationError(error)

  console.log(data)
  
  return null
}

export default function index() {
  const { user } = useLoaderData<typeof loader>()
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box width="100%">
      <Stack spacing={10}>
        <Heading size="lg">Welcome, {user.firstName}</Heading>
        
        <Box>

          <Heading size="md">Season</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Events</Th>
              </Tr>
            </Thead>
            
          </Table>

        </Box>

      </Stack>
    </Box>
  );
}
