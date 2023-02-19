import {
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import { open, message } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Frame from "../../components/frame";
import { Input } from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon, Search2Icon } from "@chakra-ui/icons";

export default function Settings(props) {
  const [config, setConfig] = useState([]);
  useEffect(() => {
    async function getConfig() {
      setConfig(await invoke("from_frontend_get_config"));
      console.log(await invoke("from_frontend_get_config"));
    }

    getConfig();
  }, []);

  return (
    <Frame>
      <VStack alignItems="stretch" w="full" spacing="4">
        {config.map((eachPath, i) => (
          <HStack spacing="2">
            <Input
              value={eachPath.path}
              onChange={(e) => {
                setConfig((prevConfig) =>
                  prevConfig.map((eachPrevConfig, eachPrevConfigIndex) => {
                    if (i === eachPrevConfigIndex) {
                      return e.target.value;
                    } else {
                      return eachPrevConfig;
                    }
                  })
                );
              }}
            />
            <Checkbox
              isChecked={config[i].recursive_mode}
              onChange={() => {
                setConfig((prevConfig) =>
                  prevConfig.map((eachPrevConfig, eachPrevConfigIndex) => {
                    if (eachPrevConfigIndex === i) {
                      eachPrevConfig.recursive_mode =
                        !eachPrevConfig.recursive_mode;
                    }
                    return eachPrevConfig;
                  })
                );
              }}
            >
              Watch Recursively
            </Checkbox>
            <Tooltip label="find other directory">
              <IconButton
                icon={<Search2Icon />}
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
              />
            </Tooltip>
            <Tooltip label="Delete This Directory From List" placement="left">
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={() => {
                  setConfig((prev) =>
                    prev.filter((eachPath, index) => i !== index)
                  );
                }}
              />
            </Tooltip>
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
        <Button
          colorScheme="teal"
          onClick={() => {
            appWindow.emit("applySettings", {
              message: config,
            });
          }}
        >
          Apply Change
        </Button>
      </VStack>
    </Frame>
  );
}
