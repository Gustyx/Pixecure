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
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Take a Picture" }} />
      {previewVisible && capturedImage ? (
        <MyCameraPreview
          onExitPreview={handleExitCameraPreview}
          imageUri={capturedImage.uri}
        />
      ) : (
        cameraActive && (
          <View
            style={{
              flexDirection: "column",
              flexWrap: "wrap",
              justifyContent: "flex-start",
            }}
          >
            <Camera
              style={{
                width: screenWidth,
                height: (screenWidth * 4) / 3,
                alignSelf: "flex-start",
              }}
              type={cameraType}
              ref={(r) => {
                camera = r;
              }}
            ></Camera>
            <View style={styles.ButtonContainer}>
              <TouchableOpacity
                onPress={takePicture}
                style={styles.captureButton}
              />
              <TouchableOpacity
                style={styles.flipButton}
                onPress={switchCamera}
              >
                <Text style={styles.buttonText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: "center",
  },
  ButtonContainer: {
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
