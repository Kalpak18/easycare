import { Platform } from "react-native";

export const uploadToCloudinary = async (uri: string) => {
  const data = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();

    data.append("file", blob);
  } else {
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: `kyc-${Date.now()}.jpg`,
    } as any);
  }

  data.append("upload_preset", "provider_kyc");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dgjnm9nua/image/upload",
    {
      method: "POST",
      body: data,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    console.log("Cloudinary error:", result);
    throw new Error("Cloudinary upload failed");
  }

  return result.secure_url;
};