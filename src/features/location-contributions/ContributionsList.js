import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { db } from '../../services/firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function ContributionsList({ locationId }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      setLoading(true);
      try {
        const contribRef = collection(db, 'accessibleLocations', locationId, 'contributions');
        const q = query(contribRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        setContributions(data);
      } catch (e) {
        setContributions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContributions();
  }, [locationId]);

  if (loading) {
    return <ActivityIndicator color="#1976d2" style={{ marginVertical: 20 }} />;
  }
  if (contributions.length === 0) {
    return <Text style={styles.emptyText}>Nenhuma contribuição ainda.</Text>;
  }
  return (
    <FlatList
      data={contributions}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.userName}>{item.userName}</Text>
          {item.infoText ? <Text style={styles.infoText}>{item.infoText}</Text> : null}
          <View style={styles.imagesRow}>
            {item.images && item.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.image} />
            ))}
          </View>
          <Text style={styles.date}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ''}</Text>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  userName: { fontWeight: 'bold', color: '#1976d2', marginBottom: 4 },
  infoText: { fontSize: 15, color: '#333', marginBottom: 6 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  date: { fontSize: 11, color: '#888', marginTop: 2 },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 18 },
}); 