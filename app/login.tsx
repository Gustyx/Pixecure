import { auth } from "../firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { screenHeight, screenWidth } from "./constants";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const signIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        router.replace("/home");
      })
      .catch((error) => {
        if (error.code === "auth/invalid-credential") {
          Alert.alert("Login credentials are invalid!");
        }
        if (error.code === "auth/invalid-email") {
          Alert.alert("That email address is invalid!");
        }
        console.error(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Log In</Text>
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
      <TouchableOpacity onPress={signIn} style={styles.loginButton}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          router.replace("/register");
        }}
        style={styles.createAccountButton}
      >
        <Text style={styles.createAccountButtonText}>
          Don't have an account? Sign Up
        </Text>
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
    marginBottom: 5,
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
  loginButton: {
    backgroundColor: "black",
    marginTop: 20,
    width: (screenWidth * 66) / 100,
    height: (screenHeight * 7.5) / 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
  },
  createAccountButton: {
    backgroundColor: "transparent",
    marginTop: 25,
    width: (screenWidth * 66) / 100,
    height: (screenHeight * 7.5) / 100 / 2,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountButtonText: {
    color: "black",
  },
});

export default LoginPage;
