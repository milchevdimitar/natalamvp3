import { StarField } from './StarField';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Trash2, Heart, Send, ChevronUp, Users } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { T } from '../components/UI';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cosmic } from '../theme/cosmic';

const { height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export function StoryViewer({ circular = false, circleSize = 55 }: { circular?: boolean; circleSize?: number } = {}) {
  const {
    stories,
    colors,
    deleteStory,
    user,
    sendStoryReply,
    toggleStoryLike,
    setPage,
    setSelectedChat,
  } = useApp();

  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState<number>(0);

  const [replyText, setReplyText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showLikersSheet, setShowLikersSheet] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentProgressValue = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const currentUserId = useMemo(() => {
    return String(user?.email || user?.name || 'guest_id').toLowerCase().trim();
  }, [user]);

  // 1. Групиране на сторитата по потребители
  const groupedStories = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    const groups: { [key: string]: { userId: string; authorName: string; stories: any[] } } = {};

    stories.forEach((story) => {
      const key = story.userId || story.authorName || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          userId: story.userId || key,
          authorName: story.authorName || 'Stargazer',
          stories: [],
        };
      }
      groups[key].stories.push(story);
    });

    return Object.values(groups);
  }, [stories]);

  const activeGroup = userIndex !== null ? groupedStories[userIndex] : null;
  const activeStory = activeGroup ? activeGroup.stories[storyIndex] : null;

  // Проверка за собственик на сторито
  const isMyStory = useMemo(() => {
    if (!activeStory || !user) return false;
    const uEmail = String(user.email || '').toLowerCase().trim();
    const uName = String(user.name || '').toLowerCase().trim();
    const sUserId = String(activeStory.userId || '').toLowerCase().trim();
    const sAuthor = String(activeStory.authorName || '').toLowerCase().trim();

    return (
      (!!uEmail && sUserId === uEmail) ||
      (!!uName && sAuthor === uName) ||
      (!!uEmail && sAuthor === uEmail)
    );
  }, [activeStory, user]);

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

  // Таймер на анимацията
  useEffect(() => {
    if (userIndex !== null && activeStory && !isInputFocused && !showLikersSheet) {
      startProgress(STORY_DURATION - currentProgressValue.current * STORY_DURATION, currentProgressValue.current);
    } else if (isInputFocused || showLikersSheet) {
      handlePause();
    } else {
      progressAnim.setValue(0);
      currentProgressValue.current = 0;
    }
  }, [userIndex, storyIndex, isInputFocused, showLikersSheet]);

  const startProgress = (duration: number, fromValue = 0) => {
    progressAnim.setValue(fromValue);

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: Math.max(duration, 100),
      useNativeDriver: false,
    });

    animationRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });
  };

  const handlePause = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    progressAnim.stopAnimation((value) => {
      currentProgressValue.current = value;
    });
  };

  const handleResume = () => {
    if (isInputFocused || showLikersSheet) return;
    const remainingDuration = STORY_DURATION * (1 - currentProgressValue.current);
    startProgress(remainingDuration, currentProgressValue.current);
  };

  const resetProgress = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    currentProgressValue.current = 0;
    progressAnim.setValue(0);
    setIsHolding(false);
  };

  const handleNextStory = () => {
    if (userIndex === null || !activeGroup) return;
    setReplyText('');
    setShowLikersSheet(false);
    resetProgress();

    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (userIndex < groupedStories.length - 1) {
      setUserIndex((prev) => (prev !== null ? prev + 1 : null));
      setStoryIndex(0);
    } else {
      setUserIndex(null);
      setStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (userIndex === null || !activeGroup) return;
    setReplyText('');
    setShowLikersSheet(false);
    resetProgress();

    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (userIndex > 0) {
      const prevGroup = groupedStories[userIndex - 1];
      setUserIndex(userIndex - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    } else {
      startProgress(STORY_DURATION, 0);
    }
  };

  // Управление на докосването (Скриване на UI и пауза при задържане / Навигация при кратък клик)
  const handleTouchStart = () => {
    touchStartTimeRef.current = Date.now();
    setIsHolding(true);
    handlePause();
  };

  const handleTouchEnd = (direction: 'prev' | 'next') => {
    setIsHolding(false);
    const duration = Date.now() - touchStartTimeRef.current;
    if (duration < 250) {
      // Кратък клик -> преминаване
      if (direction === 'prev') handlePrevStory();
      else handleNextStory();
    } else {
      // Задържане -> продължаване на сторито
      handleResume();
    }
  };

  const handleDelete = async (id: string) => {
    resetProgress();
    setUserIndex(null);
    setShowLikersSheet(false);
    await deleteStory(id);
  };

  const handleToggleLike = async (storyId: string) => {
    if (!storyId) return;
    if (typeof toggleStoryLike === 'function') {
      await toggleStoryLike(storyId);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeStory) return;
    const authorEmail = activeStory.userId || activeStory.authorName;

    try {
      if (typeof sendStoryReply === 'function') {
        await sendStoryReply(
          activeStory._id,
          authorEmail,
          replyText.trim(),
          activeStory.imageUrl
        );
      }
      setReplyText('');
      setIsInputFocused(false);
      Alert.alert('Успех ✨', 'Отговорът е изпратен в чата!');
    } catch (error) {
      Alert.alert('Грешка', 'Възникна проблем при изпращането.');
    }
  };

  const handleShareToChat = (story: any) => {
    handlePause();
    setShowLikersSheet(false);
    setUserIndex(null);

    if (setSelectedChat && setPage) {
      setSelectedChat({
        sharedStory: {
          id: story._id,
          imageUrl: story.imageUrl,
          authorName: story.authorName,
        },
      });
      setPage('chat');
    }
  };

  // Проверка за Like
  const isCurrentLiked = useMemo(() => {
    if (!activeStory || !Array.isArray(activeStory.likes)) return false;
    return activeStory.likes.some(
      (id: string) => String(id).toLowerCase().trim() === currentUserId
    );
  }, [activeStory, currentUserId]);

  const likesList = activeStory?.likes || [];
  const likesCount = likesList.length;

  if (!groupedStories || groupedStories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <T muted size={12} style={circular ? { color: '#b9c8ea' } : undefined}>
          No active stories
        </T>
      </View>
    );
  }

  return (
    <>
      {/* Сторита по потребители */}
      <ScrollView horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedStories.map((group, gIdx) => {
          const coverStory = group.stories[0];
          return (
            <TouchableOpacity
              key={group.userId || gIdx.toString()}
              onPress={() => {
                resetProgress();
                setUserIndex(gIdx);
                setStoryIndex(0);
              }}
              style={circular ? { width: circleSize + 6, alignItems: 'center', gap: 6, marginHorizontal: 2 } : styles.fbStoryCard}
              activeOpacity={0.88}
              accessibilityLabel={circular ? 'Open stories by ' + group.authorName : undefined}
            >
              {circular ? (
                <>
                  <View style={{ width: circleSize, height: circleSize, borderRadius: circleSize / 2, borderWidth: 2, borderColor: '#b49cff', padding: 3 }}>
                    <Image source={{ uri: coverStory.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: circleSize / 2 - 5 }} />
                  </View>
                  <Text numberOfLines={1} style={{ color: '#d2ddf5', fontSize: 10, maxWidth: circleSize + 6 }}>{group.authorName}</Text>
                </>
              ) : (
              <>
              <Image
                source={{ uri: coverStory.imageUrl }}
                style={styles.fbCardImage}
                resizeMode="cover"
              />
              <View style={styles.fbCardOverlay} />
              <View style={[styles.fbAvatarBadge, { borderColor: colors.gold }]}>
                <Image
                  source={{ uri: coverStory.imageUrl }}
                  style={styles.fbAvatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.fbCardBottomInfo}>
                <Text numberOfLines={1} style={[styles.fbAuthorName, { fontSize: 11, fontWeight: '700' }]}>
                  {group.authorName}
                </Text>
                <T size={9} style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                  {group.stories.length} {group.stories.length === 1 ? 'story' : 'stories'}
                </T>
              </View>
              </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fullscreen Modal */}
      <Modal
        visible={userIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (showLikersSheet) {
            setShowLikersSheet(false);
          } else {
            resetProgress();
            setUserIndex(null);
          }
        }}
      >
        <SafeAreaView style={styles.modalBackground}>
          <StarField subtle />
          {activeGroup && activeStory && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.fullStoryContainer}
            >
              <View style={isHolding && styles.hiddenChrome} pointerEvents={isHolding ? 'none' : 'auto'}>
                <View style={styles.progressContainer}>
                  {activeGroup.stories.map((_, i) => {
                    let barWidth: any = '0%';
                    if (i < storyIndex) barWidth = '100%';
                    else if (i === storyIndex) {
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

                {/* Хедър с автор и бутон за триене */}
                <View style={styles.headerBar}>
                  <View style={styles.userInfo}>
                    <View style={styles.smallAvatarBorder}>
                      <Image
                        source={{ uri: activeStory.imageUrl }}
                        style={styles.smallAvatar}
                      />
                    </View>
                    <View>
                      <T bold size={13} style={{ color: '#FFFFFF' }}>
                        {activeGroup.authorName}
                      </T>
                      <T size={10} style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                        {storyIndex + 1} of {activeGroup.stories.length} · {formatTime(activeStory.createdAt)}
                      </T>
                    </View>
                  </View>

                  <View style={styles.headerActions}>
                    {isMyStory && (
                      <TouchableOpacity
                        onPress={() => handleDelete(activeStory._id)}
                        style={styles.iconButton}
                        activeOpacity={0.7}
                      >
                        <Trash2 color="#FF4D4D" size={20} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setShowLikersSheet(false);
                        resetProgress();
                        setUserIndex(null);
                      }}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <X color="#FFFFFF" size={22} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.storyStage}>
                <Image
                  source={{ uri: activeStory.imageUrl }}
                  style={styles.fullStoryImage}
                  resizeMode="contain"
                />
                <View style={styles.touchOverlay} pointerEvents="box-none">
                  <Pressable
                    style={styles.touchLeft}
                    onPressIn={handleTouchStart}
                    onPressOut={() => handleTouchEnd('prev')}
                  />
                  <Pressable
                    style={styles.touchRight}
                    onPressIn={handleTouchStart}
                    onPressOut={() => handleTouchEnd('next')}
                  />
                </View>
              </View>

              <View style={isHolding && styles.hiddenChrome} pointerEvents={isHolding ? 'none' : 'auto'}>
                <TouchableOpacity
                  onPress={() => {
                    handlePause();
                    setShowLikersSheet(true);
                  }}
                  activeOpacity={0.8}
                  style={styles.likersPillBadge}
                >
                  <ChevronUp size={16} color={colors.gold} />
                  <T bold size={11} style={{ color: '#FFFFFF' }}>
                    {likesCount > 0 ? `❤️ ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}` : 'No likes yet · Tap to view'}
                  </T>
                </TouchableOpacity>

                {/* Долна лента */}
                <View style={styles.bottomBar}>
                  <View style={styles.replyInputContainer}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder={`Reply to ${activeGroup.authorName}...`}
                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                      style={styles.replyInput}
                      returnKeyType="send"
                      onSubmitEditing={handleSendReply}
                    />
                    {replyText.trim().length > 0 && (
                      <TouchableOpacity onPress={handleSendReply} style={{ paddingLeft: 8 }}>
                        <Send size={18} color={colors.gold} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleToggleLike(activeStory._id)}
                    style={styles.bottomActionButton}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={26}
                      color={isCurrentLiked ? '#FF3B30' : '#FFFFFF'}
                      fill={isCurrentLiked ? '#FF3B30' : 'transparent'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareToChat(activeStory)}
                    style={styles.bottomActionButton}
                    activeOpacity={0.7}
                  >
                    <Send size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Likers Modal Sheet */}
              <Modal
                visible={showLikersSheet}
                transparent
                animationType="slide"
                onRequestClose={() => {
                  setShowLikersSheet(false);
                  handleResume();
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    setShowLikersSheet(false);
                    handleResume();
                  }}
                  style={styles.sheetBackdrop}
                >
                  <StarField subtle />
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={[styles.sheetContainer, { backgroundColor: '#161224' }]}
                  >
                    <View style={styles.sheetHandleBar} />

                    <View style={styles.sheetHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Heart size={20} color="#FF3B30" fill="#FF3B30" />
                        <T bold size={16} style={{ color: '#FFFFFF' }}>
                          Liked by ({likesCount})
                        </T>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setShowLikersSheet(false);
                          handleResume();
                        }}
                        style={{ padding: 4 }}
                      >
                        <X size={20} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
                    >
                      {likesCount === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
                          <Users size={32} color={colors.muted} />
                          <T muted size={13}>
                            Все още никой не е харесал това стори.
                          </T>
                        </View>
                      ) : (
                        likesList.map((userItem: string, idx: number) => (
                          <View key={idx} style={styles.likerRow}>
                            <View style={[styles.likerAvatar, { backgroundColor: colors.purpleSoft }]}>
                              <T bold size={14} style={{ color: colors.purple }}>
                                {userItem.charAt(0).toUpperCase()}
                              </T>
                            </View>
                            <View style={{ flex: 1 }}>
                              <T bold size={14} style={{ color: '#FFFFFF' }}>
                                {userItem}
                              </T>
                              <T muted size={11}>
                                Stargazer Community
                              </T>
                            </View>
                            <Heart size={16} color="#FF3B30" fill="#FF3B30" />
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

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
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  fbCardOverlay: {
    ...StyleSheet.absoluteFill,
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
  modalBackground: {
    flex: 1,
    backgroundColor: cosmic.bg,
  },
  fullStoryContainer: {
    flex: 1,
  },
  hiddenChrome: {
    opacity: 0,
  },
  storyStage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  fullStoryImage: {
    width: '100%',
    maxWidth: 540,
    height: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 12,
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
  headerBar: {
    marginTop: 8,
    marginHorizontal: 12,
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
  touchOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    flex: 1,
    height: '100%',
  },
  touchRight: {
    flex: 2,
    height: '100%',
  },
  likersPillBadge: {
    alignSelf: 'center',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  bottomBar: {
    width: '100%',
    maxWidth: 564,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  bottomActionButton: {
    padding: 4,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: height * 0.5,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  likerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  likerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
