import { Tabs } from "expo-router";
import { Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#708090",
        tabBarActiveBackgroundColor: "#d3d3d3",
        tabBarInactiveBackgroundColor: "#d3d3d3",
        // backgroundColor: "#d3d3d3",
        // backgroundColor: "#708090",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={30} color={color} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: focused ? 16 : 12 }}>Home</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="myCamera"
        options={{
          headerShown: false,
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={30} color={color} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, fontSize: focused ? 16 : 12 }}>Camera</Text>
          ),
        }}
      />
    </Tabs>
  );
};
