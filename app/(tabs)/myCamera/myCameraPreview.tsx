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
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import {
  imageFolderPath,
  screenWidth,
  keys,
  screenHeight,
  ImageDetails,
  imageDetails,
  formatDate,
  smallImageFolderPath,
} from "../../constants";
import * as ImageManipulator from "expo-image-manipulator";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";

let webViewLoaded = false;
let base64image;

const MyCameraPreview = ({ onExitPreview, image }) => {
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [firstBase64image, setFirstBase64image] = useState<string>("");
  const [pixels, setPixels] = useState<number[]>([]);
  const webViewRef = useRef(null);

  const imageScale = image.height / image.width;
  const date = new Date(Date.now());
  const loadAndProcessImage = `
  (function() {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,${firstBase64image}';
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

  const closeCameraPreview = () => {
    onExitPreview();
  };

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: 500 } }],
          {
            // format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        base64image = manipResult.base64;
        if (webViewLoaded) {
          const loadAndProcessImageFaster = `
          (function() {
            const img = new Image();
            img.src = 'data:image/jpeg;base64,${manipResult.base64}';
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
          webViewRef.current.injectJavaScript(loadAndProcessImageFaster);
        } else {
          setFirstBase64image(base64image);
        }
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };

    fetchImageSize();
  }, []);

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  const onMessage = async (event) => {
    const webViewMessage = JSON.parse(event.nativeEvent.data);
    if (webViewMessage[0] != "/") {
      setPixels(webViewMessage);
    } else {
      saveImage(webViewMessage);
    }
  };

  const saveImage = async (webViewMessage) => {
    const currentUserId = auth.currentUser?.uid;
    const userRef = doc(db, "users", currentUserId);
    thisImageDetails["date"] = date.toLocaleDateString();
    const metadata = {
      customMetadata: { ...thisImageDetails },
    };
    // setBase64image(webViewMessage);
    // console.log(webViewMessage);
    const fileUri = `${FileSystem.documentDirectory}temp_image.jpg`;
    await FileSystem.writeAsStringAsync(fileUri, webViewMessage, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    uploadImage(fileInfo.uri, metadata)
      .then(async (downloadURLs) => {
        const formatedDate = formatDate(thisImageDetails["date"]);
        await updateDoc(userRef, {
          images: arrayUnion({
            url: downloadURLs[0],
            smallUrl: downloadURLs[1],
            pose: thisImageDetails.pose,
            date: formatedDate,
          }),
        });
        console.log("Image saved. URL:", downloadURLs[0]);
        Alert.alert("Image saved.");
      })
      .catch((error) => {
        Alert.alert("Could not save image.");
        console.error(error);
      })
      .finally(() => {
        closeCameraPreview();
      });
  };

  const uploadImage = async (uri, metadata) => {
    const imageName = image.uri.match(/([^\/]+)(?=\.\w+$)/)[0];
    const imageRef = ref(storage, imageFolderPath + imageName);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(imageRef, blob, metadata);
    const downloadURL = await getDownloadURL(imageRef);

    const smallImage = await ImageManipulator.manipulateAsync(uri, [
      { resize: { width: 100 } },
    ]);
    const smallImageRef = ref(storage, smallImageFolderPath + imageName);
    const smallResponse = await fetch(smallImage.uri);
    const smallBlob = await smallResponse.blob();
    await uploadBytes(smallImageRef, smallBlob);
    const smallDownloadURL = await getDownloadURL(smallImageRef);
    return [downloadURL, smallDownloadURL];
  };

  const handleSaveImage = () => {
    if (!displayDetails) setDisplayDetails(true);
    else {
      let newPixels = pixels;
      for (let i = 0; i < newPixels.length; i += 4) {
        newPixels[i] = 255 - newPixels[i]; // Invert Red
        newPixels[i + 1] = 255 - newPixels[i + 1]; // Invert Green
        newPixels[i + 2] = 255 - newPixels[i + 2]; // Invert Blue
      }

      const newPixelData = JSON.stringify(newPixels);
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
    }
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
          if (!webViewLoaded) {
            webViewRef.current.injectJavaScript(loadAndProcessImage);
            webViewLoaded = true;
          }
        }}
        style={{ flex: 0 }}
      />
      {!displayDetails ? (
        <ImageBackground
          source={{
            uri: image.uri,
            // `data:image/jpeg;base64,${base64image}`,
          }}
          style={{
            width: screenWidth,
            height: screenWidth * imageScale,
            alignSelf: "flex-start",
          }}
        />
      ) : (
        <ScrollView
          style={{
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={() => setDisplayDetails(false)}
            style={{
              alignSelf: "center",
              marginTop: "5%",
              marginBottom: "10%",
            }}
          >
            <Image
              source={{
                uri: image.uri,
                // `data:image/jpeg;base64,${base64image}`,
              }}
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

      <TouchableOpacity onPress={handleSaveImage} style={styles.saveButton}>
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
