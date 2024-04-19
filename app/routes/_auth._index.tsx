// Import necessary libraries and components
import { json, redirect } from '@remix-run/node';
import type { DataFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { getUser } from '~/utils/auth.server';
import { prisma } from '~/utils/prisma.server';
import { Box, Button, Card, CardBody, CardFooter, CardHeader, Checkbox, Flex, FormControl, FormLabel, Grid, GridItem, HStack, Heading, Input, Spacer, Stack, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, useBreakpointValue } from '@chakra-ui/react';
import { env } from 'process'
import type { ToDo } from '@prisma/client';
import { z } from 'zod';
import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { ValidatedForm, validationError } from 'remix-validated-form';
import { ValidatedInput } from '~/components/ValidatedInput';
import { ValidatedTextarea } from '~/components/ValidatedTextarea';
import { SubmitButton } from '~/components/SubmitButton';
import { useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@chakra-ui/react";
import { ValidatedCheckbox } from '~/components/ValidatedCheckbox';
import { set } from 'date-fns';
import { FaTrash } from 'react-icons/fa';

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

const golfValidator = withZod(
  z.object({
    golfer: zfd.text().optional(),
    intent: zfd.text().optional(),
  })
)

export const loader = async (args: DataFunctionArgs) => {
  const user = await getUser(args.request);
  if (!user) {
    throw redirect('/signin');
  }

  const team = await prisma.team.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      golfers: true,
      bench: true,
    },
  });

  const golfers = await prisma.golfer.findMany({
    select: {
      id: true,
      name: true,
      salary: true,
    },
  });

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  console.log("TEAM: ", team)
  
  return json({ user, siteName, team, golfers });
};

export async function action(args: DataFunctionArgs) {
  const { data, error } = await validator.validate(
    await args.request.formData()
  )

  const user = await getUser(args.request)
  if (!user) throw new Error('User not found')

  if (error) return validationError(error)
  
  return null
}

export default function index() {
  const { user, team, golfers } = useLoaderData<typeof loader>()
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGolfer, setSelectedGolfer] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>("team");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);

  const handleAddGolfer = (seat) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedGolfer(null);
    setIsModalOpen(false);
  };
    
  const addGolfer = async () => {
    setIsModalOpen(false);
    const response = await fetch(`/team/${team.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        intent: "addGolfer",
        seat: selectedSeat,
        golfer: selectedGolfer 
      }),
    });

    if (response.ok) {
      window.location.reload();
    } else {
      // Handle error
    }
      setSelectedGolfer(null);
  };

  const removeGolfer = async (golferId, seat) => {

    try {
      const response = await fetch(`/team/${team.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          intent: "removeGolfer",
          seat: seat,
          golfer: golferId 
        }),
      });
  
      console.log('Response', response);
  
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Error removing golfer', response.statusText);
      }
    } catch (error) {
      console.error('Error removing golfer', error);
    }
  };

  var spent = team.golfers.reduce((total, golfer) => total + Number(golfer.salary), 0);
  spent += team.bench.reduce((total, golfer) => total + Number(golfer.salary), 0);

  const remainingSalary = (Number(100) - spent).toFixed(2);

  const sortedGolfers = golfers.sort((a, b) => b.salary - a.salary);

  return (
    <Box width="100%">
      <Stack spacing={10}>
        <Heading size="lg">Welcome, {user.firstName}</Heading>
        <Flex dir={["row", "column"]}>
          <Box width="33%">
            <Heading fontSize="large">Leaderboard</Heading>
            <Flex marginY={6} dir="row">
              <Button
                  onClick={() => setIsLeaderboardOpen(true)}
                  colorScheme={isLeaderboardOpen ? "blue" : undefined}
                  variant={isLeaderboardOpen ? "solid" : "outline"}
                >
                  Leaderboard
                </Button>
                <Spacer />
                <Button
                  onClick={() => setIsLeaderboardOpen(false)}
                  colorScheme={!isLeaderboardOpen ? "blue" : undefined}
                  variant={!isLeaderboardOpen ? "solid" : "outline"}
                >
                  Season Standings
                </Button>
            </Flex>
            {isLeaderboardOpen ? (
              <Card>
                <CardHeader>
                  <Heading fontSize="medium">
                    RBC Heritage
                  </Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={2}>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th p={2}>Rank</Th>
                          <Th p={2}>Team</Th>
                          <Th p={2}>Score</Th>
                          <Th p={2}></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td p={2}>1</Td>
                          <Td p={2}>Kobe K</Td>
                          <Td p={2}>-18</Td>
                          <Td p={2}>
                            <Button width="100%">View Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>2</Td>
                          <Td p={2}>Jay P</Td>
                          <Td p={2}>-16</Td>
                          <Td p={2}>
                            <Button width="100%">View Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>3</Td>
                          <Td p={2}>Ethan K</Td>
                          <Td p={2}>-15</Td>
                          <Td p={2}>
                            <Button width="100%">View Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>4</Td>
                          <Td p={2}>Ellis V</Td>
                          <Td p={2}>-14</Td>
                          <Td p={2}>
                            <Button width="100%">View Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>5</Td>
                          <Td p={2}>John J</Td>
                          <Td p={2}>-13</Td>
                          <Td p={2}>
                            <Button width="100%">View Team</Button>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Stack>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <Heading fontSize="medium">
                    Season Standings
                  </Heading>
                </CardHeader>
                <CardBody>
                <Stack spacing={2}>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th p={2}>Rank</Th>
                          <Th p={2}>Team</Th>
                          <Th p={2}>Score</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        
                        <Tr>
                          <Td p={2}>1</Td>
                          <Td p={2}>Jay P</Td>
                          <Td p={2}>-145</Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>2</Td>
                          <Td p={2}>Kobe K</Td>
                          <Td p={2}>-125</Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>3</Td>
                          <Td p={2}>Ellis V</Td>
                          <Td p={2}>-122</Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>4</Td>
                          <Td p={2}>Ethan K</Td>
                          <Td p={2}>-110</Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>5</Td>
                          <Td p={2}>John J</Td>
                          <Td p={2}>-101</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Stack>
                </CardBody>
              </Card>
            )}
          </Box>

          <Spacer mx={10} />

          <Box width="62%">
            <Box>
              <HStack>
                <Heading size="md" mb={6}>Team</Heading>
                <Spacer />
                <Text>Remaining Salary: ${remainingSalary}m</Text>
              </HStack>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {team.golfers.map((golfer) => (
                  <GridItem key={golfer.id}>
                    <Card>
                      <CardBody>
                        <Stack spacing={4}>
                          <Text>{golfer.name}</Text>
                          <Text>${golfer.salary}m</Text>
                          <Flex>
                            <Button colorScheme='blue' onClick={() => removeGolfer(golfer.id, "bench")}>Swap to Bench</Button>
                            <Spacer />
                            <Button colorScheme='red' onClick={() => removeGolfer(golfer.id, "team")}>
                              <FaTrash />
                            </Button>
                          </Flex>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
                {Array.from({ length: 4 - team.golfers.length }).map((_, index) => (
                  <GridItem key={index}>
                    <Card>
                      <CardHeader>No Golfer</CardHeader>
                      <CardBody>
                        <Button onClick={() => handleAddGolfer("team")}>Add Golfer</Button>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </Box>

            <Box mt={6}>
              <Heading size="md" mb={6}>Bench</Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {team.bench.map((golfer) => (
                  <GridItem key={golfer.id}>
                    <Card>
                      <CardBody>
                        <Stack spacing={4}>
                          <Text>{golfer.name}</Text>
                          <Text>${golfer.salary}m</Text>
                          <Flex>
                          <Button colorScheme='blue' onClick={() => removeGolfer(golfer.id, "bench")}>Swap to Team</Button>
                          <Spacer />
                            <Button colorScheme='red' onClick={() => removeGolfer(golfer.id, "bench")}>
                              <FaTrash />
                            </Button>
                          </Flex>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
                {Array.from({ length: 2 - team.bench.length }).map((_, index) => (
                  <GridItem key={index}>
                    <Card>
                      <CardHeader>No Golfer</CardHeader>
                      <CardBody>
                        <Button onClick={() => handleAddGolfer("bench")}>Add Golfer</Button>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          </Box>
        </Flex>

        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Golfer</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Select Golfer</FormLabel>
                <Stack spacing={2}>
                  {sortedGolfers.map((golfer) => {
                    const isOnTeam = team.golfers.some(teamGolfer => teamGolfer.id === golfer.id);
                    const isOnBench = team.bench.some(benchGolfer => benchGolfer.id === golfer.id);
                    const shouldDisable = isOnTeam || isOnBench;

                    const tooExpensive = !shouldDisable && Number(golfer.salary) > remainingSalary;

                    return (
                      <Card px={4} py={2} width={'100%'} backgroundColor="gray.600" color={tooExpensive ? 'red' : undefined}>
                        <Checkbox
                          name={golfer.id}
                          key={golfer.id}
                          isChecked={selectedGolfer === golfer.id}
                          onChange={() => setSelectedGolfer(golfer.id)}
                          borderColor={'gray.500'}
                          width={'100%'}
                          disabled={shouldDisable || tooExpensive}
                        >
                          ${golfer.salary}m - {golfer.name}
                        </Checkbox>
                      </Card>
                    );
                  })}
                </Stack>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={addGolfer}>
                Add
              </Button>
              <Button onClick={handleCloseModal}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Stack>
    </Box>
  );
}
