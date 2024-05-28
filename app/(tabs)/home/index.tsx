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
import {
  getImageRef,
  getSmallImageRef,
  months,
  screenWidth,
} from "../../constants";
import { Menu, MenuItem } from "react-native-material-menu";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebView from "react-native-webview";
import * as ImageManipulator from "expo-image-manipulator";

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
let webViewLoaded = false;
let base64strings = [];
let decryptedBase64image = [];

const HomePage = () => {
  const [categorizedImages, setCategorizedImages] = useState<{}>({});
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [decryptionReady, setDecryptionReady] = useState(false);
  const user = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const script = (base64s) => {
    for (let i = 1; i < base64s.length; i += 2) {
      const loadAndProcessImage = `
      (function() {
        const img = new Image();
        img.src = 'data:image/jpeg;base64,${base64s[i]}';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixelData = Array.from(imageData.data);
          pixelData.push(${i})
          window.ReactNativeWebView.postMessage(JSON.stringify(pixelData));
        };
      })();
    `;
      webViewRef.current.injectJavaScript(loadAndProcessImage);
    }
  };

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
              const manipResult = await ImageManipulator.manipulateAsync(
                image.smallUrl,
                [{ resize: { width: 100 } }],
                {
                  // format: ImageManipulator.SaveFormat.JPEG,
                  base64: true,
                }
              );
              if (!webViewLoaded) {
                base64strings = [
                  ...base64strings,
                  image.smallUrl,
                  manipResult.base64,
                ];
              } else if (base64strings.indexOf(manipResult.base64) === -1) {
                base64strings.push(image.smallUrl, manipResult.base64);
                const loadAndProcessImageFaster = `
                (function() {
                  const img = new Image();
                  img.src = 'data:image/jpeg;base64,${manipResult.base64}';
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const pixelData = Array.from(imageData.data);
                    pixelData.push(${base64strings.length - 1})
                    window.ReactNativeWebView.postMessage(JSON.stringify(pixelData));
                  };
                })();
              `;
                webViewRef.current.injectJavaScript(loadAndProcessImageFaster);
              }
            }
            const pKeys = Object.keys(categorizedImagesByPose);
            pKeys.sort((keyA, keyB) => {
              if (!keyA) return 1;
              if (!keyB) return -1;
              if (keyA < keyB) return -1;
              return 1;
            });
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

  const inspectImage = (image, index) => {
    const imageUrl = encodeURIComponent(image.url);
    const param = {
      url: imageUrl,
      smallUrl: encodeURIComponent(image.smallUrl),
      pose: image.pose,
      date: image.date,
      decryptedSmallUrl: decryptedBase64image[index],
    };
    router.push({ pathname: `/home/${imageUrl}`, params: param });
  };

  const deleteImage = async (image, index) => {
    decryptedBase64image.splice(index, 1);
    base64strings.splice(index * 2, 2);
    const imageRef = getImageRef(image.url);
    const smallImageRef = getSmallImageRef(image.smallUrl);
    deleteObject(imageRef)
      .then(() => {
        deleteObject(smallImageRef)
          .then(() => {
            Alert.alert("Image deleted.");
          })
          .catch((error) => {
            console.error(error);
          });
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
      const render = (
        <TouchableOpacity
          style={styles.imageWrapper}
          key={`${item}-${index}`}
          onPress={() => inspectImage(item, index)}
          onLongPress={() =>
            deleteImage(item, base64strings.indexOf(item.smallUrl) / 2)
          }
        >
          <Image
            source={{
              uri: `data:image/jpeg;base64,${
                decryptedBase64image[base64strings.indexOf(item.smallUrl) / 2]
              }`,
            }}
            style={styles.image}
          />
        </TouchableOpacity>
      );
      return render;
    },
    [inspectImage, deleteImage]
  );

  const renderCategory = useCallback(
    ({ item: category }) => (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category ? category : "None"}</Text>
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

  const onMessage = async (event) => {
    const webViewMessage = JSON.parse(event.nativeEvent.data);
    if (webViewMessage[0] != "/") {
      getDecryptedImageUrl(webViewMessage);
    } else {
      decryptedBase64image.push(webViewMessage);
    }
    let i = 0;
    for (const key of Object.keys(categorizedImages)) {
      for (const val of categorizedImages[key]) {
        i++;
      }
    }
    if (decryptedBase64image.length == i) {
      setDecryptionReady(!decryptionReady);
    }
  };

  const getDecryptedImageUrl = (webViewMessage) => {
    let newPixels = webViewMessage;
    for (let i = 0; i < newPixels.length - 1; i += 4) {
      newPixels[i] = 255 - newPixels[i]; // Invert Red
      newPixels[i + 1] = 255 - newPixels[i + 1]; // Invert Green
      newPixels[i + 2] = 255 - newPixels[i + 2]; // Invert Blue
    }
    const newPixelData = JSON.stringify(newPixels);
    webViewRef.current.injectJavaScript(`
    (function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = 'data:image/jpeg;base64,${
        base64strings[webViewMessage[webViewMessage.length - 1]]
      }';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const imageData = ctx.createImageData(img.width, img.height);
        const pixelData = ${newPixelData};
        for (let i = 0; i < pixelData.length - 1; i++) {
          imageData.data[i] = pixelData[i];
        }
        ctx.putImageData(imageData, 0, 0);
        const newBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        window.ReactNativeWebView.postMessage(JSON.stringify(newBase64));
      };
    })();
  `);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        onMessage={onMessage}
        originWhitelist={["*"]}
        source={{
          html: "<html><body></body></html>",
        }}
        onLoad={() => {
          if (!webViewLoaded) {
            script(base64strings);
            webViewLoaded = true;
          }
        }}
        style={{ flex: 0 }}
      />
      {imageKeys.length > 0 ? (
        <View style={{ width: "100%" }}>
          <FlatList
            data={imageKeys}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            style={{ width: "100%" }}
          />
        </View>
      ) : (
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
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
    backgroundColor: "transparent",
    flexDirection: "row",
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
