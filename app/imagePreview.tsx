import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
} from "react-native";
import { imageDetails, screenHeight, screenWidth } from "./constants";
import React, { useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ImageSize } from "expo-camera";

const ImagePreview = ({ image, onTouch }) => {
  const [addDetails, setAddDetails] = React.useState(false);
  const [date, setDate] = React.useState(new Date(Date.now()));
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [thisImageDetails, setThisImageDetails] = React.useState(imageDetails);
  const [imageScale, setImageScale] = React.useState(1);
  const keys = Object.keys(imageDetails);
  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const { width, height }: ImageSize = await new Promise(
          (resolve, reject) => {
            Image.getSize(
              image.uri,
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
  const onDateChange = (event, selectedDate) => {
    setShowCalendar(false);
    setDate(selectedDate);
  };
  const onDetailsTextChange = (key, value) => {
    const updatedDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };
  const saveImage = () => {
    // if (!addDetails) setAddDetails(true);
    onTouch();
  };

  return (
    <View style={styles.container}>
      {!addDetails ? (
        <ImageBackground
          source={{ uri: image && image.uri }}
          style={{
            // flex: 1,
            width: screenWidth,
            height: screenWidth * imageScale,
          }}
        />
      ) : (
        <ScrollView>
          <TouchableOpacity
            onPress={() => setAddDetails(false)}
            style={{
              alignSelf: "center",
              marginTop: "5%",
              marginBottom: "10%",
            }}
          >
            <Image
              source={{ uri: image && image.uri }}
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
      <TouchableOpacity onPress={saveImage} style={styles.saveButton}>
        <Text style={styles.buttonText}>Save</Text>
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
