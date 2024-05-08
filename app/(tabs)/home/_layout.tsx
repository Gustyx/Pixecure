import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: "Home Page" }} />
    </Stack>
  );
};

export default Layout;
