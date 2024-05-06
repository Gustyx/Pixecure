import { auth, db } from "../firebase.config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");

  const signUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async () => {
        Alert.alert("User created successfully!");
        // await addDoc(collection(db, "users"), {
        //   uid: auth.currentUser?.uid,
        // })
        //   .then(() => {
        //     router.replace("/home");
        //   })
        //   .catch((error) => {
        //     Alert.alert("Error:", error.message);
        //   });
        const uid = auth.currentUser?.uid;
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          uid: uid,
        });
        router.push("/home");
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
      <Text style={styles.expiryLabel}>Create Account</Text>
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
      <TouchableOpacity onPress={signUp} style={styles.loginButton}>
        <Text style={styles.signupText}>signUp</Text>
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
  expiryLabel: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    marginVertical: 10,
    width: (Dimensions.get("window").width * 66) / 100,
    height: (Dimensions.get("window").height * 6.6) / 100,
    backgroundColor: "black",
    borderRadius: 15,
    paddingHorizontal: 10,
    color: "white",
  },
  loginButton: {
    backgroundColor: "black",
    marginTop: 20,
    width: (Dimensions.get("window").width * 66) / 100,
    height: (Dimensions.get("window").height * 7.5) / 100,
    borderRadius: 15,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },
  signupText: {
    color: "white",
  },
});

export default RegisterPage;
