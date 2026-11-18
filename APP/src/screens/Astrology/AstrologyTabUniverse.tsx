import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import {
  Headphones,
  Play,
  Pause,
  Bookmark,
  Check,
  Send,
  Wand2,
  ChevronRight,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import {
  AstrologyClassItem,
  LibraryArticleItem,
  NatalChartResults,
} from './astrology.types';
import {
  buildAstrologyClasses,
  buildAudioJourneys,
  buildContentLibrary,
} from './astrology.insights';
import {
  calculateTransitsForDate,
  getSkyPositionsForDate,
} from './astrology.transits';
import { requestAstrologyAI } from './astrology.ai';
import { DetailSheetModal, TieredSummaryCard } from './AstrologyDetailModal';

export function AstrologyTabUniverse({
  results,
  userName,
  colors,
  savedIds,
  onSaveUniverseItem,
}: {
  results: NatalChartResults;
  userName: string;
  colors: any;
  savedIds: Set<string>;
  onSaveUniverseItem: (
    category: 'library' | 'audio' | 'classes',
    id: string,
    title: string,
    subtitle: string
  ) => void;
}) {
  const audioList = useMemo(() => buildAudioJourneys(results), [results]);
  const [activeAudioId, setActiveAudioId] = useState<string>(audioList[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const classes = useMemo(() => buildAstrologyClasses(results), [results]);
  const library = useMemo(() => buildContentLibrary(results), [results]);

  const [selectedClass, setSelectedClass] = useState<AstrologyClassItem | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticleItem | null>(null);
  const [showAiChatModal, setShowAiChatModal] = useState(false);

  const [questionInput, setQuestionInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [conversationLog, setConversationLog] = useState<
    Array<{ sender: 'guide' | 'user'; text: string }>
  >(() => [
    {
      sender: 'guide',
      text: `Hello ${userName || 'there'}. With your ${results.planetsByKey.sun?.sign} Sun and ${
        results.planetsByKey.moon?.sign
      } Moon, what would you like to explore today?`,
    },
  ]);

  const liveSky = useMemo(() => getSkyPositionsForDate(new Date()), []);
  const currentTransits = useMemo(() => calculateTransitsForDate(results, new Date()), [results]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeAudio = audioList.find((a) => a.id === activeAudioId) || audioList[0];

  const handleAskAstrologerAI = async () => {
    const trimmed = questionInput.trim();
    if (!trimmed || isAiReplying) return;

    const nextHistory = [...conversationLog, { sender: 'user' as const, text: trimmed }];
    setConversationLog(nextHistory);
    setQuestionInput('');
    setIsAiReplying(true);

    const res = await requestAstrologyAI('astro_coach', results, {
      question: trimmed,
      transits: currentTransits,
      history: nextHistory,
    });

    setConversationLog((prev) => [...prev, { sender: 'guide', text: res.text }]);
    setIsAiReplying(false);
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Ниво 1: AI Astrologer вход */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setShowAiChatModal(true)}>
        <Card
          style={{
            padding: 15,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.purpleSoft,
            borderWidth: 1,
            borderColor: colors.purple,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <T bold size={14} style={{ color: colors.purple }}>
                Ask AI Astrologer
              </T>
              <T muted size={11}>
                Interactive guidance tailored to your natal chart & transits
              </T>
            </View>
          </View>
          <ChevronRight size={18} color={colors.purple} />
        </Card>
      </TouchableOpacity>

      {/* Ниво 1: Компактен 360° Audio плейър */}
      <Section>360° Audio & Moon Journeys</Section>
      <Card style={{ padding: 14, borderRadius: 16, gap: 10 }}>
        {activeAudio && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setIsPlaying((p) => !p)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
                <Pause size={18} color="#FFFFFF" />
              ) : (
                <Play size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <T bold size={10} style={{ color: colors.gold }}>
                {activeAudio.type.toUpperCase()} · {activeAudio.frequencyHz}
              </T>
              <T bold size={13}>
                {activeAudio.title}
              </T>
              <T muted size={11}>
                {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')} /{' '}
                {activeAudio.durationLabel}
              </T>
            </View>
          </View>
        )}

        <View style={{ gap: 6 }}>
          {audioList.map((item) => {
            const isSaved = savedIds.has(item.id);
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  backgroundColor:
                    item.id === activeAudio?.id ? colors.surfaceAlt : 'transparent',
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setActiveAudioId(item.id);
                    setElapsedSec(0);
                    setIsPlaying(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                >
                  <Headphones size={14} color={colors.purple} />
                  <T bold size={12} numberOfLines={1} style={{ flex: 1 }}>
                    {item.title}
                  </T>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    onSaveUniverseItem('audio', item.id, item.title, item.subtitle)
                  }
                  style={{ padding: 4 }}
                >
                  {isSaved ? (
                    <Check size={14} color={colors.purple} />
                  ) : (
                    <Bookmark size={14} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Ниво 1: Astrology Classes (само заглавие + 1 ред, пълният урок е в модал) */}
      <Section>Astrology Classes</Section>
      <View style={{ gap: 10 }}>
        {classes.map((cls) => (
          <TieredSummaryCard
            key={cls.id}
            tag={`${cls.level} · ${cls.duration}`}
            title={cls.title}
            summary={cls.concept}
            onPressMore={() => setSelectedClass(cls)}
            colors={colors}
          />
        ))}
      </View>

      {/* Ниво 1: Content Library + Live Sky pills */}
      <Section>Content Library & Cosmic Climate</Section>
      <Card style={{ padding: 12, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {liveSky.slice(0, 6).map((b) => (
            <View
              key={b.key}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <T bold size={10}>
                {b.symbol} {b.sign} {b.isRetrograde ? '℞' : ''}
              </T>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        {library.map((art) => (
          <TieredSummaryCard
            key={art.id}
            tag={`${art.category} · ${art.readTime}`}
            title={art.title}
            summary={art.subtitle}
            onPressMore={() => setSelectedArticle(art)}
            colors={colors}
          />
        ))}
      </View>

      {/* Ниво 2: Модал за урок */}
      <DetailSheetModal
        visible={Boolean(selectedClass)}
        onClose={() => setSelectedClass(null)}
        eyebrow={selectedClass ? `${selectedClass.level} · ${selectedClass.duration}` : undefined}
        title={selectedClass?.title || ''}
        colors={colors}
        isSaved={selectedClass ? savedIds.has(selectedClass.id) : false}
        onSave={
          selectedClass
            ? () =>
                onSaveUniverseItem(
                  'classes',
                  selectedClass.id,
                  selectedClass.title,
                  selectedClass.code
                )
            : undefined
        }
      >
        {selectedClass && (
          <>
            <T size={14} style={{ lineHeight: 22 }}>
              {selectedClass.concept}
            </T>
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.purpleSoft }}>
              <T bold size={11} style={{ color: colors.purple }}>
                IN YOUR CHART
              </T>
              <T size={13} style={{ marginTop: 3, lineHeight: 19 }}>
                {selectedClass.personalExample}
              </T>
            </View>
            <T muted size={12}>
              Takeaway: {selectedClass.takeaway}
            </T>
          </>
        )}
      </DetailSheetModal>

      {/* Ниво 2: Модал за статия от библиотеката */}
      <DetailSheetModal
        visible={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        eyebrow={
          selectedArticle ? `${selectedArticle.category} · ${selectedArticle.readTime}` : undefined
        }
        title={selectedArticle?.title || ''}
        colors={colors}
        isSaved={selectedArticle ? savedIds.has(selectedArticle.id) : false}
        onSave={
          selectedArticle
            ? () =>
                onSaveUniverseItem(
                  'library',
                  selectedArticle.id,
                  selectedArticle.title,
                  selectedArticle.subtitle
                )
            : undefined
        }
      >
        {selectedArticle && (
          <T size={14} style={{ lineHeight: 22 }}>
            {selectedArticle.body}
          </T>
        )}
      </DetailSheetModal>

      {/* Ниво 3: AI Astrologer Dialogue Modal */}
      <DetailSheetModal
        visible={showAiChatModal}
        onClose={() => setShowAiChatModal(false)}
        eyebrow="CONTEXT-AWARE AI GUIDE"
        title="Ask AI Astrologer"
        colors={colors}
      >
        {conversationLog.map((msg, idx) => (
          <View
            key={idx}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: msg.sender === 'guide' ? colors.surfaceAlt : colors.purpleSoft,
            }}
          >
            <T bold size={10} style={{ color: colors.purple, marginBottom: 3 }}>
              {msg.sender === 'guide' ? 'AI ASTROLOGER' : (userName || 'YOU').toUpperCase()}
            </T>
            <T size={13} style={{ lineHeight: 19 }}>
              {msg.text}
            </T>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TextInput
            value={questionInput}
            onChangeText={setQuestionInput}
            placeholder="Ask about your chart, love, or transits..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
            }}
          />
          <TouchableOpacity
            onPress={handleAskAstrologerAI}
            disabled={isAiReplying}
            style={{
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: colors.purple,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAiReplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </DetailSheetModal>
    </View>
  );
}