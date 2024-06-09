import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../../firebase.config";
import { getMetadata, updateMetadata } from "firebase/storage";
import {
  ImageDetails,
  keys,
  screenHeight,
  screenWidth,
  imageDetails,
  formatDate,
  getImageRef,
  loadBase64andSendPixelsScript,
  loadPixelsAndSendNewBase64Script,
} from "../../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import * as ImageManipulator from "expo-image-manipulator";
import { WebView } from "react-native-webview";
import {
  aesDecrypt1by1,
  generateRoundKeys,
  oldAesDecrypt1by1,
} from "../../aes";
import * as Crypto from "expo-crypto";

let selectedDate: Date;
let imageScale = 4 / 3;
let base64image;
let webViewLoaded = false;

const Inspect = () => {
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [decryptedBase64, setDecryptedBase64] = useState<string>("");
  const [firstBase64image, setFirstBase64image] = useState<string>("");
  const [decryptionRoundKeys, setDecryptionRoundKeys] = useState([]);
  const params = useLocalSearchParams();
  const imageUrl = Array.isArray(params.id) ? params.id[0] : params.id;
  const webViewRef = useRef(null);

  useEffect(() => {
    const generateDecryptionKey = async () => {
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
      setDecryptionRoundKeys(roundKeys);
    };

    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUrl,
          [],
          {
            format: ImageManipulator.SaveFormat.PNG,
            base64: true,
          }
        );
        imageScale = manipResult.height / manipResult.width;
        base64image = manipResult.base64;
        if (webViewLoaded) {
          const script = loadBase64andSendPixelsScript(base64image);
          webViewRef.current.injectJavaScript(script);
        } else {
          setFirstBase64image(base64image);
        }
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };

    const getImageMetadata = () => {
      try {
        const ref = getImageRef(imageUrl);
        getMetadata(ref)
          .then((metadata) => {
            setThisImageDetails(
              metadata.customMetadata as unknown as ImageDetails
            );
            const [day, month, year] = metadata.customMetadata.date.split("/");
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            selectedDate = new Date(date);
          })
          .catch((error) => {
            console.error("Error getting metadata: ", error);
          });
      } catch (error) {
        console.error("Error getting metadata: ", error);
      }
    };

    generateDecryptionKey();
    fetchImageSize();
    getImageMetadata();
  }, []);

  const onMessage = async (event) => {
    const webViewMessage = JSON.parse(event.nativeEvent.data);
    if (webViewMessage[0] != "i") {
      getDecryptedImageUrl(webViewMessage);
    } else {
      setDecryptedBase64(webViewMessage);
    }
  };

  const getDecryptedImageUrl = (pixels) => {
    let newPixels = [];
    const startTime = performance.now();
    console.log("start");
    let p = [];
    let round = 0;
    for (let i = 0; i < pixels.length; i++) {
      if ((i + 1) % 4 !== 0) {
        p.push(pixels[i]);
      }
      if (p.length === 16) {
        let enc = aesDecrypt1by1(p, decryptionRoundKeys, round);
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
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    console.log("Elapsed time for decryption:", elapsedTime);

    const newPixelData = JSON.stringify(newPixels);
    const script = loadPixelsAndSendNewBase64Script(base64image, newPixelData);
    webViewRef.current.injectJavaScript(script);
  };

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  const onDateChange = (event, date) => {
    setShowCalendar(false);
    selectedDate = date;
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails["date"] = date.toLocaleDateString();
    setThisImageDetails(updatedDetails);
  };

  const updateImageMetadata = async () => {
    if (!displayDetails) setDisplayDetails(true);
    else if (imageUrl) {
      const newMetadata = {
        customMetadata: {
          ...thisImageDetails,
        },
      };
      const currentUserId = auth.currentUser?.uid;
      const userRef = doc(db, "users", currentUserId);
      const date = formatDate(thisImageDetails["date"]);
      if (
        thisImageDetails.category !== params.category ||
        date !== params.date
      ) {
        await updateDoc(userRef, {
          images: arrayRemove({
            url: params.url,
            smallUrl: params.smallUrl,
            category: params.category,
            date: params.date,
          }),
        });
        await updateDoc(userRef, {
          images: arrayUnion({
            url: imageUrl,
            smallUrl: params.smallUrl,
            category: thisImageDetails.category,
            date: date,
          }),
        });
      }
      const ref = getImageRef(imageUrl);
      updateMetadata(ref, newMetadata)
        .then((metadata) => {
          Alert.alert("New Details saved.");
          console.log("Metadata saved:", metadata.customMetadata);
        })
        .catch((error) => {
          Alert.alert("Could not update details.");
          console.error("Error updating image metadata: ", error);
        });
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
            <TouchableOpacity
              onPress={() => {
                setShowCalendar(true);
              }}
            >
              <Text style={styles.input}>{thisImageDetails["date"]}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ));
  };

  const renderImage = (imageStyle) => {
    return (
      <ImageBackground
        source={{
          uri: decryptedBase64
            ? `data:image/png;base64,${decryptedBase64}`
            : `data:image/png;base64,${params.decryptedSmallUrl}`,
        }}
        style={imageStyle}
      >
        {!decryptedBase64 && <ActivityIndicator size="large" />}
      </ImageBackground>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Inspect Page",
          headerStyle: {
            backgroundColor: "#d3d3d3",
            // backgroundColor: "#708090",
          },
        }}
      />
      {base64image && (
        <WebView
          ref={webViewRef}
          onMessage={onMessage}
          originWhitelist={["*"]}
          source={{
            html: "<html><body></body></html>",
          }}
          onLoad={() => {
            if (!webViewLoaded) {
              const script = loadBase64andSendPixelsScript(firstBase64image);
              webViewRef.current.injectJavaScript(script);
              webViewLoaded = true;
            }
          }}
          style={{ flex: 0 }}
        />
      )}
      {!displayDetails ? (
        renderImage(styles.bigImage)
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
            {renderImage(styles.smallImage)}
          </TouchableOpacity>
          {keys && renderDetails()}
          {showCalendar && (
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate}
              mode={"date"}
              onChange={onDateChange}
            />
          )}
        </ScrollView>
      )}
      <TouchableOpacity
        onPress={() => updateImageMetadata()}
        style={styles.editButton}
      >
        <Text style={styles.buttonText}>
          {!displayDetails ? "Details" : "Edit"}
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
  bigImage: {
    width: screenWidth,
    height: screenWidth * imageScale,
    justifyContent: "center",
  },
  smallImage: {
    width: screenWidth / 2,
    height: (screenWidth / 2) * imageScale,
    justifyContent: "center",
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
  editButton: {
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
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
});

export default Inspect;
