import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
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
import WebView from "react-native-webview";

let key;
AsyncStorage.getItem("sortingKey").then((value) => {
  if (value) {
    key = value;
  } else {
    key = "Date";
  }
});
let imagesByPose = {};
let imagesByDate = {};
let poseKeys = [];
let dateKeys = [];

const HomePage = () => {
  const [categorizedImages, setCategorizedImages] = useState<{}>({});
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const user = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const webViewRef = useRef(null);

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
            const pKeys = Object.keys(categorizedImagesByPose);
            const dKeys = Object.keys(categorizedImagesByDate);
            dKeys.sort((keyA, keyB) => {
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
            imagesByPose = categorizedImagesByPose;
            imagesByDate = categorizedImagesByDate;
            poseKeys = pKeys;
            dateKeys = dKeys;
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

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const inspectImage = (image) => {
    const imageUrl = encodeURIComponent(image.url);
    const param = {
      url: imageUrl,
      smallUrl: encodeURIComponent(image.smallUrl),
      pose: image.pose,
      date: image.date,
    };
    router.push({ pathname: `/home/${imageUrl}`, params: param });
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
        smallUrl: image.smallUrl,
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
    imagesByPose = newImagesByPose;
    imagesByDate = newImagesByDate;

    if (newImagesByPose[image.pose].length === 0) {
      const removePoseKey = poseKeys.filter((item) => item !== image.pose);
      poseKeys = removePoseKey;
      if (poseIsKey) {
        setImageKeys(removePoseKey);
      }
    }
    if (newImagesByDate[image.date].length === 0) {
      const removeDateKey = dateKeys.filter((item) => item !== image.date);
      dateKeys = removeDateKey;
      if (!poseIsKey) {
        setImageKeys(removeDateKey);
      }
    }

    if (poseIsKey) setCategorizedImages(newImagesByPose);
    else setCategorizedImages(newImagesByDate);
  };

  const renderImage = useCallback(
    ({ item, index }) => {
      // console.log(item.smallUrl);
      const render = (
        <TouchableOpacity
          style={styles.imageWrapper}
          key={`${item}-${index}`}
          onPress={() => inspectImage(item)}
          onLongPress={() => deleteImage(item)}
        >
          <Image source={{ uri: item.smallUrl }} style={styles.image} />
          {/* <WebView
          originWhitelist={["*"]}
          source={{
            html: `
          <html>
            <body style="margin:0;padding:0;">
              <img id="originalImage" src="${item.url}" style="width: 20%;" />
              <script>
                (function() {
                  const img = document.getElementById('originalImage');
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const pixelData = imageData.data;

                    // Revert pixel changes (assuming simple inversion used for modification)
                    for (let i = 0; i < pixelData.length; i += 4) {
                      pixelData[i] = 255 - pixelData[i];       // Revert Red
                      pixelData[i + 1] = 255 - pixelData[i + 1]; // Revert Green
                      pixelData[i + 2] = 255 - pixelData[i + 2]; // Revert Blue
                    }

                    ctx.putImageData(imageData, 0, 0);
                    const originalBase64 = canvas.toDataURL('image/jpeg');
                    img.src = originalBase64;
                  };
                })();
              </script>
            </body>
          </html>
        `,
          }}
          style={styles.image}
        /> */}
        </TouchableOpacity>
      );
      return render;
    },
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

  const revertPixelsScript = (url) => `
    (function() {
      const img = new Image();
      img.src = '${url}';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixelData = imageData.data;

        // Revert pixel changes (assuming simple inversion used for modification)
        for (let i = 0; i < pixelData.length; i += 4) {
          pixelData[i] = 255 - pixelData[i];       // Revert Red
          pixelData[i + 1] = 255 - pixelData[i + 1]; // Revert Green
          pixelData[i + 2] = 255 - pixelData[i + 2]; // Revert Blue
        }

        ctx.putImageData(imageData, 0, 0);
        const originalBase64 = canvas.toDataURL('image/png');
        document.body.innerHTML = '<img src="' + originalBase64 + '" style="width: 100%;" />';
      };
    })();
  `;

  // const renderItem = useCallback(
  //   ({ item, index }) => (
  //     <WebView
  //       originWhitelist={["*"]}
  //       source={{
  //         html: `
  //         <html>
  //           <body style="margin:0;padding:0;">
  //             <img id="originalImage" src="${item.url}" style="width:100%;" />
  //             <script>
  //               (function() {
  //                 const img = document.getElementById('originalImage');
  //                 img.onload = () => {
  //                   const canvas = document.createElement('canvas');
  //                   canvas.width = img.width;
  //                   canvas.height = img.height;
  //                   const ctx = canvas.getContext('2d');
  //                   ctx.drawImage(img, 0, 0);
  //                   const imageData = ctx.getImageData(0, 0, img.width, img.height);
  //                   const pixelData = imageData.data;

  //                   // Revert pixel changes (assuming simple inversion used for modification)
  //                   for (let i = 0; i < pixelData.length; i += 4) {
  //                     pixelData[i] = 255 - pixelData[i];       // Revert Red
  //                     pixelData[i + 1] = 255 - pixelData[i + 1]; // Revert Green
  //                     pixelData[i + 2] = 255 - pixelData[i + 2]; // Revert Blue
  //                   }

  //                   ctx.putImageData(imageData, 0, 0);
  //                   const originalBase64 = canvas.toDataURL('image/png');
  //                   img.src = originalBase64;
  //                 };
  //               })();
  //             </script>
  //           </body>
  //         </html>
  //       `,
  //       }}
  //       style={styles.image}
  //     />
  //   ),
  //   [inspectImage, deleteImage]
  // );

  return (
    <View style={{ flex: 1 }}>
      {imageKeys.length > 0 ? (
        <View style={styles.container}>
          <FlatList
            data={imageKeys}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            style={{ width: "100%" }}
          />
        </View>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>No images to display.</Text>
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
    // flex: 1,
    // justifyContent: "center",
    alignItems: "center",
  },
});

export default withAuthentication(HomePage);
