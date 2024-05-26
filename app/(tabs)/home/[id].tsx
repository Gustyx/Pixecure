import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
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
} from "../../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import * as ImageManipulator from "expo-image-manipulator";
import { WebView } from "react-native-webview";

let selectedDate: Date;
let imageScale = 1;

const Inspect = () => {
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [base64image, setBase64image] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const params = useLocalSearchParams();
  const url = Array.isArray(params.id) ? params.id[0] : params.id;
  const webViewRef = useRef(null);

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          url,
          [{ resize: { width: 100 } }],
          {
            // format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        imageScale = manipResult.height / manipResult.width;
        setBase64image(manipResult.base64);
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };

    const getImageMetadata = () => {
      try {
        const ref = getImageRef(url);
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
      setImageUrl(webViewMessage);
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
    else if (url) {
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
            url: url,
            smallUrl: params.smallUrl,
            pose: thisImageDetails.pose,
            date: date,
          }),
        });
      }
      updateMetadata(getImageRef(url), newMetadata)
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
      {base64image && (
        <WebView
          ref={webViewRef}
          onMessage={onMessage}
          originWhitelist={["*"]}
          source={{ html: "<html><body></body></html>" }}
          onLoad={() => {
            webViewRef.current.injectJavaScript(loadAndProcessImage);
          }}
          style={{ flex: 0 }}
        />
      )}
      {!displayDetails ? (
        imageUrl ? (
          <ImageBackground
            source={{
              uri:
                // url
                `data:image/jpeg;base64,${imageUrl}`,
            }}
            style={{
              width: screenWidth,
              height: screenWidth * imageScale,
            }}
          />
        ) : (
          <View
            style={{
              width: screenWidth,
              height: (screenWidth * 4) / 3,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        )
      ) : (
        <ScrollView
          style={{
            width: "100%",
          }}
        >
          {imageUrl ? (
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
                  uri:
                    //  url
                    `data:image/jpeg;base64,${imageUrl}`,
                }}
                style={{
                  width: screenWidth / 2,
                  height: (screenWidth / 2) * imageScale,
                }}
              />
            </TouchableOpacity>
          ) : (
            <View
              style={{
                width: screenWidth / 2,
                height: ((screenWidth / 2) * 4) / 3,
                alignSelf: "center",
                marginTop: "5%",
                marginBottom: "10%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" />
            </View>
          )}
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
                    <TouchableOpacity
                      onPress={() => {
                        setShowCalendar(true);
                      }}
                      style={styles.input}
                    >
                      <Text style={{ color: "white" }}>
                        {thisImageDetails["date"]}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
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
        style={styles.saveButton}
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
    backgroundColor: "transparent",
    flexDirection: "row",
    position: "relative",
    justifyContent: "center",
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
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

export default Inspect;
