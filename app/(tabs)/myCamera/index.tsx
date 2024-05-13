import React, { useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Camera } from "expo-camera";
import { CameraType } from "expo-camera/build/Camera.types";
import MyCameraPreview from "./myCameraPreview";
import { useIsFocused } from "@react-navigation/native";
import { screenWidth } from "../../constants";

const MyCamera = () => {
  let camera;
  const [previewVisible, setPreviewVisible] = React.useState<boolean>(false);
  const [capturedImage, setCapturedImage] = React.useState<any>(null);
  const [cameraType, setCameraType] = React.useState<CameraType>(
    CameraType.back
  );
  const [cameraActive, setCameraActive] = React.useState<boolean>(false);
  const isFocused = useIsFocused();
  console.log(screenWidth);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        setCameraActive(true);
      } else {
        Alert.alert("Access denied");
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
      setCameraActive(false);
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
    setCameraType((prevType) =>
      prevType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const handleExitCameraPreview = () => {
    setPreviewVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {previewVisible && capturedImage ? (
        <MyCameraPreview
          onExitPreview={handleExitCameraPreview}
          imageUri={capturedImage.uri}
        />
      ) : (
        cameraActive && (
          <Camera
            style={{
              width: screenWidth,
              height: (screenWidth * 4) / 3,
            }}
            type={cameraType}
            ref={(r) => {
              camera = r;
            }}
          >
            <View style={styles.container}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={switchCamera}
              >
                <Text style={styles.buttonText}>Flip</Text>
              </TouchableOpacity>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureButton}
                />
              </View>
            </View>
          </Camera>
        )
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
  },
  flipButton: {
    position: "absolute",
    backgroundColor: "black",
    top: "5%",
    left: "5%",
  },
  captureButtonContainer: {
    position: "absolute",
    padding: 20,
    width: "100%",
    alignSelf: "center",
    flex: 1,
    bottom: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "#fff",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
});

export default MyCamera;
