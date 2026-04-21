import * as Location from "expo-location";
import { api } from "./api";

let locationSubscription: Location.LocationSubscription | null = null;

export const startLocationTracking = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    console.log("Location permission denied");
    return;
  }

  // Push current location immediately so Redis has valid coords right away.
  // Use last-known position first (instant) so we don't block on a GPS fix.
  // Fall back to a fresh fix with a 6s cap so we never hang here.
  try {
    let position = await Location.getLastKnownPositionAsync();

    if (!position) {
      position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("GPS timeout")), 6000)
        ),
      ]);
    }

    const { latitude, longitude } = position.coords;
    await api.post("/providers/location", { latitude, longitude });
  } catch (err: any) {
    console.log("Initial location push failed:", err?.message ?? err);
  }

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // every 10 seconds
      distanceInterval: 10,
    },
    async (location) => {
      const { latitude, longitude } = location.coords;

      try {
        await api.post("/providers/location", {
          latitude,
          longitude,
        });
      } catch (err: any) {
        // err.response is undefined for network errors (no connectivity, network change)
        // err.response exists for HTTP errors (4xx/5xx)
        if (err?.response) {
          console.log("Location update failed (HTTP)", err.response.status, err.response.data?.message);
        } else {
          console.log("Location update failed (network)", err?.code ?? err?.message);
        }
      }
    }
  );
};

export const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};