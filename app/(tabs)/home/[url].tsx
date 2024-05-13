import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { storage } from "../../../firebase.config";
import { ref, getMetadata, updateMetadata } from "firebase/storage";
import {
  ImageDetails,
  keys,
  imageFolderPath,
  screenHeight,
  screenWidth,
  imageDetails,
} from "../../constants";
import { ImageSize } from "expo-camera";
import DateTimePicker from "@react-native-community/datetimepicker";
import ImagePreview from "../../imagePreview";

const Inspect = () => {
  const params = useLocalSearchParams();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const [date, setDate] = useState<Date>();
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [imageScale, setImageScale] = useState<number>(1);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const getImageRef = () => {
    const encodedPath = encodeURIComponent(imageFolderPath);
    const startIndex = url.indexOf(encodedPath) + encodedPath.length;
    const endIndex = url.indexOf("?alt=media");
    const imageId = url.substring(startIndex, endIndex);
    const imageRef = ref(storage, imageFolderPath + imageId);

    return imageRef;
  };

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
        const ref = getImageRef();
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
            setDate(new Date(date));
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

  const onDateChange = (event, selectedDate) => {
    setShowCalendar(false);
    setDate(selectedDate);
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails["date"] = selectedDate.toLocaleDateString();
    setThisImageDetails(updatedDetails);
  };

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  const updateImageMetadata = () => {
    if (!displayDetails) setDisplayDetails(true);
    else if (url) {
      // let newCustomMetadata: ImageDetails = thisImageDetails;
      // keys.forEach((key) => {
      //   newCustomMetadata[key] = thisImageDetails[key];
      // });
      const newMetadata = {
        customMetadata: {
          ...thisImageDetails,
        },
      };
      const ref = getImageRef();

      updateMetadata(ref, newMetadata)
        .then((metadata) => {
          // Updated metadata for 'images/forest.jpg' is returned in the Promise
          Alert.alert("New Details saved.");
          console.log("Metadata saved:", metadata.customMetadata);
        })
        .catch((error) => {
          // Uh-oh, an error occurred!
          Alert.alert("Could not update details.");
          console.error("Error updating image metadata: ", error);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
      {!displayDetails ? (
        <ImageBackground
          source={{ uri: url }}
          style={{
            // flex: 1,
            width: screenWidth,
            height: screenWidth * imageScale,
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
              source={{ uri: url }}
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
                      // placeholder={key}
                      placeholderTextColor={"white"}
                      value={thisImageDetails[key]}
                      onChangeText={(value) => onDetailsTextChange(key, value)}
                      autoCapitalize="none"
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
                  {showCalendar && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={date}
                      mode={"date"}
                      onChange={onDateChange}
                    />
                  )}
                </View>
              );
            })}
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
