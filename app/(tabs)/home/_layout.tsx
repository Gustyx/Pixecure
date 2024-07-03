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
    </Stack>
  );
};

export default Layout;
