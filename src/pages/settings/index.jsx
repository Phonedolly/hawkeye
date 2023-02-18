import {
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { open, message } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Frame from "../../components/frame";
import { Input } from "@chakra-ui/react";
import { DeleteIcon, Search2Icon } from "@chakra-ui/icons";

export default function Settings(props) {
  const [config, setConfig] = useState([]);
  useEffect(() => {
    async function getConfig() {
      setConfig(await invoke("from_frontend_get_config"));
    }
    getConfig();
  }, []);

  return (
    <Frame>
      <VStack alignItems="stretch" w="full" spacing="4">
        {config.map((eachPath, i) => (
          <HStack spacing="3.5">
            <Input value={eachPath} w="full" />
            <Button
              w="56"
              leftIcon={<Search2Icon />}
              onClick={async () => {
                const selected = await open({
                  directory: true,
                  multiple: false,
                });
                if (selected !== null) {
                  setConfig((prevConfig) =>
                    prevConfig.map((curPrevConfig, index) => {
                      if (i === index) {
                        /* path duplicate check */
                        let isDuplicate = false;
                        for (let i = 0; i < prevConfig.length; i++) {
                          if (prevConfig[i] === selected) {
                            isDuplicate = true;
                            break;
                          }
                        }
                        if (isDuplicate === true) {
                          return curPrevConfig;
                        } else {
                          return selected;
                        }
                      } else {
                        return curPrevConfig;
                      }
                    })
                  );
                }
              }}
            >Find Directory</Button>
            <IconButton
              icon={<DeleteIcon />}
              colorScheme="red"
              onClick={() => {
                setConfig((prev) =>
                  prev.filter((eachPath, index) => i !== index)
                );
              }}
            />
          </HStack>
        ))}
        <Button
          onClick={async () => {
            const selected = await open({
              directory: true,
              multiple: true,
            });
            if (selected !== null) {
              // to use async function, use for loop
              for (let i = 0; i < selected.length; i++) {
                if (
                  config.filter((value) => value === selected[i]).length === 0
                ) {
                  setConfig((prevConfig) => prevConfig.concat(selected[i]));
                } else {
                  await message(`${selected[i]} is alread exists!`, {
                    title: "Tauri",
                    type: "warning",
                  });
                }
              }
            }
          }}
        >
          Add Path
        </Button>
        <Button colorScheme="teal">Apply Change</Button>
      </VStack>
    </Frame>
  );
}
