import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ProviderDocument } from "../../../types/kyc";
import { Ionicons } from "@expo/vector-icons";

const REQUIRED = [
  "PROFILE_PHOTO",
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PAN_CARD",
  "BANK_PROOF",
];

interface Props {
  documents: ProviderDocument[];
  onUpload: (type: string) => void;
  onRefresh: () => void;
}

export default function DocumentList({
  documents,
  onUpload,
  onRefresh,
}: Props) {
  const renderStatusIcon = (status?: string) => {
    if (status === "APPROVED")
      return (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color="#22C55E"
        />
      );

    if (status === "PENDING")
      return (
        <Ionicons
          name="time"
          size={20}
          color="#F59E0B"
        />
      );

    if (status === "REJECTED")
      return (
        <Ionicons
          name="close-circle"
          size={20}
          color="#EF4444"
        />
      );

    return (
      <Ionicons
        name="ellipse-outline"
        size={20}
        color="#9CA3AF"
      />
    );
  };

  const formatTitle = (type: string) =>
    type.replace("_", " ");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upload Required Documents
      </Text>

      {REQUIRED.map((type) => {
        const doc = documents.find(
          (d) => d.type === type
        );

        return (
          <TouchableOpacity
            key={type}
            style={styles.card}
            onPress={() => onUpload(type)}
          >
            <View style={styles.row}>
              <Text style={styles.docTitle}>
                {formatTitle(type)}
              </Text>

              {renderStatusIcon(doc?.status)}
            </View>

            <Text style={styles.status}>
              Status: {doc?.status ?? "NOT UPLOADED"}
            </Text>

            {doc?.rejectionReason && (
              <Text style={styles.rejection}>
                {doc.rejectionReason}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={onRefresh}
      >
        <Text style={styles.refreshText}>
          Refresh Status
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  docTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  status: {
    marginTop: 6,
    color: "#6B7280",
  },

  rejection: {
    marginTop: 6,
    color: "#EF4444",
  },

  refreshBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },

  refreshText: {
    color: "white",
    fontWeight: "600",
  },
});