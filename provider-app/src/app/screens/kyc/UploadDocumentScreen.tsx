import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import { uploadToCloudinary } from "../../../services/cloudinary.service";

const DOC_LABELS: Record<string, string> = {
  PROFILE_PHOTO: "Profile Photo",
  AADHAAR_FRONT: "Aadhaar Card (Front)",
  AADHAAR_BACK: "Aadhaar Card (Back)",
  PAN_CARD: "PAN Card",
  BANK_PROOF: "Bank Account Proof",
  SKILL_CERTIFICATE: "Skill Certificate",
  POLICE_VERIFICATION: "Police Verification",
  DRIVING_LICENSE: "Driving License",
  VEHICLE_RC: "Vehicle RC",
  VEHICLE_INSURANCE: "Vehicle Insurance",
};

const ALLOWED_TYPES = Object.keys(DOC_LABELS);

export default function UploadDocumentScreen({ route, navigation }: any) {
  const { type } = route.params;
  const normalizedType = type?.toUpperCase();
  const docLabel = DOC_LABELS[normalizedType] ?? normalizedType;

  const [file, setFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isDocFile = (uri: string) =>
    uri.endsWith(".pdf") || uri.endsWith(".doc") || uri.endsWith(".docx");

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const compressImage = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (!result.canceled) {
        setFile(await compressImage(result.assets[0].uri));
      }
    } catch {
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (!result.canceled) {
        setFile(await compressImage(result.assets[0].uri));
      }
    } catch {
      Alert.alert("Error", "Could not open camera.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setFile(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Could not open document picker.");
    }
  };

  const uploadDocument = async () => {
    if (!file) {
      Alert.alert("No file selected", "Please choose a document first.");
      return;
    }

    if (!ALLOWED_TYPES.includes(normalizedType)) {
      Alert.alert("Invalid document type");
      return;
    }

    try {
      setUploading(true);

      if (Platform.OS !== "web") {
        const fileInfo = await FileSystem.getInfoAsync(file);
        if (!fileInfo.exists) {
          Alert.alert("File not found");
          return;
        }
        const sizeMb = ((fileInfo as any).size ?? 0) / 1024 / 1024;
        if (sizeMb > 5) {
          Alert.alert("File too large", "Maximum size is 5 MB.");
          return;
        }
      }

      const fileUrl = await uploadToCloudinary(file);
      if (!fileUrl) throw new Error("Upload failed");

      await api.post("/providers/kyc/upload", { type: normalizedType, fileUrl });

      Alert.alert("Uploaded!", "Document saved successfully.");
      navigation.navigate("KycStatus");
    } catch {
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const isDoc = file && isDocFile(file);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Upload Document</Text>
          <Text style={styles.headerSub}>{docLabel}</Text>
        </View>
      </View>

      {/* Preview area */}
      <View style={styles.previewCard}>
        {file ? (
          <>
            {isDoc ? (
              <View style={styles.docPreview}>
                <View style={styles.docIconWrap}>
                  <Ionicons name="document-text" size={48} color="#6366F1" />
                </View>
                <Text style={styles.docName}>Document selected</Text>
                <Text style={styles.docHint}>PDF/DOC ready to upload</Text>
              </View>
            ) : (
              <Image source={{ uri: file }} style={styles.previewImage} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removeChip} onPress={() => setFile(null)}>
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.removeChipText}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <Ionicons name="document-attach-outline" size={44} color="#D1D5DB" />
            <Text style={styles.emptyPreviewText}>Document preview</Text>
          </View>
        )}
      </View>

      {/* Picker buttons */}
      <View style={styles.pickerRow}>
        <PickerBtn icon="camera-outline" label="Camera" onPress={takePhoto} disabled={uploading} />
        <PickerBtn icon="images-outline" label="Gallery" onPress={pickFromGallery} disabled={uploading} />
        <PickerBtn icon="document-outline" label="PDF/DOC" onPress={pickDocument} disabled={uploading} />
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Ionicons name="bulb-outline" size={16} color="#D97706" />
        <Text style={styles.tipsText}>
          Ensure the document is clear, well-lit, and all text is readable. Max size: 5 MB.
        </Text>
      </View>

      {/* Upload button */}
      <TouchableOpacity
        style={[styles.uploadBtn, (!file || uploading) && styles.uploadBtnDisabled]}
        onPress={uploadDocument}
        disabled={!file || uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>Upload Document</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Loading overlay */}
      {uploading && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.overlayText}>Uploading…</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PickerBtn({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.pickerBtn, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={styles.pickerIconWrap}>
        <Ionicons name={icon as any} size={22} color="#6366F1" />
      </View>
      <Text style={styles.pickerLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },

  previewCard: {
    margin: 16,
    height: 220,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: { width: "100%", height: "100%" },

  docPreview: { alignItems: "center", gap: 8 },
  docIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { fontSize: 14, fontWeight: "600", color: "#374151" },
  docHint: { fontSize: 12, color: "#9CA3AF" },

  removeChip: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  removeChipText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  emptyPreview: { alignItems: "center", gap: 8 },
  emptyPreviewText: { fontSize: 13, color: "#9CA3AF" },

  pickerRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  pickerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },

  tipsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 16,
    marginTop: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipsText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCard: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  overlayText: { fontSize: 14, fontWeight: "600", color: "#374151" },
});
