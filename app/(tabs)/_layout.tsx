import { Tabs } from "expo-router";

export default () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{ headerShown: false, title: "Home" }}
      />
      <Tabs.Screen
        name="myCamera"
        options={{ headerShown: false, title: "Camera" }}
      />
    </Tabs>
  );
};
