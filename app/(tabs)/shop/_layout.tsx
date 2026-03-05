import { Stack } from "expo-router";

export default function ShopStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]/kit"
        options={{
          headerShown: true,
          headerTitle: "Kit Details",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="[id]/uniform"
        options={{
          headerShown: true,
          headerTitle: "Uniform Details",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
