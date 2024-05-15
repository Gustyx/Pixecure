import * as ImageManipulator from "expo-image-manipulator";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Base64Binary } from "../utils/utils";
import { BITMAP_DIMENSION, TENSORFLOW_CHANNEL, screenWidth, screenHeight } from "../constants";
export const startPrediction = async (model, tensor) => {
    try {
      // predict against the model
      const output = await model.predict(tensor);
      // return typed array
      return output.dataSync();
    } catch (error) {
      console.log("Error predicting from tesor image", error);
    }
  };
  export const convertBase64ToTensor = async (base64) => {
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
  export const getModel = async () => {
    try {
      // wait until tensorflow is ready
      await tf.ready();
      // load the trained model
      return await tf.loadLayersModel(
        "https://teachablemachine.withgoogle.com/models/6ijRGvs7T/model.json"
      );
    } catch (error) {
      console.log("Could not load model", error);
    }
  };
  export const cropPicture = async (imageData, maskDimension) => {
    try {
      const { uri, width, height } = imageData;
      const cropWidth = maskDimension * (width / screenWidth);
      const cropHeight = maskDimension * (height / screenHeight);
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