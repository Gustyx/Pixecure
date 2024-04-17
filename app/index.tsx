import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { Camera } from "expo-camera";
import MyCamera from "../src/pages/components/myCamera";

const Home = () => {
  const [startCamera, setStartCamera] = React.useState<boolean>(false);

  const __startCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      // do something
      setStartCamera(true);
    } else {
      Alert.alert("Access denied");
    }
  };

  const handleExitCamera = () => {
    setStartCamera(false);
  };

  return startCamera ? (
    <MyCamera onExitCamera={handleExitCamera} />
  ) : (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={__startCamera}
          style={{
            width: 130,
            borderRadius: 4,
            backgroundColor: "#14274e",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            height: 40,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Take picture
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Home;
