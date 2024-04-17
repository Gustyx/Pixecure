import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { auth } from "../../firebase.config";
import { onAuthStateChanged, User } from "firebase/auth";

const useAuth = () => {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User>();

  // Handle user state changes
  //   const onAuthStateChanged = (user) => {
  //     setUser(user);
  //     if (initializing) setInitializing(false);
  //   };

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return subscriber;
  }, []);

  if (initializing) return null;

  //   if (!user) {
  //     return (
  //       <View>
  //         <Text>Login</Text>
  //       </View>
  //     );
  //   }

  //   return (
  //     <View>
  //       <Text>Welcome {user.email}</Text>
  //     </View>
  //   );

  return user;
};

export default useAuth;
