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
import { Menu, MenuItem } from "react-native-material-menu";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

let key;
AsyncStorage.getItem("sortingKey").then((value) => {
  if (value) {
    key = value;
  } else {
    key = "Date";
  }
});
const HomePage = () => {
  const [categorizedImages, setCategorizedImages] = useState({});
  const [imagesByPose, setImagesByPose] = useState({});
  const [imagesByDate, setImagesByDate] = useState({});
  const [imageKeys, setImageKeys] = useState([]);
  const [poseKeys, setPoseKeys] = useState([]);
  const [dateKeys, setDateKeys] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuth();
  const navigation = useNavigation();

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
              const pose = image.pose;
              const date = image.date;
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
              const [monthA, yearA] = keyA.split(" - ");
              const [monthB, yearB] = keyB.split(" - ");
              if (yearA !== yearB) {
                return parseInt(yearA) > parseInt(yearB) ? -1 : 1;
              }
              if (monthA !== monthB) {
                return months.indexOf(monthA) > months.indexOf(monthB) ? -1 : 1;
              }
              return 0;
            });
            setImagesByPose(categorizedImagesByPose);
            setImagesByDate(categorizedImagesByDate);
            setPoseKeys(poseKeys);
            setDateKeys(dateKeys);
            if (key === "Pose") {
              setCategorizedImages(categorizedImagesByPose);
              setImageKeys(poseKeys);
            } else {
              setCategorizedImages(categorizedImagesByDate);
              setImageKeys(dateKeys);
            }
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error getting document:", error);
        } finally {
          setLoading(false);
        }
      };

      getImages();
    }, [])
  );

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const inspectImage = (image) => {
    const imageUrl = encodeURIComponent(image.url);
    router.push({ pathname: `/home/${imageUrl}` });
  };

  const deleteImage = async (image) => {
    const imageRef = getImageRef(image.url);
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
      images: arrayRemove({
        url: image.url,
        pose: image.pose,
        date: image.date,
      }),
    });

    const poseIsKey = categorizedImages[image.pose];
    let newImagesByPose = { ...imagesByPose };
    newImagesByPose[image.pose] = newImagesByPose[image.pose].filter(
      (item) =>
        !(
          item.url === image.url &&
          item.pose === image.pose &&
          item.date === image.date
        )
    );
    let newImagesByDate = { ...imagesByDate };
    newImagesByDate[image.date] = newImagesByDate[image.date].filter(
      (item) =>
        !(
          item.url === image.url &&
          item.pose === image.pose &&
          item.date === image.date
        )
    );

    if (newImagesByPose[image.pose].length === 0) {
      const removePoseKey = poseKeys.filter((item) => item !== image.pose);
      setPoseKeys(removePoseKey);
      setImageKeys(removePoseKey);
    }
    if (newImagesByDate[image.date].length === 0) {
      const removeDateKey = dateKeys.filter((item) => item !== image.date);
      setDateKeys(removeDateKey);
      setImageKeys(removeDateKey);
    }
    setImagesByPose(newImagesByPose);
    setImagesByDate(newImagesByDate);

    if (poseIsKey) {
      setCategorizedImages(newImagesByPose);
    } else {
      setCategorizedImages(newImagesByDate);
    }
  };

  const handleSortChange = async (newKey) => {
    try {
      await AsyncStorage.setItem("sortingKey", newKey);
      key = newKey;
      if (newKey === "Pose") {
        setImageKeys(poseKeys);
        setCategorizedImages(imagesByPose);
      } else {
        setImageKeys(dateKeys);
        setCategorizedImages(imagesByDate);
      }
    } catch (error) {
      console.error("Failed to save sorting key:", error);
    }
    closeMenu();
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
          style={{
            flex: 1,
          }}
        />
      </View>
    ),
    [categorizedImages]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          anchor={
            <TouchableOpacity onPress={openMenu}>
              <Text>Sorted by: {key}</Text>
            </TouchableOpacity>
          }
          onRequestClose={closeMenu}
        >
          <MenuItem
            onPress={() => {
              handleSortChange("Date");
            }}
          >
            Date
          </MenuItem>
          <MenuItem
            onPress={() => {
              handleSortChange("Pose");
            }}
          >
            Pose
          </MenuItem>
        </Menu>
      ),
    });
  }, [navigation, menuVisible]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {imageKeys.length > 0 ? (
        <FlatList
          data={imageKeys}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          style={{ width: "100%" }}
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
