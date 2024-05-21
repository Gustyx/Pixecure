import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerTitle: "Fitness ProTrack" }}
      />
      <Stack.Screen
        name="register"
        options={{ headerTitle: "Register Page" }}
      />
      <Stack.Screen name="login" options={{ headerTitle: "Login Page" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
