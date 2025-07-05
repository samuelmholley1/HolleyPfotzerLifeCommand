import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TaskList: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks</Text>
      <Text style={styles.empty}>No tasks yet.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
});

export default TaskList;
