import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../config/firebase";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    AsyncStorage.getItem("onboardingDone").then(() => setReady(true));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing || !ready) return;

    const route = async () => {
      const val = await AsyncStorage.getItem("onboardingDone");
      const onboardingDone = val === "true";

      const inOnboarding = segments[0] === "onboarding";
      const inAuthGroup = ["login", "register", "auth-choice", "index"].includes(segments[0] as string);

      if (!onboardingDone && !user && !inOnboarding) {
        router.replace("/onboarding");
        return;
      }

      if (!user && !inAuthGroup && !inOnboarding) {
        router.replace("/");
      } else if (user && (inAuthGroup || inOnboarding)) {
        router.replace("/dashboard");
      }
    };

    route();
  }, [user, initializing, ready, segments]);

  if (initializing || !ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1220' }}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth-choice" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
