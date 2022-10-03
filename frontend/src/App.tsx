import {
  AppShell,
  Table,
  Header,
  MantineProvider,
  Text,
  Center,
  Space,
} from "@mantine/core";
import "./App.css";

import users from "./assets/users.json";

export default function App() {
  const rows = users.map((user, i) => (
    <tr key={user.discord_id}>
      <td>{i + 1}</td>
      <td style={{ display: "flex" }}>
        {user.avatar !== null ? (
          <img
            src={
              "https://cdn.discordapp.com/avatars/" +
              user.discord_id +
              "/" +
              user.avatar +
              ".png"
            }
            alt={user.username}
            width={30}
            height={30}
          />
        ) : (
          <img
            src="https://cdn.discordapp.com/embed/avatars/0.png"
            alt={user.username}
            width={30}
            height={30}
          />
        )}
        <Space w="md"></Space>
        {user.username + " #" + user.discriminator}
      </td>
      <td>{user.rating}</td>
      <td>{user.count}</td>
    </tr>
  ));

  return (
    <MantineProvider withNormalizeCSS>
      <AppShell
        padding="lg"
        header={
          <Header height={100} p="xl">
            <Text
              size={30}
              weight={600}
              style={{ fontFamily: "'Bungee Spice', cursive" }}
            >
              {typeof window !== "undefined" && window.innerWidth < 900
                ? "TWT WC Ratings"
                : "Tech With Tim Weekly Challenge Ratings"}
            </Text>
          </Header>
        }
      >
        <Center>
          <Table horizontalSpacing="sm" verticalSpacing="md" fontSize="md">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Rating</th>
                <th># Solved</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </Center>
      </AppShell>
    </MantineProvider>
  );
}
