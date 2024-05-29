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
  const params = useLocalSearchParams();
  const imageUrl = Array.isArray(params.id) ? params.id[0] : params.id;
  const webViewRef = useRef(null);

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUrl,
          [{ resize: { width: 500 } }],
          {
            // format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        imageScale = manipResult.height / manipResult.width;
        base64image = manipResult.base64;
        if (webViewLoaded) {
          const script = loadBase64andSendPixelsScript(base64image);
          webViewRef.current.injectJavaScript(script);
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

    fetchImageSize();
    getImageMetadata();
  }, []);

  const onMessage = async (event) => {
    const webViewMessage = JSON.parse(event.nativeEvent.data);
    if (webViewMessage[0] != "/") {
      getDecryptedImageUrl(webViewMessage);
    } else {
      setDecryptedBase64(webViewMessage);
    }
  };

  const getDecryptedImageUrl = (webViewMessage) => {
    let newPixels = webViewMessage;
    for (let i = 0; i < newPixels.length; i += 4) {
      newPixels[i] = 255 - newPixels[i]; // Invert Red
      newPixels[i + 1] = 255 - newPixels[i + 1]; // Invert Green
      newPixels[i + 2] = 255 - newPixels[i + 2]; // Invert Blue
    }
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
      if (thisImageDetails.pose !== params.pose || date !== params.date) {
        await updateDoc(userRef, {
          images: arrayRemove({
            url: params.url,
            smallUrl: params.smallUrl,
            pose: params.pose,
            date: params.date,
          }),
        });
        await updateDoc(userRef, {
          images: arrayUnion({
            url: imageUrl,
            smallUrl: params.smallUrl,
            pose: thisImageDetails.pose,
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
        <Text style={{ marginLeft: "10%" }}>{key}: </Text>
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
            style={styles.input}
          >
            <Text style={{ color: "white" }}>{thisImageDetails["date"]}</Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  const renderImage = (imageStyle) => {
    return (
      <ImageBackground
        source={{
          uri: decryptedBase64
            ? `data:image/jpeg;base64,${decryptedBase64}`
            : `data:image/jpeg;base64,${params.decryptedSmallUrl}`,
        }}
        style={imageStyle}
      >
        {!decryptedBase64 && <ActivityIndicator size="large" />}
      </ImageBackground>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
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
              const script = loadBase64andSendPixelsScript(base64image);
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
    backgroundColor: "grey",
    flexDirection: "row",
    position: "relative",
    justifyContent: "center",
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
  editButton: {
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

export default Inspect;
