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
  loadBase64andSendPixelsScript,
  loadPixelsAndSendNewBase64Script,
} from "../../constants";
import * as ImageManipulator from "expo-image-manipulator";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { aes, aes1by1 } from "../../aes";

let webViewLoaded = false;
let base64image;
const date = new Date(Date.now());

const MyCameraPreview = ({ onExitPreview, image }) => {
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [pixels, setPixels] = useState<number[]>([]);
  const webViewRef = useRef(null);
  const imageScale = image.height / image.width;

  const closeCameraPreview = () => {
    onExitPreview();
  };

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        // const initialBase64 = await FileSystem.readAsStringAsync(image.uri, {
        //   encoding: FileSystem.EncodingType.Base64,
        // });
        // console.log(initialBase64);
        const manipResult = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: 300 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.PNG,
            base64: true,
          }
        );
        console.log(manipResult.height);
        base64image = manipResult.base64;
        if (webViewLoaded) {
          const script = loadBase64andSendPixelsScript(base64image);
          webViewRef.current.injectJavaScript(script);
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
    if (webViewMessage[0] != "i") {
      setPixels(webViewMessage);
    } else {
      saveImage(webViewMessage);
    }
  };

  const saveImage = async (webViewMessage) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      "data:image/png;base64," + webViewMessage,
      [],
      {
        format: ImageManipulator.SaveFormat.PNG,
      }
    );
    // const fileUri = `${FileSystem.documentDirectory}temp_image.png`;
    // await FileSystem.writeAsStringAsync(fileUri, webViewMessage, {
    //   encoding: FileSystem.EncodingType.Base64,
    // });
    // const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const currentUserId = auth.currentUser?.uid;
    const userRef = doc(db, "users", currentUserId);
    thisImageDetails["date"] = date.toLocaleDateString();
    const metadata = {
      customMetadata: { ...thisImageDetails },
    };
    uploadImage(manipResult.uri, metadata)
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
      let newPixels = [];
      // for (let i = 0; i < pixels.length; i += 16) {
      //   let p = aes(pixels.slice(i, i + 16), "Thats my Kung Fu");
      //   newPixels = [...newPixels, ...p];
      // }

      const startTime = performance.now();
      console.log("start");
      let p = [];
      let round = 0;
      for (let i = 0; i < pixels.length; i++) {
        if ((i + 1) % 4 !== 0) {
          p.push(pixels[i]);
        }
        if (p.length === 16) {
          let enc = aes1by1(p, "Thats my Kung Fu", round % 11);
          p = [];
          ++round;
          for (let j = 0; j < 16; j++) {
            newPixels.push(enc[j]);
            if ((newPixels.length + 1) % 4 === 0) {
              newPixels.push(255);
            }
          }
        }
      }
      const endTime = performance.now();
      const elapsedTime = endTime - startTime;

      console.log("Elapsed time for encryption:", elapsedTime);

      // console.log("old:", pixels);
      // console.log("new:", newPixels);
      // console.log(pixels.length);
      // console.log(newPixels.length);
      const newPixelData = JSON.stringify(newPixels);
      const script = loadPixelsAndSendNewBase64Script(
        base64image,
        newPixelData
      );
      webViewRef.current.injectJavaScript(script);
    }
  };

  const renderDetails = () => {
    return keys.map((key, i) => (
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
          <Text style={styles.input}>{date.toLocaleDateString()}</Text>
        )}
      </View>
    ));
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
            const script = loadBase64andSendPixelsScript(base64image);
            webViewRef.current.injectJavaScript(script);
            webViewLoaded = true;
          }
        }}
        style={{ flex: 0 }}
      />
      {!displayDetails ? (
        <ImageBackground
          source={{
            uri: image.uri,
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
            style={styles.smallImageButton}
          >
            <Image
              source={{
                uri: image.uri,
              }}
              style={{
                width: screenWidth / 2,
                height: (screenWidth / 2) * imageScale,
              }}
            />
          </TouchableOpacity>
          {keys && renderDetails()}
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
  smallImageButton: {
    alignSelf: "center",
    marginTop: "5%",
    marginBottom: "10%",
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
});

export default MyCameraPreview;
