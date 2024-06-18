// Import necessary libraries and components
import { json, redirect } from '@remix-run/node';
import type { DataFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { getUser } from '~/utils/auth.server';
import { prisma } from '~/utils/prisma.server';
import { Box, Button, Card, CardBody, CardFooter, CardHeader, Checkbox, Flex, FormControl, FormLabel, Grid, GridItem, HStack, Heading, Input, Spacer, Stack, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, useBreakpointValue, Image, SimpleGrid } from '@chakra-ui/react';
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
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useColorModeValue } from "@chakra-ui/react";
import { ValidatedCheckbox } from '~/components/ValidatedCheckbox';
import { set } from 'date-fns';
import { FaTrash } from 'react-icons/fa';
import { css, Global } from '@emotion/react';
import { Head } from '@react-email/components';
import { format } from 'date-fns';

export function meta({data}) {
  return [{ title: `${data.siteName} - Home` }]
}

// Define global styles for animations
const glowAnimation = css`
  @keyframes glow {
    0% {
      box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
    }
    50% {
      box-shadow: 0 0 12px rgba(0, 255, 0, 0.8);
    }
    100% {
      box-shadow: 0 0 12px rgba(0, 255, 0, 0.2);
    }
  }
`;


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
  
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    }
  });
  
  // Sort the events by the closest endDate to today
  const sortedEvents = events.sort((a, b) => 
    Math.abs(a.endDate - new Date()) - Math.abs(b.endDate - new Date())
  );
  
  // Get the event with the closest endDate
  const currentEvent = sortedEvents[0];
  const nextEvent = sortedEvents.find(event => event.startDate > new Date());

  const event = await prisma.event.findFirst({
    where: {
      id: currentEvent.id,
    },
    orderBy: {
      endDate: 'asc',
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      golfers: {
        select: {
          id: true,
          name: true,
          salary: true,
          pictureLink: true,
          performances: {
            select: {
              id: true,
              status: true,
              teeTime: true,
              day: true,
              score: true,
              holesPlayed: true,
            },
            where: {
              eventId: currentEvent.id,
            },
          },
        }
      },
      teams: {
        select: {
          id: true,
          golfers: {
            select: {
              id: true,
              name: true,
              salary: true,
              pictureLink: true,
              performances: {
                select: {
                  id: true,
                  status: true,
                  teeTime: true,
                  day: true,
                  score: true,
                  holesPlayed: true,
                },
                where: {
                  eventId: currentEvent.id,
                },
              },
            },
          },
          bench: {
            select: {
              id: true,
              name: true,
              salary: true,
              pictureLink: true,
              performances: {
                select: {
                  id: true,
                  status: true,
                  teeTime: true,
                  day: true,
                  score: true,
                  holesPlayed: true,
                },
                where: {
                  eventId: currentEvent.id,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    }
  });

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

  return json({ user, siteName, event, nextEvent });
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
  const { user, event, nextEvent } = useLoaderData<typeof loader>()
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [team, setTeam] = useState(event?.teams.find(team => team.user.id === user.id));
  const golfers = event?.golfers; 

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
  
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Error removing golfer', response.statusText);
      }
    } catch (error) {
      console.error('Error removing golfer', error);
    }
  };

  const handleAddTeam = async () => {
    try {
      const response = await fetch(`/team/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          eventId: event.id
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Error adding team', response.statusText);
      }
    } catch (error) {
      console.error('Error adding team', error);
    }
  }

  var spent = team?.golfers.reduce((total, golfer) => total + Number(golfer.salary), 0);
  spent += team?.bench.reduce((total, golfer) => total + Number(golfer.salary), 0);

  const remainingSalary = (Number(100) - spent).toFixed(2);

  const sortedGolfers = golfers.sort((a, b) => b.salary - a.salary);

  return (
    <Box width="100%" p={6}>
      <Global styles={glowAnimation} />
      <Stack spacing={10}>
        <Flex width="100%" direction="row">
          <Heading size="lg">Welcome, {user.firstName}</Heading>
          <Spacer />
          <Heading size="medium">Next event: {nextEvent.name} - {format(new Date(nextEvent.startDate), 'dd/MM/yyyy')}</Heading>
        </Flex>
        <Flex direction={["column",  "column", "row"]}>
          <Box width={["100%", "100%", "33%"]}>
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
                <CardBody>
                  <Stack spacing={4}>
                  <Heading fontSize="larger">
                    {event.name}
                  </Heading>
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
                          <Button fontSize={[12, 12, 16]} width="100%">Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>2</Td>
                          <Td p={2}>Jay P</Td>
                          <Td p={2}>-16</Td>
                          <Td p={2}>
                          <Button fontSize={[12, 12, 16]} width="100%">Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>3</Td>
                          <Td p={2}>Ethan K</Td>
                          <Td p={2}>-15</Td>
                          <Td p={2}>
                          <Button fontSize={[12, 12, 16]} width="100%">Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>4</Td>
                          <Td p={2}>Ellis V</Td>
                          <Td p={2}>-14</Td>
                          <Td p={2}>
                          <Button fontSize={[12, 12, 16]} width="100%">Team</Button>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td p={2}>5</Td>
                          <Td p={2}>John J</Td>
                          <Td p={2}>-13</Td>
                          <Td p={2}>
                            <Button fontSize={[12, 12, 16]} width="100%">Team</Button>
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

          <Spacer mx={10} my={[6, 6, 0]} />

          <Box width={["100%", "100%", "62%"]}>
            <Box>
              <HStack>
                <Heading size="md" mb={6}>Team</Heading>
                <Spacer />
                <Text>Remaining Salary: ${remainingSalary}m</Text>
              </HStack>

              {team ? (
                <SimpleGrid minChildWidth='340px' gap={4}>
                {team.golfers.map((golfer) => {

                const currentStatus = golfer.performances[golfer.performances.length - 1].status;

                  // Optional: Define the glow style conditionally
                const glowStyle = currentStatus === "STATUS_IN_PROGRESS" ? {
                  animation: 'glow 3s ease-in-out infinite',
                } : {};

                return (
                  <GridItem key={golfer.id}>
                    <Card>
                      <CardBody>
                        <Stack spacing={4}>
                          
                          <HStack spacing={8}>
                            <Flex   boxShadow="inset 0 0 12px rgba(0, 0, 0, 0.8)" 
                              border="6px solid" // Sets the border thickness
                              borderColor={currentStatus === "STATUS_IN_PROGRESS" ? "green.300" : "blue.300"} // Sets the border color based on the current status
                            // This adds an inner shadow
                              style={glowStyle}
  boxSize={32} backgroundColor="white" borderRadius="full" overflow="hidden" alignContent="center">
                              <Image src={golfer.pictureLink} alt={golfer.name} width={32} objectFit="cover" objectPosition="bottom" />
                            </Flex>
                            <Stack>
                              <Text fontSize="larger" fontWeight="bold">{golfer.name}</Text>
                              <Text fontSize="large" fontStyle="italic">${golfer.salary}m</Text>
                            </Stack>
                          </HStack>
                            
                            <Table size="small" fontSize="medium">
                              <Tr>
                                <Th>Round</Th>
                                <Th>Status</Th>
                                <Th>Score</Th>
                              </Tr>
                              {golfer.performances.map((performance) => {

                                let timeToTee: number | undefined;
                                if (performance.teeTime) {
                                  timeToTee = new Date().getTime() - new Date(performance.teeTime).getTime();
                                }

                                if(performance.status === 'STATUS_FINISH'){
                                return (
                                <Tr key={performance.id}>
                                  <Td>{performance.day}</Td>
                                  <Td>Completed</Td>
                                  <Td>{performance.score > 0 ? `+${performance.score}` : performance.score}</Td>
                                </Tr>
                                )
                              } else if(performance.status === 'STATUS_IN_PROGRESS'){
                                return(
                                  <Tr key={performance.id}>
                                  <Td>{performance.day}</Td>
                                  <Td>Thru {performance.holesPlayed}</Td>
                                  <Td>{performance.score > 0 ? `+${performance.score}` : performance.score}</Td>
                                </Tr>
                                )
                              } else {
                                return (
                                  <Tr key={performance.id}>
                                    <Td>{performance.day}</Td>
                                    <Td>Teeing off in {timeToTee}</Td>
                                    <Td></Td>
                                  </Tr>
                                )
                              }
                              })}
                            </Table>

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
                )
                })}
                {Array.from({ length: 4 - team?.golfers.length }).map((_, index) => (
                  <GridItem key={index}>
                    <Card>
                      <CardHeader>No Golfer</CardHeader>
                      <CardBody>
                        <Button onClick={() => handleAddGolfer("team")}>Add Golfer</Button>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </SimpleGrid>
              ) : (
                <Button onClick={() => handleAddTeam()}>Add Team</Button>
              )}              
            </Box>

            <Box mt={6}>
              <Heading size="md" mb={6}>Bench</Heading>
              <SimpleGrid  minChildWidth='340px' gap={4}>
                {team?.bench.map((golfer) => (
                  <GridItem key={golfer.id}>
                    <Card>
                      <CardBody>
                        <Stack spacing={4}>
                          <Flex direction="row">
                            <Text fontSize="large">{golfer.name}</Text>
                            <Spacer />
                            <Text fontSize="medium">${golfer.salary}m</Text>
                          </Flex>
                          
                          <HStack spacing={8}>
                          <Flex   boxShadow="inset 0 0 12px rgba(0, 0, 0, 0.8)" 
                            border="6px solid" // Sets the border thickness
                            borderColor="blue.300" // Sets the border color, adjust as needed
                          // This adds an inner shadow
 boxSize={32} backgroundColor="white" borderRadius="full" overflow="hidden" alignContent="center">
                            <Image src={golfer.pictureLink} alt={golfer.name} width={32} objectFit="cover" objectPosition="bottom" />
                          </Flex>
                          <Stack>
                          
                            {golfer.performances.map((performance) => {
                              if (performance.status === 'STATUS_FINISH') {
                                return (
                                  <Text key={performance.id}>Round {performance.day}: {performance.score > 0 ? `+${performance.score}` : performance.score}</Text>
                                );
                              } else {
                                return <Text key={performance.id}>Round {performance.day}: Not Started</Text>;
                              }
                            })}
                            
                          </Stack>
                          </HStack>
                          <Flex>
                            <Button colorScheme='blue' onClick={() => removeGolfer(golfer.id, "team")}>Swap to Team</Button>
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
                {Array.from({ length: 2 - team?.bench.length }).map((_, index) => (
                  <GridItem key={index}>
                    <Card>
                      <CardHeader>No Golfer</CardHeader>
                      <CardBody>
                        <Button onClick={() => handleAddGolfer("bench")}>Add Golfer</Button>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </SimpleGrid>
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
                    const isOnTeam = team?.golfers.some(teamGolfer => teamGolfer.id === golfer.id);
                    const isOnBench = team?.bench.some(benchGolfer => benchGolfer.id === golfer.id);
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
