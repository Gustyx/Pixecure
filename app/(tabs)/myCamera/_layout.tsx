import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: "Take a picture" }} />
    </Stack>
  );
};

export default Layout;
