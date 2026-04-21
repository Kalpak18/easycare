import { View, Text, TouchableOpacity } from 'react-native';
import { ProviderDocument } from '../../../../types/kyc';

interface Props {
  type: string;
  document?: ProviderDocument;
  onUpload: () => void;
}

export default function DocumentCard({ type, document, onUpload }: Props) {
  const status = document?.status ?? 'NOT_UPLOADED';

  const statusColor =
    status === 'APPROVED'
      ? '#28a745'
      : status === 'REJECTED'
      ? '#dc3545'
      : '#ffc107';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600' }}>
        {type.replace('_', ' ')}
      </Text>

      <Text style={{ marginTop: 4, color: statusColor }}>
        Status: {status}
      </Text>

      {document?.rejectionReason && (
        <Text style={{ color: '#dc3545', marginTop: 4 }}>
          {document.rejectionReason}
        </Text>
      )}

      <TouchableOpacity
        onPress={onUpload}
        style={{ marginTop: 10 }}
      >
        <Text style={{ color: '#007bff', fontWeight: '600' }}>
          {document ? 'Re-upload' : 'Upload'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
