import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect } from "react";
import Image from "next/image";
import reactLogo from "../assets/react.svg";
import tauriLogo from "../assets/tauri.svg";
import nextLogo from "../assets/next.svg";
import {
  Button,
  Container,
  Fade,
  Flex,
  Heading,
  Highlight,
  HStack,
  IconButton,
  ScaleFade,
  Table,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { SettingsIcon } from "@chakra-ui/icons";
import { v4 as uuid } from "uuid";
import SideBar from "../components/sidebar";
import Frame from "../components/frame";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [config, setConfig] = useState({});
  const [configFetched, setConfigFetched] = useState(false);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    let clearer;
    async function getConfig() {
      const fetchedConfig = await invoke("from_frontend_get_config");
      setConfig(() => ({
        ...fetchedConfig,
      }));
      setConfigFetched(true);
    }
    if (!configFetched) {
      getConfig();
    }
  }, []);

  if (configFetched)
    return (
      <Frame>
        <ScaleFade initialScale={0.9} in={true}>
          <VStack align="start" spacing="12">
            <VStack align="start" spacing="4">
              <HStack>
                <Heading size="4xl">🔭</Heading>
                <VStack align="start" spacing="1">
                  <Heading size="3xl" color="">
                    <b>{config.watch_paths.length}</b> Directories
                  </Heading>
                  <Heading size="lg">are Being Watched.</Heading>
                </VStack>
              </HStack>
              <VStack align="start" pl="2">
                {config.watch_paths.map((eachPath) => (
                  <Text fontStyle="italic" fontWeight="bold" color="grey" textAlign="start">
                    {eachPath.path}
                  </Text>
                ))}
              </VStack>
            </VStack>

            <VStack w="full" align="start">
              <HStack>
                <Heading size="3xl">➡️</Heading>
                <VStack align="start">
                  <Heading>{config.conversion_maps.length} Formats</Heading>
                  <Heading size="md">are Being Converted.</Heading>
                </VStack>
              </HStack>
              <Table>
                {config.conversion_maps.map((eachMap) => (
                  <Tr key={uuid()}>
                    <Td>
                      <Heading size="md">{eachMap.src}</Heading>
                    </Td>
                    <Td>
                      <Heading size="lg">➡️</Heading>
                    </Td>
                    <Td>
                      <Heading size="md">{eachMap.dst}</Heading>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </VStack>
          </VStack>
        </ScaleFade>
      </Frame>
    );
}

export default App;
