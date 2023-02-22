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
import { useState } from "react";
import { useRouter } from "next/router";
import Header from "./header";
import SideBar from "./sidebar";

export default function Frame(props) {
  const router = useRouter();

  return (
    <>
      <Header />
      <Box as="main" className="main-content" w="full" mx="auto">
        <Flex direction="row" px="6">
          <SideBar />
          {props.children}
        </Flex>
      </Box>
    </>
  );
}
