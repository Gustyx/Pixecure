import React, { useEffect } from "react";
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
import { auth, db, storage } from "../firebase.config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  imageFolderPath,
  screenWidth,
  keys,
  screenHeight,
  ImageDetails,
  imageDetails,
} from "./constants";
import { ImageSize } from "expo-camera";

const ImagePreview = ({ touch, onExitPreview, image }) => {
  const [displayDetails, setDisplayDetails] = React.useState<boolean>(false);
  const [date, setDate] = React.useState<Date>(new Date(Date.now()));
  const [showCalendar, setShowCalendar] = React.useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    React.useState<ImageDetails>(imageDetails);
  const [imageScale, setImageScale] = React.useState<number>(1);

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const { width, height }: ImageSize = await new Promise(
          (resolve, reject) => {
            Image.getSize(
              image,
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

    fetchImageSize();
  }, []);

  const onTouch = () => {
    if (!displayDetails) setDisplayDetails(true);
    else touch();
  };

  const onDateChange = (event, selectedDate) => {
    setShowCalendar(false);
    setDate(selectedDate);
  };

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  return (
    <View style={styles.container}>
      {!displayDetails ? (
        <ImageBackground
          source={{ uri: image }}
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
              source={{ uri: image }}
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
                        {date.toLocaleDateString()}
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
      {/* <ImagePreview image={image} onTouch={saveImage} /> */}

      <TouchableOpacity onPress={onTouch} style={styles.saveButton}>
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
    backgroundColor: "transparent",
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

export default ImagePreview;
