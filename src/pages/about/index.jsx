import { Heading, Text, VStack } from "@chakra-ui/react";
import ApacheLicense from "../../components/apache";
import Frame from "../../components/frame";
import MITLicense from "../../components/mit";

export default function About(props) {
  return (
    <Frame>
      <Heading>About</Heading>
      <VStack align="start">
        <Heading size="md">🕊️HawkEye</Heading>
        <Text pl="1.5">
          Automatically Convert Images as a Format That You Want in Specific
          Folders
        </Text>
      </VStack>
      <VStack align="start">
        <Heading size="md">✅License</Heading>
        <VStack spacing="6">
          <ApacheLicense />
          <MITLicense />
        </VStack>
      </VStack>
    </Frame>
  );
}
