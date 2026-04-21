import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import KycHeader from "../../../components/kyc/KycHeader";

export default function DocumentChecklistScreen({ navigation }: any) {
 const docs = [
  {
    title: "Profile Photo",
    type: "PROFILE_PHOTO",
  },
  {
    title: "Aadhaar Card (Front)",
    type: "AADHAAR_FRONT",
  },
  {
    title: "Aadhaar Card (Back)",
    type: "AADHAAR_BACK",
  },
  {
    title: "PAN Card",
    type: "PAN_CARD",
  },
  {
    title: "Bank Proof",
    type: "BANK_PROOF",
  },
];

  return (
    <View style={styles.container}>
      <KycHeader
        title="Upload Documents"
        step="Step 2 of 3"
      />

      {docs.map((doc) => (
        <TouchableOpacity
          key={doc.type}
          style={styles.card}
          onPress={() =>
            navigation.navigate("UploadDocument", {
              type: doc.type,
              docName: doc.title,
            })
          }
        >
          <Text style={styles.title}>{doc.title}</Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
  },

  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 16,
    fontWeight: "500",
  },
});