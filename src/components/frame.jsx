import {
  Button,
  Box,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Header from "./header";
import SideBar from "./sidebar";

export default function Frame(props) {
  return (
    <>
      <Header />
      <Box as="main" className="main-content" w="full" mx="auto">
        <Flex direction="row" pl="6">
          <SideBar />
          {props.children}
        </Flex>
      </Box>
    </>
  );
}
