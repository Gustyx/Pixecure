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
import { auth, db, storage } from "../../firebase.config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const MyCameraPreview = ({ onExitPreview, image }) => {
  const __closeCameraPreview = () => {
    onExitPreview();
  };
  const imageFolderPath = "images/";

  const saveImage = () => {
    if (image) {
      const currentUserId = auth.currentUser?.uid;
      const userRef = doc(db, "users", currentUserId);
      // const imagesCollectionRef = collection(userRef, "images");
      const imageName = image.uri.slice(-16, -4);
      const metadata = {
        customMetadata: {
          createdBy: currentUserId,
          description: "descriere",
        },
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
        })
        .catch((error) => {
          Alert.alert("Could not save image.");
          console.log(error);
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
