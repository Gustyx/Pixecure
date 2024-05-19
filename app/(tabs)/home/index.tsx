import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Text,
  FlatList,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import useAuth from "../../hooks/useAuth";
import withAuthentication from "../../hocs/withAuthentication";
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase.config";
import { deleteObject } from "firebase/storage";
import { getImageRef, months, screenWidth } from "../../constants";

const HomePage = () => {
  const router = useRouter();
  const user = useAuth();
  const [categorizedImages, setCategorizedImages] = useState({});
  // const [imagesByPose, setImagesByPose] = useState({});
  // const [imagesByDate, setImagesByDate] = useState({});
  const [imageKeys, setImagesKeys] = useState([]);
  // const [poseKeys, setPoseKeys] = useState([]);
  // const [dateKeys, setDateKeys] = useState([]);
  const [key, setKey] = useState("date");

  useFocusEffect(
    React.useCallback(() => {
      const getImages = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) {
            let categorizedImagesByPose = {};
            let categorizedImagesByDate = {};
            const data = docSnap.data().images;
            for (const image of data) {
              const date = image.date;
              const pose = image.pose;
              if (!categorizedImagesByPose[pose]) {
                categorizedImagesByPose[pose] = [];
              }
              categorizedImagesByPose[pose].push(image);
              if (!categorizedImagesByDate[date]) {
                categorizedImagesByDate[date] = [];
              }
              categorizedImagesByDate[date].push(image);
            }
            const poseKeys = Object.keys(categorizedImagesByPose);
            const dateKeys = Object.keys(categorizedImagesByDate);
            dateKeys.sort((keyA, keyB) => {
              const [yearA, monthA] = keyA.split(" - ");
              const [yearB, monthB] = keyB.split(" - ");
              if (yearA !== yearB) {
                return parseInt(yearA) > parseInt(yearB) ? -1 : 1;
              }
              if (monthA !== monthB) {
                return months.indexOf(monthA) > months.indexOf(monthB) ? -1 : 1;
              }
              return 0;
            });
            // setImagesByPose(categorizedImagesByPose);
            // setImagesByDate(categorizedImagesByDate);
            // setPoseKeys(poseKeys);
            // setDateKeys(dateKeys);
            if (key === "date") {
              setCategorizedImages(categorizedImagesByDate);
              setImagesKeys(dateKeys);
            } else if (key === "pose") {
              setCategorizedImages(categorizedImagesByPose);
              setImagesKeys(poseKeys);
            }
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error getting document:", error);
        }
      };

      getImages();
    }, [key])
  );

  const inspectImage = (item) => {
    const imageUrl = encodeURIComponent(item.url);
    router.push({ pathname: `/home/${imageUrl}` });
  };

  const deleteImage = async (item) => {
    const imageRef = getImageRef(item.url);
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
      images: arrayRemove({ url: item.url, pose: item.pose, date: item.date }),
    });

    let newImages = { ...categorizedImages };
    const itemToRemove = {
      url: item.url,
      pose: item.pose,
      date: item.date,
    };
    const poseIsKey = newImages[item.pose];

    newImages[poseIsKey ? item.pose : item.date] = newImages[
      poseIsKey ? item.pose : item.date
    ].filter(
      (item) =>
        !(
          item.url === itemToRemove.url &&
          item.pose === itemToRemove.pose &&
          item.date === itemToRemove.date
        )
    );
    if (newImages[poseIsKey ? item.pose : item.date].length === 0) {
      const removeKey = imageKeys.filter((item) =>
        poseIsKey ? item !== itemToRemove.pose : item !== itemToRemove.date
      );
      setImagesKeys(removeKey);
    }
    setCategorizedImages(newImages);
  };

  const renderImage = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        style={styles.imageWrapper}
        key={`${item}-${index}`}
        onPress={() => inspectImage(item)}
        onLongPress={() => deleteImage(item)}
      >
        <Image source={{ uri: item.url }} style={styles.image} />
      </TouchableOpacity>
    ),
    [inspectImage, deleteImage]
  );

  const renderCategory = useCallback(
    ({ item: category }) => (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <FlatList
          data={categorizedImages[category]}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item}-${index}`}
          numColumns={5}
        />
      </View>
    ),
    [categorizedImages]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (key === "pose") {
                  setKey("date");
                  // setCategorizedImages(imagesByDate);
                  // setImagesKeys(dateKeys);
                } else {
                  setKey("pose");
                  // setCategorizedImages(imagesByPose);
                  // setImagesKeys(poseKeys);
                }
              }}
            >
              <Text>Sort</Text>
            </TouchableOpacity>
          ),
        }}
      />
      {imageKeys.length > 0 ? (
        <FlatList
          data={imageKeys}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
        />
      ) : (
        <View style={styles.noImages}>
          <Text>No images to display</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "flex-start",
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
  categorySection: {
    // marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    marginVertical: 10,
  },
  imageWrapper: {
    padding: 1,
  },
  image: {
    width: screenWidth / 5 - 2,
    height: (screenWidth / 5 - 2) * 1.5,
  },
  noImages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default withAuthentication(HomePage);
