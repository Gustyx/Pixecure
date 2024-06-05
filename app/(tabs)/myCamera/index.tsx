import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Camera } from "expo-camera/legacy";
import MyCameraPreview from "./myCameraPreview";
import { useIsFocused } from "@react-navigation/native";
import { screenWidth } from "../../constants";

const MyCamera = () => {
  let camera;
  const [cameraActive, setCameraActive] = useState(null);
  const [cameraType, setCameraType] = useState<number>(1);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        setCameraActive(true);
      } else {
        Alert.alert("Access denied");
        setCameraActive(false);
      }
    })();

    return () => {
      // Cleanup logic: Remove event listeners or release resources
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Code to execute when the tab screen is focused
      setCameraActive(true);

      return () => {
        // Optional cleanup code
      };
    }, [])
  );

  useEffect(() => {
    if (!isFocused) {
      // Code to execute when leaving the tab
      setCameraActive(null);
    }

    return () => {
      // Cleanup function to execute when leaving the tab
    };
  }, [isFocused]);

  const takePicture = async () => {
    if (!camera) return;
    const photo = await camera.takePictureAsync();
    setPreviewVisible(true);
    setCapturedImage(photo);
  };

  const switchCamera = () => {
    setCameraType((cameraType + 1) % 2);
  };

  const handleExitCameraPreview = () => {
    setCapturedImage(null);
    setPreviewVisible(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Take a Picture" }} />
      {previewVisible && capturedImage ? (
        <MyCameraPreview
          onExitPreview={handleExitCameraPreview}
          image={capturedImage}
        />
      ) : (
        <View style={styles.cameraContainer}>
          {cameraActive ? (
            <Camera
              style={styles.camera}
              type={cameraType}
              ref={(r) => {
                camera = r;
              }}
            />
          ) : (
            <View style={styles.inactiveCameraContainer}>
              {cameraActive === null ? (
                <ActivityIndicator size="large" />
              ) : (
                <Text>No access to camera</Text>
              )}
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={takePicture}
              style={styles.captureButton}
            />
            <TouchableOpacity style={styles.flipButton} onPress={switchCamera}>
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    justifyContent: "center",
  },
  cameraContainer: {
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  camera: {
    width: screenWidth,
    height: (screenWidth * 4) / 3,
    alignSelf: "flex-start",
  },
  inactiveCameraContainer: {
    width: screenWidth,
    height: (screenWidth * 4) / 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 60,
    backgroundColor: "#fff",
  },
  flipButton: {
    position: "absolute",
    right: "5%",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  buttonText: {
    fontSize: 15,
    color: "#fff",
  },
});

export default MyCamera;
