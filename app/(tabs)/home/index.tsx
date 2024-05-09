import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import useAuth from "../../hooks/useAuth";
import withAuthentication from "../../hocs/withAuthentication";
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../firebase.config";
import { deleteObject, ref } from "firebase/storage";
import { imageFolderPath, screenWidth } from "../../constants";

const HomePage = () => {
  const router = useRouter();
  const user = useAuth();
  const [images, setImages] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const getImageUrl = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) {
            setImages(docSnap.data().images);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error getting document:", error);
        }
      };

      getImageUrl();
    }, [])
  );

  const inspectImage = (imageUrl) => {
    imageUrl = encodeURIComponent(imageUrl);
    router.push({ pathname: `/home/${imageUrl}` });
  };

  const deleteImage = async (url, index) => {
    const startIndex = url.indexOf("%2F") + 3;
    const endIndex = url.indexOf("?alt=media");
    const imageId = url.substring(startIndex, endIndex);
    const imageRef = ref(storage, imageFolderPath + imageId);
    deleteObject(imageRef)
      .then(() => {
        Alert.alert("Image deleted.");
      })
      .catch((error) => {
        console.error(error);
      });

    const currentUserId = auth.currentUser?.uid;
    const userRef = doc(db, "users", currentUserId);
    await updateDoc(userRef, {
      images: arrayRemove(url),
    });

    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.ImageContainer}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
        horizontal={false}
      >
        {images &&
          images.map((image, i) => {
            return (
              <TouchableOpacity
                style={{
                  padding: 1,
                }}
                key={i}
                onPress={() => inspectImage(image.toString())}
                onLongPress={() => deleteImage(image, i)}
              >
                <Image
                  source={{ uri: image }}
                  style={[
                    {
                      width: screenWidth / 5 - 2,
                      height: (screenWidth / 5 - 2) * 1.5,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 130,
    borderRadius: 4,
    backgroundColor: "#14274e",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  ImageContainer: {
    width: "100%",
  },
});

export default withAuthentication(HomePage);
