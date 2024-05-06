import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Camera } from "expo-camera";
import MyCamera from "./components/myCamera";
import RegisterPage from "./register";
import useAuth from "./hooks/useAuth";
import withAuthentication from "./hocs/withAuthentication";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.config";

const HomePage = () => {
  const router = useRouter();
  const user = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  useEffect(() => {
    // Retrieve the document from Firestore
    const getImageUrl = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser?.uid));
        if (docSnap.exists()) {
          // Get the image URL from the document data
          setImages(docSnap.data().images);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      }
    };

    getImageUrl();
  }, []);
  useEffect(() => {
    console.log("Images in useEffect:", images);
  }, [images]);

  // console.log("ax", user);
  const [startCamera, setStartCamera] = React.useState<boolean>(false);

  const __startCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setStartCamera(true);
    } else {
      Alert.alert("Access denied");
    }
  };

  const handleExitCamera = () => {
    setStartCamera(false);
  };

  return startCamera ? (
    <MyCamera onExitCamera={handleExitCamera} />
  ) : (
    <View style={styles.container}>
      {/* <ScrollView
        style={styles.ImageContainer}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
        horizontal={false}
      > */}
      {/* <Image
        style={styles.tinyLogo}
        source={{
          uri: images[4],
        }}
      />
      <ImageBackground
        source={{
          uri: "https://firebasestorage.googleapis.com/v0/b/fitnessprotrack.appspot.com/o/images%2Feab2405c7fe5?alt=media&token=2ac2a93d-1cc7-48e4-962a-b0aa9d19cc0b",
        }}
        style={styles.tinyLogo}
      /> */}
      {images.map((image, i) => {
        console.log(i, " ", image);
        return (
          <View
            style={{
              padding: 5,
            }}
            key={i}
          >
            <ImageBackground
              source={{ uri: image }}
              style={[
                styles.Image,
                {
                  width: i % 2 === 1 ? 150 : 95,
                  height: i % 2 === 1 ? 150 : 95,
                },
              ]}
            />
          </View>
        );
      })}
      {/* </ScrollView> */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={__startCamera} style={styles.button}>
          <Text style={styles.buttonText}>Take picture</Text>
        </TouchableOpacity>
      </View>
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
    marginHorizontal: 16,
    marginTop: 30,
    width: "100%",
  },
  Image: {
    shadowColor: "black",
    shadowOffset: {
      width: -10,
      height: 9,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
});

export default withAuthentication(HomePage);
