import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from "react-native";
import { storage } from "../../../firebase.config";
import { ref, getMetadata } from "firebase/storage";
import { imageDetails, imageFolderPath, screenWidth } from "../../constants";
import { ImageSize } from "expo-camera";

const Inspect = () => {
  const params = useLocalSearchParams();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const [thisImageDetails, setThisImageDetails] = React.useState({});
  const [displayDetails, setDisplayDetails] = React.useState(true);
  const [imageScale, setImageScale] = React.useState(1);

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const { width, height }: ImageSize = await new Promise(
          (resolve, reject) => {
            Image.getSize(
              url,
              (width, height) => resolve({ width, height }),
              reject
            );
          }
        );
        setImageScale(height / width);
      } catch (error) {
        console.error("Error getting image size:", error);
      }
    };

    const getImageMetadata = () => {
      try {
        const encodedPath = encodeURIComponent(imageFolderPath);
        const startIndex = url.indexOf(encodedPath) + encodedPath.length;
        const endIndex = url.indexOf("?alt=media");
        const imageId = url.substring(startIndex, endIndex);
        const imageRef = ref(storage, imageFolderPath + imageId);

        getMetadata(imageRef)
          .then((metadata) => {
            setThisImageDetails(metadata.customMetadata);
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
      {!displayDetails ? (
        <View style={styles.container}>
          <ImageBackground
            source={{ uri: url }}
            style={{
              // flex: 1,
              width: screenWidth,
              height: screenWidth * imageScale,
            }}
          />
          {/* <TouchableOpacity onPress={closeCameraPreview} style={styles.closeButton}>
        <Text style={styles.buttonText}>X</Text>
      </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => setDisplayDetails(true)}
            style={styles.saveButton}
          >
            <Text style={styles.buttonText}>Details</Text>
          </TouchableOpacity>
        </View>
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
              source={{ uri: url }}
              style={{
                width: screenWidth / 2,
                height: (screenWidth / 2) * imageScale,
              }}
            />
          </TouchableOpacity>
          {Object.keys(thisImageDetails) &&
            Object.keys(thisImageDetails).map((key, i) => {
              return (
                <View key={i} style={styles.detailsContainer}>
                  <Text style={{ marginLeft: "10%" }}>
                    {key}: {thisImageDetails[key]}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
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
});

export default Inspect;
