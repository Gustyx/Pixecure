import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View, Image } from "react-native";

const Inspect = () => {
  const params = useLocalSearchParams();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Inspect Page" }} />
      <Image
        source={{ uri: url }}
        style={{
          flex: 1,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    flexDirection: "row",
    position: "relative",
  },
});

export default Inspect;
