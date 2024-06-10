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
import { useFocusEffect, useRouter } from "expo-router";
import withAuthentication from "../../hocs/withAuthentication";
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase.config";
import { deleteObject } from "firebase/storage";
import {
  getImageRef,
  getSmallImageRef,
  imagesPerRow,
  loadBase64andSendPixelsScriptWithIndex,
  loadPixelsAndSendNewBase64Script,
  months,
  screenWidth,
} from "../../constants";
import { Menu, MenuItem } from "react-native-material-menu";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebView from "react-native-webview";
import * as ImageManipulator from "expo-image-manipulator";
import { aesDecrypt, generateRoundKeys } from "../../aes";
import * as Crypto from "expo-crypto";

let key;
AsyncStorage.getItem("sortingKey").then((value) => {
  if (value) {
    key = value;
  } else {
    key = "Date";
  }
});
let imagesByCategory = {};
let imagesByDate = {};
let categoryKeys = [];
let dateKeys = [];
let webViewLoaded = false;
let base64images = [];
let smallUrls = [];
let decryptedBase64images = [];

const HomePage = () => {
  const [imageState, setImageState] = useState({
    categorizedImages: {},
    imageKeys: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [rerenderAfterDecryption, setRerenderAfterDecryption] = useState(false);
  const [decryptionRoundKeys, setDecryptionRoundKeys] = useState([]);
  const router = useRouter();
  const navigation = useNavigation();
  const webViewRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const generateDecryptionKey = async () => {
        const uid = auth.currentUser.uid;
        const digest = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          uid + uid
        );

        let key = "";
        for (let i = 0; key.length < 16; ++i) {
          key =
            key +
            digest[uid.charCodeAt(uid.length - 1 - i) % 64] +
            digest[uid.charCodeAt(i) % 64];
        }

        const roundKeys = generateRoundKeys(key);
        setDecryptionRoundKeys(roundKeys);
      };

      const getImages = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (docSnap.exists()) {
            let categorizedImagesByCategory = {};
            let categorizedImagesByDate = {};
            const data = docSnap.data().images;
            if (data) {
              for (const image of data) {
                const category = image.category;
                const date = image.date;
                if (!categorizedImagesByCategory[category]) {
                  categorizedImagesByCategory[category] = [];
                }
                categorizedImagesByCategory[category].push(image);
                if (!categorizedImagesByDate[date]) {
                  categorizedImagesByDate[date] = [];
                }
                categorizedImagesByDate[date].push(image);
                const manipResult = await ImageManipulator.manipulateAsync(
                  image.smallUrl,
                  [],
                  {
                    format: ImageManipulator.SaveFormat.PNG,
                    base64: true,
                  }
                );
                if (!webViewLoaded) {
                  base64images.push(manipResult.base64);
                  smallUrls.push(image.smallUrl);
                } else if (base64images.indexOf(manipResult.base64) === -1) {
                  base64images.push(manipResult.base64);
                  smallUrls.push(image.smallUrl);
                  const script = loadBase64andSendPixelsScriptWithIndex(
                    manipResult.base64,
                    base64images.length - 1
                  );
                  webViewRef.current.injectJavaScript(script);
                }
              }
              const pKeys = Object.keys(categorizedImagesByCategory);
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
                  return months.indexOf(monthA) > months.indexOf(monthB)
                    ? -1
                    : 1;
                }
                return 0;
              });
              imagesByCategory = categorizedImagesByCategory;
              imagesByDate = categorizedImagesByDate;
              categoryKeys = pKeys;
              dateKeys = dKeys;
              if (key === "Category") {
                updateImageState(categorizedImagesByCategory, categoryKeys);
              } else {
                updateImageState(categorizedImagesByDate, dateKeys);
              }
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

      generateDecryptionKey();
      getImages();
    }, [])
  );

  const updateImageState = (newCategorizedImages, newImageKeys) => {
    setImageState({
      categorizedImages: newCategorizedImages,
      imageKeys: newImageKeys,
    });
  };
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleSortChange = async (newKey) => {
    try {
      await AsyncStorage.setItem("sortingKey", newKey);
      key = newKey;
      if (newKey === "Category") {
        updateImageState(imagesByCategory, categoryKeys);
      } else {
        updateImageState(imagesByDate, dateKeys);
      }
    } catch (error) {
      console.error("Failed to save sorting key:", error);
    }
    closeMenu();
  };

  const inspectImage = (image, index) => {
    const imageUrl = encodeURIComponent(image.url);
    const param = {
      url: imageUrl,
      smallUrl: encodeURIComponent(image.smallUrl),
      category: image.category,
      date: image.date,
      decryptedSmallUrl: decryptedBase64images[index],
    };
    router.push({ pathname: `/home/${imageUrl}`, params: param });
  };

  const deleteImage = async (image, index) => {
    decryptedBase64images.splice(index, 1);
    base64images.splice(index, 1);
    smallUrls.splice(index, 1);
    const imageRef = getImageRef(image.url);
    const smallImageRef = getSmallImageRef(image.smallUrl);
    deleteObject(imageRef)
      .then(() => {
        deleteObject(smallImageRef)
          .then(() => {
            Alert.alert("Image deleted.");
            console.log("Deleted", image.url);
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
        category: image.category,
        date: image.date,
      }),
    });

    imagesByCategory[image.category] = imagesByCategory[image.category].filter(
      (item) => !(item.url === image.url)
    );
    imagesByDate[image.date] = imagesByDate[image.date].filter(
      (item) => !(item.url === image.url)
    );
    if (imagesByCategory[image.category].length === 0) {
      categoryKeys = categoryKeys.filter((item) => item !== image.category);
    }
    if (imagesByDate[image.date].length === 0) {
      dateKeys = dateKeys.filter((item) => item !== image.date);
    }

    if (key === "Category") {
      updateImageState(imagesByCategory, categoryKeys);
    } else {
      updateImageState(imagesByDate, dateKeys);
    }
  };

  const onMessage = async (event) => {
    const webViewMessage = JSON.parse(event.nativeEvent.data);
    if (webViewMessage[0] != "i") {
      getDecryptedImageUrl(webViewMessage);
    } else {
      decryptedBase64images.push(webViewMessage);
    }
    setRerenderAfterDecryption(!rerenderAfterDecryption);
    // if (decryptedBase64images.length == base64images.length) {}
  };

  const getDecryptedImageUrl = (webViewMessage) => {
    let newPixels = [];
    let p = [];
    let round = 0;
    for (let i = 0; i < webViewMessage.length - 1; i++) {
      if ((i + 1) % 4 !== 0) {
        p.push(webViewMessage[i]);
      }
      if (p.length === 16) {
        let enc = aesDecrypt(p, decryptionRoundKeys, round);
        p = [];
        round = (round + 1) % 11;
        for (let j = 0; j < 16; j++) {
          newPixels.push(enc[j]);
          if ((newPixels.length + 1) % 4 === 0) {
            newPixels.push(255);
          }
        }
      }
    }

    const newPixelData = JSON.stringify(newPixels);
    const script = loadPixelsAndSendNewBase64Script(
      base64images[webViewMessage[webViewMessage.length - 1]],
      newPixelData
    );
    webViewRef.current.injectJavaScript(script);
  };

  const runScriptOnAllStrings = (strings) => {
    for (let i = 0; i < strings.length; i++) {
      const script = loadBase64andSendPixelsScriptWithIndex(strings[i], i);
      webViewRef.current.injectJavaScript(script);
    }
  };

  const renderImage = useCallback(({ item, index }) => {
    const render = (
      <TouchableOpacity
        style={styles.imageWrapper}
        key={`${item}-${index}`}
        onPress={() => inspectImage(item, smallUrls.indexOf(item.smallUrl))}
        onLongPress={() => deleteImage(item, smallUrls.indexOf(item.smallUrl))}
      >
        <Image
          source={{
            uri: `data:image/png;base64,${
              decryptedBase64images[smallUrls.indexOf(item.smallUrl)]
            }`,
          }}
          style={styles.image}
        />
      </TouchableOpacity>
    );
    return render;
  }, []);

  const renderCategory = useCallback(
    ({ item: category }) => (
      <View>
        <Text style={styles.categoryTitle}>{category ? category : "None"}</Text>
        <FlatList
          data={imageState.categorizedImages[category]}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item}-${index}`}
          numColumns={imagesPerRow}
          style={{
            flex: 1,
          }}
        />
      </View>
    ),
    [imageState]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          anchor={
            <TouchableOpacity onPress={openMenu}>
              <Text style={{ fontSize: 16 }}>Sorted by: {key}</Text>
            </TouchableOpacity>
          }
          onRequestClose={closeMenu}
        >
          <MenuItem
            onPress={() => {
              handleSortChange("Date");
            }}
            style={{ backgroundColor: "#d3d3d3" }}
          >
            Date
          </MenuItem>
          <MenuItem
            onPress={() => {
              handleSortChange("Category");
            }}
            style={{ backgroundColor: "#d3d3d3" }}
          >
            Category
          </MenuItem>
        </Menu>
      ),
    });
  }, [navigation, menuVisible]);

  if (loading) {
    return (
      <View style={styles.activityIndicator}>
        <ActivityIndicator size="large" color="#d3d3d3" />
      </View>
    );
  }

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
            runScriptOnAllStrings(base64images);
            webViewLoaded = true;
          }
        }}
        style={{ flex: 0 }}
      />
      {imageState.imageKeys.length > 0 ? (
        <View style={{ width: "100%" }}>
          <FlatList
            data={imageState.imageKeys}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            style={{ width: "100%" }}
          />
        </View>
      ) : (
        <View style={styles.noImages}>
          <Text style={styles.noImagesText}>No images to display.</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#708090",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 5,
    marginVertical: 5,
    color: "#fff",
  },
  imageWrapper: {
    padding: 1,
  },
  image: {
    width: screenWidth / imagesPerRow - 2,
    height: ((screenWidth / imagesPerRow - 2) * 4) / 3,
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#708090",
  },
  noImages: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#708090",
  },
  noImagesText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#fff",
  },
});

export default withAuthentication(HomePage);
