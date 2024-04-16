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

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - Home` }]
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

  const toDos = await prisma.toDo.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      isCompleted: true,
    },
  });

  return json({ user, toDos });
};

export async function action(args: DataFunctionArgs) {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  const user = await getUser(args.request)
  if (!user) throw new Error('User not found')

  if (error) return validationError(error)

  console.log(data)

  if (data.intent === 'delete') {
    await prisma.toDo.delete({
      where: {
        id: data.id,
      },
    });
  } else {
    await prisma.toDo.create({
      data: {
        title: data.title ?? '',
        description: data.description,
        userId: user.id,
      },
    });
  }
  
  return null
}

export default function index() {
  const { toDos, user } = useLoaderData<typeof loader>()
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box width="100%">
      <Stack spacing={10}>
        <Heading size="lg">Welcome, {user.firstName}</Heading>
        <Box>
          
          <Heading size="md" mb={5}>
            Your To Dos
          </Heading>
          
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {toDos.map((toDo) => (
                <Tr key={toDo.id}>
                  
                  <Td>{toDo.title}</Td>
                  <Td>{toDo.description}</Td>
                  <Td>
                    <ValidatedForm validator={validator} method="post">
                      <Input type="hidden" name="id" value={toDo.id} />
                      <Button colorScheme="red" name="intent" value="delete" type="submit">Delete</Button>
                    </ValidatedForm>
                  </Td>
                  
                </Tr>
              ))}
            </Tbody>
          </Table> 
        </Box>
        
        <Card>
          <CardHeader>
            <Heading size="md">
              Add a new To Do
            </Heading>
          </CardHeader>
          <CardBody>
            <ValidatedForm validator={validator} method="post">
              <HStack spacing={4}>
                <FormControl>
                  <HStack spacing={4} alignItems="start">
                    <ValidatedInput placeholder="Title" name="title" label="Title" />
                    <ValidatedTextarea placeholder="Description" name="description" label="Description" />
                  </HStack>
                </FormControl>
                <Button colorScheme="blue" type="submit">Add</Button>
              </HStack> 
            </ValidatedForm>
          </CardBody>
        </Card>
      </Stack>
    </Box>
  );
}
