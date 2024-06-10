import { auth, db } from "../firebase.config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { screenHeight, screenWidth } from "./constants";

const RegisterPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const signUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async () => {
        Alert.alert("User created successfully!");
        const uid = auth.currentUser?.uid;
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          images: [],
        })
          .then(() => {
            router.replace("/home");
          })
          .catch((error) => {
            Alert.alert("Error:", error.message);
          });
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          Alert.alert("That email address is already in use!");
        }

        if (error.code === "auth/invalid-email") {
          Alert.alert("That email address is invalid!");
        }
        console.error(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Create Account</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor={"white"}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={"white"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      <TouchableOpacity onPress={signUp} style={styles.signupButton}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    marginVertical: 10,
    width: (screenWidth * 66) / 100,
    height: (screenHeight * 6.6) / 100,
    backgroundColor: "black",
    borderRadius: 15,
    paddingHorizontal: 10,
    color: "white",
  },
  signupButton: {
    backgroundColor: "black",
    marginTop: 20,
    width: (screenWidth * 66) / 100,
    height: (screenHeight * 7.5) / 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },
  buttonText: {
    color: "white",
  },
});

export default RegisterPage;
