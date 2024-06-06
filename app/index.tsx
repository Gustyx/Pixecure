import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { aes, aes1by1, aesDecrypt, aesDecrypt1by1 } from "./aes";

const Home = () => {
  const router = useRouter();

  // let pixels = [
  //   111, 200, 16, 255, 111, 24, 16, 255, 111, 24, 189, 255, 111, 24, 16, 255,
  //   39, 24, 39, 255, 111, 24, 16, 255, 111, 24, 16, 255, 111, 24, 200, 255, 111,
  //   24, 189, 255, 111, 24, 16, 255, 111, 189, 16, 255, 200, 39, 16, 255, 111,
  //   24, 16, 255, 111, 24, 16, 255, 189, 39, 200, 255, 111, 24, 16, 255,
  // ];
  // let newPixels = [];
  // let p = [];
  // let round = 0;
  // for (let i = 0; i < pixels.length; i++) {
  //   if ((i + 1) % 4 !== 0) {
  //     p.push(pixels[i]);
  //   }
  //   if (p.length === 16) {
  //     let enc = aes1by1(p, "Thats my Kung Fu", round % 11);
  //     p = [];
  //     ++round;
  //     for (let j = 0; j < 16; j++) {
  //       newPixels.push(enc[j]);
  //       if ((newPixels.length + 1) % 4 === 0) {
  //         newPixels.push(255);
  //       }
  //     }
  //   }
  // }

  // let newPixels2 = [];
  // p = [];
  // round = 0;
  // for (let i = 0; i < newPixels.length; i++) {
  //   if ((i + 1) % 4 !== 0) {
  //     p.push(newPixels[i]);
  //   }
  //   if (p.length === 16) {
  //     let enc = aesDecrypt1by1(p, "Thats my Kung Fu", round % 11);
  //     p = [];
  //     ++round;
  //     for (let j = 0; j < 16; j++) {
  //       newPixels2.push(enc[j]);
  //       if ((newPixels2.length + 1) % 4 === 0) {
  //         newPixels2.push(255);
  //       }
  //     }
  //   }
  // }
  // console.log("______________________");
  // console.log(newPixels);
  // console.log(newPixels2);

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
