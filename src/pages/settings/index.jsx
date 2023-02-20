import {
  Button,
  Checkbox,
  Container,
  Divider,
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
  const [config, setConfig] = useState({});
  async function getConfig() {
    const fetchedConfig = await invoke("from_frontend_get_config");
    setConfig(() => ({
      ...fetchedConfig,
    }));
    console.log(fetchedConfig);
  }
  useEffect(() => {
    getConfig();
  }, []);

  return (
    <Frame>
      <VStack alignItems="stretch" w="full" spacing="4">
        {config.watch_paths?.map((eachPath, i) => (
          <HStack spacing="2" key={eachPath.path}>
            <Input
              readOnly
              value={eachPath.path}
              // onChange={(e) => {
              //   setConfig((prevConfig) => ({
              //     ...prevConfig,
              //     watch_paths: prevConfig.watch_paths.map(
              //       (eachPrevConfig, eachPrevConfigIndex) => {
              //         if (i === eachPrevConfigIndex) {
              //           return {
              //             path: e.target.value,
              //             recursive_mode:
              //               prevConfig.watch_paths[i].recursive_mode,
              //           };
              //         } else {
              //           return eachPrevConfig;
              //         }
              //       }
              //     ),
              //   }));
              // }}
            />
            <Checkbox
              isChecked={config.watch_paths[i].recursive_mode}
              onChange={() => {
                setConfig((prevConfig) => ({
                  ...prevConfig,
                  watch_paths: prevConfig.watch_paths.map(
                    (eachPrevConfig, eachPrevConfigIndex) => {
                      if (eachPrevConfigIndex === i) {
                        return {
                          path: eachPrevConfig.path,
                          recursive_mode: !eachPrevConfig.recursive_mode,
                        };
                      } else {
                        return eachPrevConfig;
                      }
                    }
                  ),
                }));
              }}
            >
              Watch Recursively
            </Checkbox>
            <Tooltip label="Find Other Directory">
              <IconButton
                icon={<Search2Icon />}
                onClick={async () => {
                  const selected = await open({
                    directory: true,
                    multiple: false,
                  });
                  console.log(selected);
                  if (selected !== null) {
                    if (
                      config.watch_paths.filter((value) => value === selected)
                        .length !== 0
                    ) {
                      return;
                    }
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      watch_paths: prevConfig.watch_paths.map(
                        (curPrevConfig, index) => {
                          if (i === index) {
                            console.log("rr");
                            console.log(selected);
                            return { path: selected, recursive_mode: false };
                          } else {
                            return curPrevConfig;
                          }
                        }
                      ),
                    }));
                  }
                }}
              />
            </Tooltip>
            <Tooltip label="Delete This Directory From List" placement="left">
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={() => {
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    watch_paths: prevConfig.watch_paths.filter(
                      (_, index) => i !== index
                    ),
                  }));
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
                  config.watch_paths.filter((value) => value === selected[i])
                    .length === 0
                ) {
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    watch_paths: [
                      ...prevConfig.watch_paths,
                      {
                        path: selected[i],
                        recursive_mode: false,
                      },
                    ],
                  }));
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
        <Divider />
        <Button
          colorScheme="teal"
          onClick={() => {
            appWindow.emit("applySettings", {
              message: config,
            }).then(()=>getConfig())
          }}
        >
          Apply Change
        </Button>
      </VStack>
    </Frame>
  );
}
