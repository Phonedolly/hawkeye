import {
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Select,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { open, message } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import Frame from "../../components/frame";
import { Input } from "@chakra-ui/react";
import { DeleteIcon, Search2Icon } from "@chakra-ui/icons";
import { v4 as uuid } from "uuid";
import dynamic from "next/dynamic";

const formats = [
  "APNG",
  "AVIF",
  "GIF",
  "JPEG",
  "PNG",
  "SVG",
  "WebP",
  "BMP",
  "ICO",
  "TIFF",
];

export default function Settings(props) {
  const [config, setConfig] = useState({});
  const [modified, setModified] = useState(false);
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
          <HStack spacing="2" key={uuid()}>
            <Input readOnly value={eachPath.path} />
            <Checkbox
              isChecked={config.watch_paths[i].recursive_mode}
              onChange={() => {
                setModified(true);
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
                  if (selected !== null) {
                    if (
                      config.watch_paths.filter((value) => value === selected)
                        .length !== 0
                    ) {
                      return;
                    }
                    setModified(true);
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      watch_paths: prevConfig.watch_paths.map(
                        (curPrevConfig, index) => {
                          if (i === index) {
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
                  setModified(true);
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
            setModified(true);
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
        <HStack justifyContent="space-evenly" pr="8">
          <Heading size="sm">Input Format</Heading>
          <Heading size="sm">➡️</Heading>
          <Heading size="sm">Output Format</Heading>
        </HStack>
        {config.conversion_maps?.map(
          (eachConversionMap, eachConversionMapIndex) => (
            <HStack>
              <Select
                key={uuid()}
                value={eachConversionMap.src || "WebP"}
                onChange={(e) => {
                  setModified(true);
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    conversion_maps: prevConfig.conversion_maps.map(
                      (eachConversionMapping, eachConversionMappingIndex) => {
                        if (
                          eachConversionMapIndex === eachConversionMappingIndex
                        ) {
                          return {
                            src: e.target.value,
                            dst: eachConversionMapping.dst,
                          };
                        } else {
                          return eachConversionMapping;
                        }
                      }
                    ),
                  }));
                }}
              >
                {formats.map((eachFormat) => (
                  <option value={eachFormat}>{eachFormat}</option>
                ))}
              </Select>
              <Select
                key={uuid()}
                // placeholder="webp"
                value={eachConversionMap.dst || "PNG"}
                onChange={(e) => {
                  setModified(true);
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    conversion_maps: prevConfig.conversion_maps.map(
                      (eachConversionMapping, eachConversionMappingIndex) => {
                        if (
                          eachConversionMapIndex === eachConversionMappingIndex
                        ) {
                          return {
                            src: eachConversionMapping.src,
                            dst: e.target.value,
                          };
                        } else {
                          return eachConversionMapping;
                        }
                      }
                    ),
                  }));
                }}
              >
                {formats.map((eachFormat) => (
                  <option value={eachFormat}>{eachFormat}</option>
                ))}
              </Select>
              <Tooltip
                label="Delete This Conversion Mapping From List"
                placement="left"
              >
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => {
                    setModified(true);
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      conversion_maps: prevConfig.conversion_maps.filter(
                        (_, index) => eachConversionMapIndex !== index
                      ),
                    }));
                  }}
                />
              </Tooltip>
            </HStack>
          )
        )}
        <Button
          onClick={() => {
            setModified(true);
            setConfig((prevConfig) => ({
              ...prevConfig,
              conversion_maps: prevConfig.conversion_maps.concat({
                src: "WebP",
                dst: "PNG",
              }),
            }));
          }}
        >
          Add Conversion Mapping
        </Button>
        <Divider />
        <Checkbox
          isChecked={config.silent_start}
          onChange={(e) => {
            setModified(true);
            setConfig((prevConfig) => ({
              ...prevConfig,
              silent_start: prevConfig.silent_start
                ? !prevConfig.silent_start
                : true,
            }));
          }}
        >
          Start as Tray Icon
        </Checkbox>
        <Checkbox
          isChecked={config.launch_on_system_start}
          onChange={(e) => {
            setModified(true);
            setConfig((prevConfig) => ({
              ...prevConfig,
              launch_on_system_start: prevConfig.launch_on_system_start
                ? !prevConfig.launch_on_system_start
                : true,
            }));
          }}
        >
          Launch On System Start
        </Checkbox>
        <Divider />
        <Button
          isDisabled={!modified}
          colorScheme="teal"
          onClick={async () => {
            setModified(false);
            let conversionMapDuplicate = false;
            for (let i = 0; i < config.conversion_maps.length - 1; i++) {
              for (let j = i + 1; j < config.conversion_maps.length; j++) {
                console.log(JSON.stringify(config.conversion_maps[i]));
                console.log(JSON.stringify(config.conversion_maps[j]));
                if (
                  config.conversion_maps[i].src ===
                    config.conversion_maps[j].src &&
                  config.conversion_maps[i].dst ===
                    config.conversion_maps[j].dst
                ) {
                  conversionMapDuplicate = true;
                  break;
                }
              }
              if (conversionMapDuplicate === true) {
                break;
              }
            }
            console.log(conversionMapDuplicate);
            if (conversionMapDuplicate === true) {
              await message(`There is a Duplicate Conversion Mapping!`, {
                title: "Tauri",
                type: "error",
              });
              return;
            }
            const { appWindow } = await import("@tauri-apps/api/window");
            console.log(appWindow);
            appWindow
              .emit("applySettings", {
                message: config,
              })
              .then(() => getConfig());
          }}
        >
          Apply Change
        </Button>
      </VStack>
    </Frame>
  );
}
