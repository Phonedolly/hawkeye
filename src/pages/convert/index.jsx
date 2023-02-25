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
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
// import { listen } from "@tauri-apps/api/event";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { open, message } from "@tauri-apps/api/dialog";
import Frame from "../../components/frame";
import formats from "../../lib/formats";
import { invoke } from "@tauri-apps/api";

export default function Convert(props) {
  const [dstFormat, setDstFormat] = useState("PNG");
  const [srcPath, setSrcPath] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Frame>
      <Heading size="xl">Convert Image</Heading>
      {submitted === false ? (
        <Box
          as={Flex}
          justifyContent="center"
          alignItems="center"
          background="teal.50"
          w="full"
          h="full"
          borderRadius="md"
          userSelect="none"
          _hover={{ backgroundColor: "#B2F5EA" }}
          onClick={async (e) => {
            const selected = await open({
              multiple: false,
              directory: false,
            });
            if (selected !== null) {
              const convertedPath = convertFileSrc(selected);
              console.log(convertedPath);
              setSrcPath(selected);
              setSubmitted(true);
            }
          }}
        >
          <Heading size="lg" draggable="false">
            Tap Here to Submit File!
          </Heading>
        </Box>
      ) : (
        <Image src={srcPath} />
      )}
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
            const convertResult = JSON.parse(
              await invoke("from_frontend_convert_directly", {
                convertConfig: JSON.stringify({
                  src_path: srcPath,
                  dst_format: dstFormat,
                }),
              })
            );
            console.log(convertResult);
            if (convertResult.success === true) {
              await message(`Image File Saved at ${convertResult.dst_path}!`, {
                title: "Successfully Converted",
                type: "info",
              });
            }
          }}
        >
          Convert
        </Button>
      </HStack>
    </Frame>
  );
}
