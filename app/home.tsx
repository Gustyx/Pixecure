import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Camera } from "expo-camera";
import MyCamera from "./components/myCamera";
import RegisterPage from "./register";
import useAuth from "./hooks/useAuth";
import withAuthentication from "./hocs/withAuthentication";

const HomePage = () => {
  const router = useRouter();
  const user = useAuth();
  console.log("ax", user);
  const [startCamera, setStartCamera] = React.useState<boolean>(false);

  const __startCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setStartCamera(true);
    } else {
      Alert.alert("Access denied");
    }
  };

  const handleExitCamera = () => {
    setStartCamera(false);
  };

  return !user ? (
    <RegisterPage></RegisterPage>
  ) : startCamera ? (
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
        <TouchableOpacity onPress={__startCamera} style={styles.button}>
          <Text style={styles.buttonText}>Take picture</Text>
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
  button: {
    width: 130,
    borderRadius: 4,
    backgroundColor: "#14274e",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default withAuthentication(HomePage);
