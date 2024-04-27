import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Stack } from "expo-router";
import { Camera } from "expo-camera";
import { CameraType } from "expo-camera/build/Camera.types";
import MyCameraPreview from "./myCameraPreview";

const MyCamera = ({ onExitCamera }) => {
  let camera;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = screenWidth * (3 / 4);
  const [previewVisible, setPreviewVisible] = React.useState<boolean>(false);
  const [capturedImage, setCapturedImage] = React.useState<any>(null);
  const [cameraType, setCameraType] = React.useState<CameraType>(
    CameraType.back
  );

  const __takePicture = async () => {
    if (!camera) return;
    const photo = await camera.takePictureAsync();
    setPreviewVisible(true);
    setCapturedImage(photo);
  };

  const __switchCamera = () => {
    setCameraType((prevType) =>
      prevType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const __closeCamera = () => {
    onExitCamera();
  };

  const handleExitCameraPreview = () => {
    setPreviewVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {previewVisible && capturedImage ? (
        <MyCameraPreview
          onExitPreview={handleExitCameraPreview}
          image={capturedImage}
        />
      ) : (
        <Camera
          style={{ flex: 1, width: screenWidth, height: screenHeight }}
          type={cameraType}
          ref={(r) => {
            camera = r;
          }}
        >
          <View style={styles.container}>
            <TouchableOpacity
              onPress={__closeCamera}
              style={styles.closeButton}
            >
              <Text style={styles.buttonText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={__switchCamera}
            >
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                onPress={__takePicture}
                style={styles.captureButton}
              />
            </View>
          </View>
        </Camera>
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
  closeButton: {
    position: "absolute",
    top: "5%",
    right: "5%",
  },
  flipButton: {
    position: "absolute",
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
