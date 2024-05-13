import React from "react";
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
  imageDetails,
  screenHeight,
} from "../../constants";

const MyCameraPreview = ({ onExitPreview, image }) => {
  const [addDetails, setAddDetails] = React.useState(false);
  const [date, setDate] = React.useState(new Date(Date.now()));
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [thisImageDetails, setThisImageDetails] = React.useState(imageDetails);
  const keys = Object.keys(imageDetails);

  const closeCameraPreview = () => {
    onExitPreview();
  };

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
    if (!addDetails) setAddDetails(true);
    else if (image) {
      const currentUserId = auth.currentUser?.uid;
      const userRef = doc(db, "users", currentUserId);
      // const imagesCollectionRef = collection(userRef, "images");
      const imageName = image.uri.match(/([^\/]+)(?=\.\w+$)/)[0];
      let customMetadata = {};

      Object.keys(thisImageDetails).forEach((key) => {
        customMetadata[key] = thisImageDetails[key];
        if (key === "date" && customMetadata[key] === "")
          customMetadata[key] = date.toLocaleDateString();
      });
      const metadata = {
        customMetadata,
      };

      uploadImage(image.uri, imageName, metadata)
        .then(async (downloadURL) => {
          Alert.alert("Image saved.");
          console.log("Image saved. URL:", downloadURL);
          // await addDoc(imagesCollectionRef, {
          //   url: downloadURL,
          //   name: imageName,
          // });
          await updateDoc(userRef, {
            images: arrayUnion(downloadURL),
          });
          closeCameraPreview();
        })
        .catch((error) => {
          Alert.alert("Could not save image.");
          console.error(error);
        });
    }
  };

  const uploadImage = async (uri, name, metadata) => {
    const respone = await fetch(uri);
    const blob = await respone.blob();
    const imageRef = ref(storage, imageFolderPath + name);
    await uploadBytes(imageRef, blob, metadata);
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  };

  return (
    <View style={styles.container}>
      {!addDetails ? (
        <ImageBackground
          source={{ uri: image && image.uri }}
          style={{
            flex: 1,
          }}
        />
      ) : (
        <ScrollView>
          <TouchableOpacity onPress={() => setAddDetails(false)}>
            <Image
              source={{ uri: image && image.uri }}
              style={{
                width: screenWidth / 2,
                height: (screenWidth / 2) * 1.5,
                // alignItems: "center",
                // justifyContent: "center",
                margin: "25%",
                marginTop: "5%",
                marginBottom: "10%",
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
      <TouchableOpacity onPress={closeCameraPreview} style={styles.closeButton}>
        <Text style={styles.buttonText}>X</Text>
      </TouchableOpacity>

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
    marginVertical: 10,
    width: (screenWidth * 66) / 200,
    height: (screenHeight * 6.6) / 200,
    backgroundColor: "black",
    borderRadius: 15,
    paddingHorizontal: 10,
    marginLeft: "10%",
    color: "white",
  },
});

export default MyCameraPreview;
