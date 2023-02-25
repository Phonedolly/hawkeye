import { Box, Flex, Heading } from "@chakra-ui/react";
import NextLink from "next/link";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useLayoutEffect, useState } from "react";

export default function Header(props) {
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    const getAppVersion = async () => setAppVersion(`v` + await getVersion());
    getAppVersion();
  }, []);
  return (
    <Box p="10">
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <Heading>🕊️HawkEye</Heading>
        <Heading size="sm">{appVersion}</Heading>
      </Flex>
    </Box>
  );
}
