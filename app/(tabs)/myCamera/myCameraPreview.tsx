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
import { aes1by1, generateRoundKeys, oldAes1by1 } from "../../aes";
import * as Crypto from "expo-crypto";

let webViewLoaded = false;
let base64image;
let smallBase64image;
const date = new Date(Date.now());
let newBase64;
let newSmallBase64;

const MyCameraPreview = ({ onExitPreview, image }) => {
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [pixels, setPixels] = useState<number[]>([]);
  const [smallPixels, setSmallPixels] = useState<number[]>([]);
  const [encryptionRoundKeys, setEncryptionRoundKeys] = useState([]);
  const webViewRef = useRef(null);
  const imageScale = image.height / image.width;

  const closeCameraPreview = () => {
    onExitPreview();
  };

  useEffect(() => {
    const generateEncryptionKey = async () => {
      const uid = auth.currentUser.uid;
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        uid + uid
      );

      let key = "";
      for (let i = 0; key.length < 16; ++i) {
        key =
          key +
          digest[uid.charCodeAt(uid.length - 1 - i) % 64] +
          digest[uid.charCodeAt(i) % 64];
      }

      const roundKeys = generateRoundKeys(key);
      setEncryptionRoundKeys(roundKeys);
    };

    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: 300 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.PNG,
            base64: true,
          }
        );
        const smallManipResult = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: 48 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.PNG,
            base64: true,
          }
        );
        console.log(smallManipResult.height);
        base64image = manipResult.base64;
        smallBase64image = smallManipResult.base64;
        if (webViewLoaded) {
          const script = loadBase64andSendPixelsScript(base64image);
          webViewRef.current.injectJavaScript(script);
        }
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };

    generateEncryptionKey();
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
      if (pixels.length === 0) {
        setPixels(webViewMessage);
        const script = loadBase64andSendPixelsScript(smallBase64image);
        webViewRef.current.injectJavaScript(script);
      } else {
        setSmallPixels(webViewMessage);
      }
    } else {
      // saveImage(webViewMessage);
      if (!newBase64) {
        newBase64 = webViewMessage;
      } else {
        newSmallBase64 = webViewMessage;
        saveImage();
      }
    }
  };

  const saveImage = async () => {
    const manipResult = await ImageManipulator.manipulateAsync(
      "data:image/png;base64," + newBase64,
      [],
      {
        format: ImageManipulator.SaveFormat.PNG,
      }
    );
    newBase64 = "";
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
            category: thisImageDetails.category,
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

    const smallImage = await ImageManipulator.manipulateAsync(
      "data:image/png;base64," + newSmallBase64,
      [],
      { format: ImageManipulator.SaveFormat.PNG }
    );
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

      console.log("start");
      let startTime = performance.now();
      let p = [];
      let round = 0;
      for (let i = 0; i < pixels.length; i++) {
        if ((i + 1) % 4 !== 0) {
          p.push(pixels[i]);
        }
        if (p.length === 16) {
          let enc = aes1by1(p, encryptionRoundKeys, round);
          p = [];
          round = (round + 1) % 11;
          for (let j = 0; j < 16; j++) {
            newPixels.push(enc[j]);
            if ((newPixels.length + 1) % 4 === 0) {
              newPixels.push(255);
            }
          }
        }
      }
      let endTime = performance.now();
      let elapsedTime = endTime - startTime;
      console.log("Elapsed time for encryption:", elapsedTime);

      const newPixelData = JSON.stringify(newPixels);
      const script = loadPixelsAndSendNewBase64Script(
        base64image,
        newPixelData
      );
      webViewRef.current.injectJavaScript(script);

      let newSmallPixels = [];

      console.log("start");
      startTime = performance.now();
      p = [];
      round = 0;

      for (let i = 0; i < smallPixels.length; i++) {
        if ((i + 1) % 4 !== 0) {
          p.push(smallPixels[i]);
        }
        if (p.length === 16) {
          let enc = aes1by1(p, encryptionRoundKeys, round);
          p = [];
          round = (round + 1) % 11;
          for (let j = 0; j < 16; j++) {
            newSmallPixels.push(enc[j]);
            if ((newSmallPixels.length + 1) % 4 === 0) {
              newSmallPixels.push(255);
            }
          }
        }
      }
      endTime = performance.now();
      elapsedTime = endTime - startTime;

      console.log("Elapsed time for encryption:", elapsedTime);

      const newSmallPixelData = JSON.stringify(newSmallPixels);
      const smallScript = loadPixelsAndSendNewBase64Script(
        smallBase64image,
        newSmallPixelData
      );
      webViewRef.current.injectJavaScript(smallScript);
    }
  };

  const renderDetails = () => {
    return keys.map((key, i) => (
      <View key={i} style={styles.detailsContainer}>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.detailsText}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
          </Text>
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
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSaveImage} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>
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
    flexDirection: "row",
    position: "relative",
    justifyContent: "center",
    // backgroundColor: "#d3d3d3",
    backgroundColor: "#708090",
  },
  smallImageButton: {
    alignSelf: "center",
    marginTop: "5%",
    marginBottom: "5%",
  },
  detailsContainer: {
    flexDirection: "row",
    marginLeft: "25%",
    marginVertical: 10,
  },
  detailsText: {
    alignSelf: "flex-start",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
    color: "#fff",
  },
  input: {
    width: (screenWidth * 66) / 200,
    height: (screenHeight * 6.6) / 175,
    backgroundColor: "black",
    borderRadius: 15,
    paddingHorizontal: 10,
    alignSelf: "flex-end",
    color: "white",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    backgroundColor: "black",
    top: "5%",
    right: "5%",
    width: 30,
    height: 30,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  saveButton: {
    width: (screenWidth * 66) / 300,
    height: (screenHeight * 7.5) / 150,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    position: "absolute",
    backgroundColor: "black",
    bottom: "4.5%",
    right: "5%",
  },
  saveButtonText: {
    fontSize: 20,
    color: "#fff",
  },
});

export default MyCameraPreview;
