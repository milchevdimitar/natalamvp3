import React, { useState } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { T } from '../components/UI';

const { width, height } = Dimensions.get('window');

export function StoryViewer() {
  const { stories, colors, deleteStory } = useApp();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Безопасно форматиране на ISO датата от MongoDB към ЧЧ:ММ
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const handleDelete = async (id: string) => {
    setSelectedIndex(null);
    await deleteStory(id);
  };

  if (!stories || stories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <T muted size={12}>
          Все още няма активни сторита от последните 24 часа.
        </T>
      </View>
    );
  }

  const activeStory = selectedIndex !== null ? stories[selectedIndex] : null;

  return (
    <>
      {/* Хоризонтална лента с аватари */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story._id || index.toString()}
            onPress={() => setSelectedIndex(index)}
            style={styles.storyCircleButton}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarBorder, { borderColor: colors.gold }]}>
              <Image
                source={{ uri: story.imageUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            <T
              bold
              size={11}
              numberOfLines={1}
              style={{ color: colors.text, textAlign: 'center', marginTop: 4, width: '100%' }}
            >
              {story.authorName || 'Stargazer'}
            </T>
            <T size={9} muted style={{ textAlign: 'center' }}>
              {formatTime(story.createdAt)}
            </T>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fullscreen Преглед на избраното стори */}
      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <SafeAreaView style={styles.modalBackground}>
          {activeStory && (
            <View style={styles.fullStoryContainer}>
              {/* Информация за автора и часа */}
              <View style={styles.headerBar}>
                <T bold size={14} style={{ color: '#FFFFFF' }}>
                  {activeStory.authorName || 'Stargazer'}
                </T>
                <T size={11} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {formatTime(activeStory.createdAt)}
                </T>
              </View>

              {/* Бутон Изтриване */}
              <TouchableOpacity
                onPress={() => handleDelete(activeStory._id)}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Trash2 color="#FF4D4D" size={20} />
              </TouchableOpacity>

              {/* Бутон Затваряне */}
              <TouchableOpacity
                onPress={() => setSelectedIndex(null)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X color="#FFFFFF" size={22} />
              </TouchableOpacity>

              {/* Изображение на сторито */}
              <Image
                source={{ uri: activeStory.imageUrl }}
                style={styles.fullStoryImage}
                resizeMode="contain"
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 14,
    paddingVertical: 8,
  },
  storyCircleButton: {
    alignItems: 'center',
    width: 72,
  },
  avatarBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullStoryContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerBar: {
    position: 'absolute',
    top: 52,
    left: 20,
    zIndex: 10,
    gap: 2,
  },
  fullStoryImage: {
    width: width * 0.95,
    height: height * 0.82,
    borderRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 50,
    right: 66,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    borderRadius: 20,
  },
});