import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { Camera } from "expo-camera";
import { CameraType } from "expo-camera/build/Camera.types";
import MyCameraPreview from "./myCameraPreview";
import { useIsFocused } from "@react-navigation/native";
import { screenWidth } from "../../constants";
import * as ImageManipulator from "expo-image-manipulator";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { bundleResourceIO, decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Base64Binary } from "../utils/utils";

const { height: DEVICE_HEIGHT, width: DEVICE_WIDTH } = Dimensions.get("window");
// const modelJson = require("../model/model.json");
// const modelWeights = require("../model/weights.bin");
const TENSORFLOW_CHANNEL = 3;
const RESULT_MAPPING = ["Pull up", "Dips"];

// got the dimension from the trained data of the *Teachable Machine*; pixel resolution conversion (8x)
export const BITMAP_DIMENSION = 224;
const MyCamera = () => {
  let camera;
  const [presentedShape, setPresentedShape] = React.useState("");
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
    const photo = await camera.takePictureAsync({
      base64: true,
    });
    // console.log("photo ", photo);
    processImagePrediction(photo);
    setPreviewVisible(true);
    setCapturedImage(photo);
  };
  const processImagePrediction = async (base64Image) => {
    const croppedData = await cropPicture(base64Image, 300);
    // console.log("croped ", croppedData);
    const model = await getModel();
    // console.log("model ", model);
    const tensor = await convertBase64ToTensor(croppedData.base64);
    // console.log("tensor ", tensor);

    const prediction = await startPrediction(model, tensor);
    console.log("prediction ", prediction);

    const highestPrediction = prediction.indexOf(
      Math.max.apply(null, prediction)
    );
    console.log("highestPrediction ", highestPrediction);
    setPresentedShape(RESULT_MAPPING[highestPrediction]);
    console.log("rasp ", RESULT_MAPPING[highestPrediction]);
  };
  const startPrediction = async (model, tensor) => {
    try {
      // predict against the model
      const output = await model.predict(tensor);
      // return typed array
      return output.dataSync();
    } catch (error) {
      console.log("Error predicting from tesor image", error);
    }
  };
  const convertBase64ToTensor = async (base64) => {
    try {
      const uIntArray = Base64Binary.decode(base64);
      // decode a JPEG-encoded image to a 3D Tensor of dtype
      const decodedImage = decodeJpeg(uIntArray, 3);
      // reshape Tensor into a 4D array
      return decodedImage.reshape([
        1,
        BITMAP_DIMENSION,
        BITMAP_DIMENSION,
        TENSORFLOW_CHANNEL,
      ]);
    } catch (error) {
      console.log("Could not convert base64 string to tesor", error);
    }
  };
  const getModel = async () => {
    try {
      // wait until tensorflow is ready
      await tf.ready();
      // load the trained model
      return await tf.loadLayersModel(
        "https://teachablemachine.withgoogle.com/models/8v8rZ9VJt/model.json"
      );
    } catch (error) {
      console.log("Could not load model", error);
    }
  };
  const cropPicture = async (imageData, maskDimension) => {
    try {
      const { uri, width, height } = imageData;
      const cropWidth = maskDimension * (width / DEVICE_WIDTH);
      const cropHeight = maskDimension * (height / DEVICE_HEIGHT);
      const actions = [
        {
          crop: {
            originX: width / 2 - cropWidth / 2,
            originY: height / 2 - cropHeight / 2,
            width: cropWidth,
            height: cropHeight,
          },
        },
        {
          resize: {
            width: BITMAP_DIMENSION,
            height: BITMAP_DIMENSION,
          },
        },
      ];
      const saveOptions = {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      };
      return await ImageManipulator.manipulateAsync(uri, actions, saveOptions);
    } catch (error) {
      console.log("Could not crop & resize photo", error);
    }
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
