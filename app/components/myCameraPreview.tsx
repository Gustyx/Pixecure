import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { storage } from "../../firebase.config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const MyCameraPreview = ({ onExitPreview, image }) => {
  const __closeCameraPreview = () => {
    onExitPreview();
  };
  const imageFolderPath = "images/";

  const saveImage = () => {
    if (image) {
      const imageName = image.uri.slice(-16, -4);
      uploadImage(image.uri, imageName)
        .then((downloadURL) => {
          Alert.alert("Image saved.");
          console.log("Image saved. URL:", downloadURL);
        })
        .catch((error) => {
          Alert.alert("Could now save image.");
          console.log(error);
        });
    }
  };

  const uploadImage = async (uri, name) => {
    const respone = await fetch(uri);
    const blob = await respone.blob();
    const imageRef = ref(storage, imageFolderPath + name);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: image && image.uri }}
        style={{
          flex: 1,
        }}
      />
      <TouchableOpacity
        onPress={__closeCameraPreview}
        style={styles.closeButton}
      >
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
    top: "5%",
    right: "5%",
  },
  saveButton: {
    position: "absolute",
    bottom: "5%",
    right: "5%",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
  },
});

export default MyCameraPreview;
