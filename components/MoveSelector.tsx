import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { Move } from '../types';

interface MoveSelectorProps {
  moves: Move[];
  selectedMove: Move | null;
  onSelect: (move: Move) => void;
}

export function MoveSelector({
  moves,
  selectedMove,
  onSelect,
}: MoveSelectorProps) {
  const [modalVisible, setModalVisible] = React.useState(false);

  const sortedMoves = [...moves].sort((a, b) => a.name.localeCompare(b.name));

  const handleSelect = (move: Move) => {
    onSelect(move);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Exercise</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedMove ? styles.selectedText : styles.placeholderText}>
          {selectedMove?.name || 'Select exercise...'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.moveList}>
              {sortedMoves.map((move) => (
                <TouchableOpacity
                  key={move.id}
                  style={[
                    styles.moveItem,
                    selectedMove?.id === move.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(move)}
                >
                  <Text
                    style={[
                      styles.moveText,
                      selectedMove?.id === move.id && styles.selectedMoveText,
                    ]}
                  >
                    {move.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  moveList: {
    padding: 8,
  },
  moveItem: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: '#e6f0ff',
  },
  moveText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMoveText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
