import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { aes, aesDecrypt } from "./aes";

const Home = () => {
  const router = useRouter();

  const pixels = [
    78, 142, 203, 31, 194, 90, 221, 9, 165, 115, 238, 52, 33, 176, 217, 70, 78,
    142, 203, 31, 194, 90, 221, 9, 165, 115, 238, 52, 33, 176, 217, 70, 78, 142,
    203, 31, 194, 90, 221, 9, 165, 115, 238, 52, 33, 176, 217, 70,
  ];
  // console.log(pixels.length);
  const key = "Thats my Kung Fu";
  let encryptedPixels = [];
  for (let i = 0; i < pixels.length; i += 16) {
    // console.log(i);
    let p = aes(pixels.slice(i, i + 16), key);
    encryptedPixels = [...encryptedPixels, ...p];
  }
  let decryptedPixels = [];
  for (let i = 0; i < encryptedPixels.length; i += 16) {
    let p = aesDecrypt(encryptedPixels.slice(i, i + 16), key);
    decryptedPixels = [...decryptedPixels, ...p];
  }
  console.log("E:", encryptedPixels);
  console.log("D:", decryptedPixels);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.buttonText}>Create account</Text>
      </TouchableOpacity>
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
    margin: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Home;
