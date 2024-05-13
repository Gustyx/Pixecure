import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
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
import {
  imageFolderPath,
  screenWidth,
  keys,
  screenHeight,
  ImageDetails,
  imageDetails,
} from "../../constants";
import { ImageSize } from "expo-camera";
import ImagePreview from "../../imagePreview";

const MyCameraPreview = ({ onExitPreview, imageUri }) => {
  const [imageScale, setImageScale] = useState<number>(1);
  const [displayDetails, setDisplayDetails] = useState<boolean>(false);
  const [thisImageDetails, setThisImageDetails] =
    useState<ImageDetails>(imageDetails);
  const date: Date = new Date(Date.now());

  useEffect(() => {
    const fetchImageSize = async () => {
      try {
        const { width, height }: ImageSize = await new Promise(
          (resolve, reject) => {
            Image.getSize(
              imageUri,
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

  const closeCameraPreview = () => {
    onExitPreview();
  };

  const onDetailsTextChange = (key, value) => {
    const updatedDetails: ImageDetails = { ...thisImageDetails };
    updatedDetails[key] = value;
    setThisImageDetails(updatedDetails);
  };

  const saveImage = () => {
    if (!displayDetails) setDisplayDetails(true);
    else if (imageUri) {
      const currentUserId = auth.currentUser?.uid;
      const userRef = doc(db, "users", currentUserId);
      // const imagesCollectionRef = collection(userRef, "images");
      const imageName = imageUri.match(/([^\/]+)(?=\.\w+$)/)[0];
      thisImageDetails["date"] = date.toLocaleDateString();

      const metadata = {
        customMetadata: { ...thisImageDetails },
      };

      uploadImage(imageUri, imageName, metadata)
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
      <Stack.Screen options={{ headerTitle: "Preview Picture" }} />
      {!displayDetails ? (
        <ImageBackground
          source={{ uri: imageUri }}
          style={{
            width: screenWidth,
            height: screenWidth * imageScale,
            alignSelf: "center",
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
              source={{ uri: imageUri }}
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
                      value={thisImageDetails[key]}
                      onChangeText={(value) => onDetailsTextChange(key, value)}
                      autoCapitalize="sentences"
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.input}>
                      {date.toLocaleDateString()}
                    </Text>
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
    backgroundColor: "white",
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

export default MyCameraPreview;
