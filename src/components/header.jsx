import { Box, Flex, Heading } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Header(props) {
  return (
    <Box p="10">
      <Flex as={NextLink} href="/" direction="row" justifyContent="flex-start">
        <Heading>🤫HawkEye</Heading>
      </Flex>
    </Box>
  );
}
