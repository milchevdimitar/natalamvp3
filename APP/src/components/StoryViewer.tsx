import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { X, Trash2, Heart, Send } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { T } from '../components/UI';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 секунди на стори

export function StoryViewer() {
  const { stories, colors, deleteStory } = useApp();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Допълнителни състояния за взаимодействия
  const [likedStories, setLikedStories] = useState<{ [key: string]: boolean }>({});
  const [replyText, setReplyText] = useState('');

  // Анимация за прогрес бара
  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentProgressValue = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Преди малко';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const hoursAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
      if (hoursAgo < 1) return 'Преди малко';
      return `${hoursAgo}ч`;
    } catch {
      return isoString;
    }
  };

  // Управление на таймера и прогреса на сторито
  useEffect(() => {
    if (selectedIndex !== null) {
      startProgress(STORY_DURATION);
    } else {
      progressAnim.setValue(0);
    }
  }, [selectedIndex]);

  const startProgress = (duration: number, fromValue = 0) => {
    progressAnim.setValue(fromValue);

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });

    animationRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });
  };

  // При задържане на пръста (Pause)
  const handlePressIn = () => {
    progressAnim.stopAnimation((value) => {
      currentProgressValue.current = value;
    });
  };

  // При пускане на пръста (Resume)
  const handlePressOut = () => {
    const remainingDuration = STORY_DURATION * (1 - currentProgressValue.current);
    startProgress(remainingDuration, currentProgressValue.current);
  };

  const handleNextStory = () => {
    if (selectedIndex === null) return;
    if (selectedIndex < stories.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(null); // Затваряне при приключване на всички сторита
    }
  };

  const handlePrevStory = () => {
    if (selectedIndex === null) return;
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else {
      startProgress(STORY_DURATION); // Презареждане на първото стори
    }
  };

  const handleDelete = async (id: string) => {
    setSelectedIndex(null);
    await deleteStory(id);
  };

  const toggleLike = (storyId: string) => {
    setLikedStories((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  };

  const handleShare = async (imageUrl: string) => {
    try {
      await Share.share({
        message: `Виж това стори в Natala! ${imageUrl}`,
      });
    } catch (error) {
      console.error('Грешка при споделяне:', error);
    }
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
  const isCurrentLiked = activeStory ? !!likedStories[activeStory._id] : false;

  return (
    <>
      {/* Хоризонтална лента със сторита (Facebook Card Style) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story._id || index.toString()}
            onPress={() => setSelectedIndex(index)}
            style={styles.fbStoryCard}
            activeOpacity={0.88}
          >
            {/* Фона на картата - Изображението на сторито */}
            <Image
              source={{ uri: story.imageUrl }}
              style={styles.fbCardImage}
              resizeMode="cover"
            />

            {/* Тъмен нюанс за по-добра видимост на текста */}
            <View style={styles.fbCardOverlay} />

            {/* Малък кръгъл аватар горе вляво */}
            <View style={[styles.fbAvatarBadge, { borderColor: colors.gold }]}>
              <Image
                source={{ uri: story.imageUrl }}
                style={styles.fbAvatarImage}
                resizeMode="cover"
              />
            </View>

            {/* Име на автора долу на картата */}
            <View style={styles.fbCardBottomInfo}>
              <T
                bold
                size={11}
                numberOfLines={2}
                style={styles.fbAuthorName}
              >
                {story.authorName || 'Stargazer'}
              </T>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fullscreen Преглед на избраното стори (Instagram Style) */}
      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <SafeAreaView style={styles.modalBackground}>
          {activeStory && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.fullStoryContainer}
            >
              {/* Главно изображение */}
              <Image
                source={{ uri: activeStory.imageUrl }}
                style={styles.fullStoryImage}
                resizeMode="cover"
              />

              {/* Прогрес ленти (Instagram Progress Bars) */}
              <View style={styles.progressContainer}>
                {stories.map((_, i) => {
                  let barWidth: any = '0%';
                  if (i < selectedIndex!) barWidth = '100%';
                  else if (i === selectedIndex) {
                    barWidth = progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    });
                  }

                  return (
                    <View key={i} style={styles.progressBarBackground}>
                      <Animated.View
                        style={[styles.progressBarFill, { width: barWidth }]}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Хедър с Автор, Време и Бутони */}
              <View style={styles.headerBar}>
                <View style={styles.userInfo}>
                  <View style={styles.smallAvatarBorder}>
                    <Image
                      source={{ uri: activeStory.imageUrl }}
                      style={styles.smallAvatar}
                    />
                  </View>
                  <T bold size={13} style={{ color: '#FFFFFF' }}>
                    {activeStory.authorName || 'Stargazer'}
                  </T>
                  <T size={12} style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    - {formatTime(activeStory.createdAt)}
                  </T>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={() => handleDelete(activeStory._id)}
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Trash2 color="#FF4D4D" size={20} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedIndex(null)}
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <X color="#FFFFFF" size={22} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Зони за докосване (Предишно / Следващо / Пауза) */}
              <TouchableWithoutFeedback
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <View style={styles.touchOverlay}>
                  <TouchableOpacity
                    style={styles.touchLeft}
                    onPress={handlePrevStory}
                    activeOpacity={1}
                  />
                  <TouchableOpacity
                    style={styles.touchRight}
                    onPress={handleNextStory}
                    activeOpacity={1}
                  />
                </View>
              </TouchableWithoutFeedback>

              {/* Долна лента: За коментар, Харесване и Споделяне */}
              <View style={styles.bottomBar}>
                <View style={styles.replyInputContainer}>
                  <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder={`Reply to ${activeStory.authorName || 'Stargazer'}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    style={styles.replyInput}
                  />
                </View>

                {/* Бутон Харесване (Like) */}
                <TouchableOpacity
                  onPress={() => toggleLike(activeStory._id)}
                  style={styles.bottomActionButton}
                  activeOpacity={0.7}
                >
                  <Heart
                    size={26}
                    color={isCurrentLiked ? '#FF3B30' : '#FFFFFF'}
                    fill={isCurrentLiked ? '#FF3B30' : 'transparent'}
                  />
                </TouchableOpacity>

                {/* Бутон Споделяне (Share) */}
                <TouchableOpacity
                  onPress={() => handleShare(activeStory.imageUrl)}
                  style={styles.bottomActionButton}
                  activeOpacity={0.7}
                >
                  <Send size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
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
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },

  /* Facebook Style Story Cards */
  fbStoryCard: {
    width: 108,
    height: 172,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1B2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  fbCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fbCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  fbAvatarBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#000000',
    zIndex: 2,
  },
  fbAvatarImage: {
    width: '100%',
    height: '100%',
  },
  fbCardBottomInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    zIndex: 2,
  },
  fbAuthorName: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 14,
  },

  /* Modal Styles */
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullStoryContainer: {
    flex: 1,
    width,
    height,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  fullStoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  /* Прогрес бар отгоре */
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 16,
    left: 10,
    right: 10,
    zIndex: 20,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  /* Хедър */
  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 24 : 28,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallAvatarBorder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAB308',
    overflow: 'hidden',
  },
  smallAvatar: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },

  /* Докосвания (Touch regions) */
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    width: '30%',
    height: '100%',
  },
  touchRight: {
    width: '70%',
    height: '100%',
  },

  /* Долна лента (Bottom Bar) */
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 16,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyInputContainer: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  replyInput: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  bottomActionButton: {
    padding: 4,
  },
});