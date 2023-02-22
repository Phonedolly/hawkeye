import {
  ArrowRightIcon,
  AttachmentIcon,
  ChevronRightIcon,
  InfoIcon,
  RepeatClockIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Center,
  chakra,
  HStack,
  List,
  ListItem,
  ListProps,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useRef } from "react";

import NextLink from "next/link";

const MainNavLink = ({ href, icon, children, isActive, isExternal }) => {
  const router = useRouter();
  const active = router.asPath === href || !!isActive;
  return (
    <NextLink href={href} passHref>
      <HStack
        target={isExternal ? "_blank" : undefined}
        spacing="3"
        fontSize="md"
        fontWeight={active ? "Bold" : "medium"}
        color={active ? "teal.400" : "black"}
        // _hover={{ color: active ? undefined : "fg" }}
      >
        <Center
          w="6"
          h="6"
          borderWidth="1px"
          bg={active ? "teal.500" : "transparent"}
          borderColor={active ? "teal.300" : undefined}
          rounded="base"
          color={active ? "white" : "teal.500"}
        >
          {icon}
        </Center>
        <span>{children}</span>
      </HStack>
    </NextLink>
  );
};

export const mainNavLinks = [
  {
    icon: <InfoIcon />,
    href: "/",
    label: "Insight",
  },
  {
    icon: <AttachmentIcon />,
    href: "/convert",
    label: "Convert",
  },
  {
    icon: <RepeatClockIcon />,
    href: "/history",
    label: "History",
  },
  {
    icon: <SettingsIcon />,
    href: "/settings",
    label: "Settings",
  },
];

export const MainNavLinkGroup = () => {
  return (
    <List spacing="4" styleType="none">
      {mainNavLinks.map((item) => (
        <ListItem key={item.label}>
          <MainNavLink
            href={item.href}
            icon={item.icon}
            isActive={item.match?.(router.asPath, item.href)}
            isExternal={item.external}
          >
            {item.label} {item.new && <NewBadge />}
          </MainNavLink>
        </ListItem>
      ))}
    </List>
  );
};

export default function SideBar(props) {
  const ref = useRef(null);
  return (
    <Box
      ref={ref}
      aria-label="Main Navigation"
      as="nav"
      pos="sticky"
      overscrollBehavior="contain"
      top="6.5rem"
      w="12em"
      h="calc(100vh - 8.125rem)"
      pr="8"
      pb="6"
      pl="6"
      pt="4"
      overflowY="auto"
      className="sidebar-content"
      flexShrink={0}
      display={{ base: "none", md: "block" }}
    >
      <MainNavLinkGroup />
    </Box>
  );
}
