import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { v4 as uuid } from "uuid";
// import { listen } from "@tauri-apps/api/event";
// import { convertFileSrc } from "@tauri-apps/api/tauri";
import Frame from "../../components/frame";
import formats from "../../lib/formats";

export default function Convert() {
  const [dstFormat, setDstFormat] = useState("PNG");
  const [srcPath, setSrcPath] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Frame>
      <Heading size="xl">Convert Image</Heading>
      <Box
        as={Flex}
        justifyContent="center"
        alignItems="center"
        background="teal.50"
        w="full"
        h="full"
        p="10"
        borderRadius="md"
        userSelect="none"
        _hover={{ backgroundColor: "#B2F5EA" }}
        onClick={async (e) => {
          const { open } = await import("@tauri-apps/api/dialog");
          const selected = await open({
            multiple: false,
            directory: false,
          });
          if (selected !== null) {
            setSrcPath(selected);
            setSubmitted(true);
          }
        }}
      >
        {submitted === false ? (
          <Heading size="lg" draggable="false">
            🖐️Tap Here to Submit File!
          </Heading>
        ) : (
          <VStack spacing="10">
            <VStack spacing="4">
              <Heading>✅Current File</Heading>
              <Heading
                size="sm"
                fontStyle="italic"
                color="blackAlpha.600"
                px="10"
              >
                {srcPath}
              </Heading>
            </VStack>
            <VStack>
              <Heading size="md">🖐️Tap Here to Submit Another File!</Heading>
              <Heading size="sm" color="blackAlpha.600">
                (Then, Current File is Discarded)
              </Heading>
            </VStack>
          </VStack>
        )}
      </Box>
      <HStack justifyContent="flex-end" spacing="9">
        <Text fontSize="xl" fontWeight="bold" noOfLines="1">
          🖨️ Ouput Format
        </Text>
        <Select
          defaultValue="PNG"
          onChange={(e) => setDstFormat(e.target.value)}
          width="48"
        >
          {formats.map((eachFormat) => (
            <option value={eachFormat} key={uuid()}>
              {eachFormat}
            </option>
          ))}
        </Select>
        <Button
          isDisabled={!submitted}
          width="32"
          colorScheme="teal"
          onClick={async () => {
            const { message } = await import("@tauri-apps/api/dialog");
            const { invoke } = await import("@tauri-apps/api");

            const convertResult = JSON.parse(
              await invoke("from_frontend_convert_directly", {
                convertConfig: JSON.stringify({
                  src_path: srcPath,
                  dst_format: dstFormat,
                }),
              })
            );
            if (convertResult.success === true) {
              await message(`Image File Saved at ${convertResult.dst_path}!`, {
                title: "Successfully Converted",
                type: "info",
              });
            }
            setSubmitted(false);
            setSrcPath("");
          }}
        >
          Convert
        </Button>
      </HStack>
    </Frame>
  );
}
