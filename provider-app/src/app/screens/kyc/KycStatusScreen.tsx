import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { api } from "../../../services/api";
import { ProviderDocument } from "../../../types/kyc";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/auth.store";

const REQUIRED_DOCS = [
  "PROFILE_PHOTO",
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PAN_CARD",
  "BANK_PROOF",
];

const DOC_LABELS: Record<string, string> = {
  PROFILE_PHOTO: "Profile Photo",
  AADHAAR_FRONT: "Aadhaar Card (Front)",
  AADHAAR_BACK: "Aadhaar Card (Back)",
  PAN_CARD: "PAN Card",
  BANK_PROOF: "Bank Account Proof",
};

export default function KycStatusScreen() {
  const [docs, setDocs] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigation = useNavigation<any>();
  const kycStatus = useAuthStore((s) => s.kycStatus);
  const refreshKycStatus = useAuthStore((s) => s.refreshKycStatus);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/providers/kyc/documents");
      setDocs(res.data);
    } catch (e) {
      console.log("KYC load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshKycStatus();
    }, [])
  );

  const submitKyc = async () => {
    try {
      setSubmitting(true);
      await api.post("/providers/kyc/submit");
      await refreshKycStatus();
      navigation.navigate("VerificationPending");
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Submission failed. Please try again.";
      console.log("KYC submit error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getDocForType = (type: string) => docs.find((d) => d.type === type);

  /** Non-rejected docs count as "completed" for progress */
  const completedDocs = REQUIRED_DOCS.filter((type) =>
    docs.some((d) => d.type === type && d.status !== "REJECTED")
  ).length;

  const allUploaded = completedDocs === REQUIRED_DOCS.length;
  const hasRejected = REQUIRED_DOCS.some(
    (type) => getDocForType(type)?.status === "REJECTED"
  );

  // Show submit only when all docs uploaded AND not already awaiting review
  const showSubmit = allUploaded && kycStatus !== "PENDING";
  const isResubmit = kycStatus === "REJECTED" && allUploaded;

  const canNavigateBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        {canNavigateBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Verify Your Identity</Text>
          <Text style={styles.headerSub}>Step 2 of 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        <Text style={styles.subtitle}>
          Upload all required documents to start receiving jobs.
        </Text>

        {/* Awaiting Review Banner */}
        {kycStatus === "PENDING" && !hasRejected && (
          <View style={[styles.bannerCard, { backgroundColor: "#FEF9C3", borderColor: "#FDE047" }]}>
            <Ionicons name="time-outline" size={20} color="#CA8A04" />
            <Text style={[styles.bannerText, { color: "#92400E" }]}>
              Your documents are under review. We'll notify you once verified (24–48 hrs).
            </Text>
          </View>
        )}

        {/* Rejected Banner */}
        {hasRejected && (
          <View style={[styles.bannerCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={[styles.bannerText, { color: "#991B1B" }]}>
              Some documents were rejected. Please re-upload them and resubmit.
            </Text>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>KYC Progress</Text>
          <Text style={styles.progressText}>
            {completedDocs} / {REQUIRED_DOCS.length} documents uploaded
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedDocs / REQUIRED_DOCS.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Document List */}
        {REQUIRED_DOCS.map((type) => {
          const doc = getDocForType(type);
          const isRejected = doc?.status === "REJECTED";
          const isPending = doc?.status === "PENDING";
          const isApproved = doc?.status === "APPROVED";
          // Allow re-upload only for rejected or not-yet-uploaded docs
          const canUpload = isRejected || !doc;

          return (
            <View
              key={type}
              style={[
                styles.card,
                isRejected && styles.cardRejected,
                isApproved && styles.cardApproved,
              ]}
            >
              <View style={styles.row}>
                <Text style={styles.docTitle}>{DOC_LABELS[type] ?? type}</Text>
                {isApproved && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
                {isPending && <Ionicons name="time" size={22} color="#F59E0B" />}
                {isRejected && <Ionicons name="close-circle" size={22} color="#EF4444" />}
                {!doc && <Ionicons name="ellipse-outline" size={22} color="#9CA3AF" />}
              </View>

              <Text
                style={[
                  styles.status,
                  isApproved && { color: "#22C55E" },
                  isPending && { color: "#F59E0B" },
                  isRejected && { color: "#EF4444", fontWeight: "600" },
                ]}
              >
                {isApproved && "Approved"}
                {isPending && "Under Review"}
                {isRejected && "Rejected — tap to re-upload"}
                {!doc && "Not Uploaded"}
              </Text>

              {/* Rejection reason */}
              {doc?.rejectionReason && (
                <View style={styles.rejectionBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#DC2626" />
                  <Text style={styles.rejectionText}>{doc.rejectionReason}</Text>
                </View>
              )}

              {/* Image preview */}
              {doc?.fileUrl && doc.fileUrl.includes("/image/") && (
                <Image source={{ uri: doc.fileUrl }} style={styles.thumbnail} />
              )}

              {/* View document */}
              {doc?.fileUrl && (
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => Linking.openURL(doc.fileUrl)}
                >
                  <Ionicons name="eye-outline" size={16} color="#2563EB" />
                  <Text style={styles.previewText}>View Document</Text>
                </TouchableOpacity>
              )}

              {/* Upload / Re-upload button */}
              {canUpload && (
                <TouchableOpacity
                  style={[styles.uploadBtn, isRejected && styles.uploadBtnReject]}
                  onPress={() => navigation.navigate("UploadDocument", { type })}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isRejected ? "refresh-outline" : "cloud-upload-outline"}
                    size={16}
                    color={isRejected ? "#DC2626" : "#2563EB"}
                  />
                  <Text
                    style={[styles.uploadBtnText, isRejected && { color: "#DC2626" }]}
                  >
                    {isRejected ? "Re-upload Document" : "Upload Document"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Submit / Re-submit KYC Button */}
        {showSubmit && (
          <TouchableOpacity
            style={[styles.submitBtn, isResubmit && styles.submitBtnResubmit, submitting && { opacity: 0.6 }]}
            onPress={submitKyc}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isResubmit ? "refresh-circle-outline" : "checkmark-circle-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.submitText}>
              {submitting
                ? "Submitting..."
                : isResubmit
                ? "Re-submit for Verification"
                : "Submit KYC for Verification"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Once all documents are uploaded, verification usually takes less than 24 hours.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },

  container: { flex: 1, padding: 16 },

  subtitle: { color: "#6B7280", marginBottom: 12 },

  bannerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19 },

  progressCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  progressTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  progressText: { marginTop: 6, color: "#6B7280" },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    marginTop: 10,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#2563EB",
    borderRadius: 10,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardRejected: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F8",
  },
  cardApproved: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FFF4",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docTitle: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  status: { marginTop: 4, fontSize: 13, color: "#6B7280" },

  rejectionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  rejectionText: { flex: 1, fontSize: 12, color: "#DC2626", lineHeight: 17 },

  thumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginTop: 10,
  },

  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  previewText: { color: "#2563EB", fontWeight: "500", fontSize: 13 },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
  },
  uploadBtnReject: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 14,
  },
  submitBtnResubmit: {
    backgroundColor: "#2563EB",
  },
  submitText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  infoCard: {
    marginTop: 16,
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1E40AF",
  },
});
