import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import { storage } from "../../../firebase.config";
import { ref, getMetadata } from "firebase/storage";
import { imageDetails, imageFolderPath, screenWidth } from "../../constants";

const Inspect = () => {
  const params = useLocalSearchParams();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const [thisImageDetails, setThisImageDetails] = React.useState({});

  useEffect(() => {
    const getImageMetadata = () => {
      try {
        const startIndex = url.indexOf("%2F") + 3;
        const endIndex = url.indexOf("?alt=media");
        const imageId = url.substring(startIndex, endIndex);
        const imageRef = ref(storage, imageFolderPath + imageId);
        getMetadata(imageRef)
          .then((metadata) => {
            console.log(metadata);
            console.log(metadata.customMetadata);
            setThisImageDetails(metadata.customMetadata);
            console.log(thisImageDetails);
          })
          .catch((error) => {
            console.error("Error getting metadata: ", error);
          });
      } catch (error) {
        console.error("Error getting metadata: ", error);
      }
    };
    getImageMetadata();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
      <View>
        <Image
          source={{ uri: url }}
          style={{
            width: screenWidth / 2,
            height: (screenWidth / 2) * 1.5,
            // alignItems: "center",
            // justifyContent: "center",
            margin: "25%",
            marginTop: "5%",
          }}
        />
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
      </View>
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
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Inspect;
