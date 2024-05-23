import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { auth, db, storage } from "../../../firebase.config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  imageFolderPath,
  screenWidth,
  keys,
  screenHeight,
  ImageDetails,
  imageDetails,
  formatDate,
} from "../../constants";
import { ImageSize } from "expo-camera";
// import ImageEditor from "@react-native-community/image-editor";
import * as ImageManipulator from "expo-image-manipulator";
import * as base64js from "base64-js";
import { WebView } from "react-native-webview";

const MyCameraPreview = ({ onExitPreview, imageUri }) => {
  const [imageHeight, setImageHeight] = useState<number>(imageUri.height);
  const [imageWidth, setImageWidth] = useState<number>(imageUri.width);
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const webViewRef = useRef(null);
  const [modifiedBase64, setModifiedBase64] = useState(null);
  const [pixy, setPixy] = useState(null);

  const imageScale = imageUri.height / imageUri.width;
  const date: Date = new Date(Date.now());
  const [base64image, setBase64image] = useState("");

  const onMessage = (event) => {
    const pixelData = JSON.parse(event.nativeEvent.data);
    if (pixelData[0] == "/") {
      // console.log("Pixel Data:", pixelData);
      setBase64image(pixelData);
    }
    console.log(pixelData.length);
    setPixy(pixelData);
  };
  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri.uri,
          [{ resize: { width: 100 } }],
          {
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        setBase64image(manipResult.base64);
        // console.log(manipResult.base64);
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };
    fetchImageSize();
  }, []);

  const closeCameraPreview = () => {
    onExitPreview();
  };

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  const saveImage = () => {
    if (!displayDetails) setDisplayDetails(true);
    else if (imageUri) {
      const currentUserId = auth.currentUser?.uid;
      const userRef = doc(db, "users", currentUserId);
      // const imagesCollectionRef = collection(userRef, "images");
      thisImageDetails["date"] = date.toLocaleDateString();
      const metadata = {
        customMetadata: { ...thisImageDetails },
      };

      uploadImage(imageUri.uri, metadata)
        .then(async (downloadURL) => {
          Alert.alert("Image saved.");
          console.log("Image saved. URL:", downloadURL);
          // await addDoc(imagesCollectionRef, {
          //   url: downloadURL,
          //   name: imageName,
          // });
          const date = formatDate(thisImageDetails["date"]);

          await updateDoc(userRef, {
            images: arrayUnion({
              url: downloadURL,
              pose: thisImageDetails.pose,
              date: date,
            }),
          });

          closeCameraPreview();
        })
        .catch((error) => {
          Alert.alert("Could not save image.");
          console.error(error);
        });
    }
  };

  const uploadImage = async (uri, metadata) => {
    const imageName = uri.match(/([^\/]+)(?=\.\w+$)/)[0];
    const response = await fetch(uri);
    console.log(response);
    const blob = await response.blob();
    const imageRef = ref(storage, imageFolderPath + imageName);
    await uploadBytes(imageRef, blob, metadata);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  // Function to convert base64 image data to pixel array
  const base64ToPixels = (base64String) => {
    return base64js.toByteArray(base64String);
  };

  const pixelsToBase64 = (pixels) => {
    return base64js.fromByteArray(pixels);
  };

  const uploadImagee = async (blob, filename) => {
    // const uploadUri = `data:image/jpeg;base64,${base64Data}`;
    const reference = ref(storage, filename);

    try {
      console.log(blob);
      await uploadBytes(reference, blob);
      console.log("Image uploaded to Firebase!");
    } catch (e) {
      console.error("Upload failed", e);
    }
  };
  const loadAndProcessImage = `
  (function() {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,${base64image}';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixelData = Array.from(imageData.data);
      window.ReactNativeWebView.postMessage(JSON.stringify(pixelData));
    };
  })();
`;
  const handleSave = () => {
    // if (modifiedBase64) {
    //   saveNewImage(modifiedBase64);
    // }
    let pixelData = pixy;

    for (let i = 0; i < pixelData.length; i += 4) {
      pixelData[i] = 255 - pixelData[i]; // Invert Red
      pixelData[i + 1] = 255 - pixelData[i + 1]; // Invert Green
      pixelData[i + 2] = 255 - pixelData[i + 2]; // Invert Blue
    }

    const newPixelData = JSON.stringify(pixelData);
    console.log(newPixelData);
    webViewRef.current.injectJavaScript(`
      (function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = 'data:image/jpeg;base64,${base64image}';
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const imageData = ctx.createImageData(img.width, img.height);
          const pixelData = ${newPixelData};
          for (let i = 0; i < pixelData.length; i++) {
            imageData.data[i] = pixelData[i];
          }
          ctx.putImageData(imageData, 0, 0);
          const newBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
          window.ReactNativeWebView.postMessage(JSON.stringify(newBase64));
        };
      })();
    `);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Preview Picture" }} />
      <WebView
        ref={webViewRef}
        onMessage={onMessage}
        originWhitelist={["*"]}
        source={{ html: "<html><body></body></html>" }}
        onLoad={() => {
          webViewRef.current.injectJavaScript(loadAndProcessImage);
        }}
        style={{ flex: 1 }}
      />
      {!displayDetails ? (
        <ImageBackground
          source={{ uri: `data:image/jpeg;base64,${base64image}` }}
          style={{
            width: screenWidth,
            height: screenWidth * imageScale,
            alignSelf: "flex-start",
          }}
        />
      ) : (
        <ScrollView>
          <TouchableOpacity
            onPress={() => setDisplayDetails(false)}
            style={{
              alignSelf: "center",
              marginTop: "5%",
              marginBottom: "10%",
            }}
          >
            <Image
              source={{ uri: imageUri.uri }}
              style={{
                width: screenWidth / 2,
                height: (screenWidth / 2) * imageScale,
              }}
            />
          </TouchableOpacity>
          {keys &&
            keys.map((key, i) => {
              return (
                <View key={i} style={styles.detailsContainer}>
                  <Text style={{ marginLeft: "10%" }}>{key}: </Text>
                  {key !== "date" ? (
                    <TextInput
                      value={thisImageDetails[key]}
                      onChangeText={(value) => onDetailsTextChange(key, value)}
                      autoCapitalize="sentences"
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.input}>
                      {date.toLocaleDateString()}
                    </Text>
                  )}
                </View>
              );
            })}
        </ScrollView>
      )}
      <TouchableOpacity onPress={closeCameraPreview} style={styles.closeButton}>
        <Text style={styles.buttonText}>X</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.buttonText}>
          {!displayDetails ? "Details" : "Save"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "grey",
    flexDirection: "row",
    position: "relative",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    backgroundColor: "black",
    top: "5%",
    right: "5%",
  },
  saveButton: {
    position: "absolute",
    backgroundColor: "black",
    bottom: "5%",
    right: "5%",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    marginVertical: 5,
    width: (screenWidth * 66) / 200,
    height: (screenHeight * 6.6) / 200,
    backgroundColor: "black",
    borderRadius: 15,
    paddingHorizontal: 10,
    marginLeft: "10%",
    color: "white",
  },
});

export default MyCameraPreview;
