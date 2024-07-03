import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Pixecure",
          headerStyle: {
            backgroundColor: "#d3d3d3",
          },
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerTitle: "Pixecure",
          headerStyle: {
            backgroundColor: "#d3d3d3",
          },
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerTitle: "Pixecure",
          headerStyle: {
            backgroundColor: "#d3d3d3",
          },
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
