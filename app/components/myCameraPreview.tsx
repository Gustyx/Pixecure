import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Stack } from "expo-router";

const MyCameraPreview = ({ onExitPreview, photo }) => {
  const __closeCameraPreview = () => {
    onExitPreview();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: photo && photo.uri }}
        style={{
          flex: 1,
        }}
      />
      <TouchableOpacity
        onPress={__closeCameraPreview}
        style={styles.closeButton}
      >
        <Text style={styles.buttonText}>X</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    flexDirection: "row",
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    top: "5%",
    right: "5%",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
});

export default MyCameraPreview;
