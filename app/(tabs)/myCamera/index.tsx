import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Camera } from "expo-camera";
import { CameraType } from "expo-camera/build/Camera.types";
import MyCameraPreview from "./myCameraPreview";
import { useIsFocused } from "@react-navigation/native";

const MyCamera = ({ onExitCamera }) => {
  let camera;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = screenWidth * (3 / 4);
  const [previewVisible, setPreviewVisible] = React.useState<boolean>(false);
  const [capturedImage, setCapturedImage] = React.useState<any>(null);
  const [cameraType, setCameraType] = React.useState<CameraType>(
    CameraType.back
  );
  const [cameraActive, setCameraActive] = React.useState<boolean>(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    // Initialize camera and setup event listeners
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
      console.log("MyCamera tab is focused");
      setCameraActive(true);

      return () => {
        // Optional cleanup code
      };
    }, [])
  );
  useEffect(() => {
    if (!isFocused) {
      // Code to execute when leaving the tab
      console.log("Leaving MyCamera tab...");
      setCameraActive(false);
    }

    return () => {
      // Cleanup function to execute when leaving the tab
      console.log("Cleanup function executed when leaving the tab");
    };
  }, [isFocused]);

  const __takePicture = async () => {
    if (!camera) return;
    const photo = await camera.takePictureAsync();
    setPreviewVisible(true);
    setCapturedImage(photo);
    // console.log(photo);
    // router.push({
    //   pathname: "myCamera/myCameraPreview",
    //   params: photo,
    // });
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
        cameraActive && (
          <Camera
            style={{ flex: 1, width: screenWidth, height: screenHeight }}
            type={cameraType}
            ref={(r) => {
              camera = r;
            }}
          >
            <View style={styles.container}>
              {/* <TouchableOpacity
              onPress={__closeCamera}
              style={styles.closeButton}
            >
              <Text style={styles.buttonText}>X</Text>
            </TouchableOpacity> */}
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
