import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Fitness ProTrack",
          headerStyle: {
            backgroundColor: "#d3d3d3",
            // backgroundColor: "#708090",
          },
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerTitle: "Register Page",
          headerStyle: {
            backgroundColor: "#d3d3d3",
            // backgroundColor: "#708090",
          },
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerTitle: "Login Page",
          headerStyle: {
            backgroundColor: "#d3d3d3",
            // backgroundColor: "#708090",
          },
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;
