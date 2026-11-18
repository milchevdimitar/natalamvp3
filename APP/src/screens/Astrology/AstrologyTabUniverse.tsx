import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  BookOpen,
  MessageCircle,
  Users,
  Heart,
  Bookmark,
  Check,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { Card, T, Section } from '../../components/UI';
import { NatalChartResults, SharedExperienceItem } from './astrology.types';
import {
  buildAstrologyClasses,
  buildAudioJourneys,
  buildContentLibrary,
  INITIAL_SHARED_EXPERIENCES,
} from './astrology.insights';
import { getSkyPositionsForDate } from './astrology.transits';

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
  // Аудио плейър (Модул 11: 360° Immersive Audio & Moon Journeys)
  const audioList = useMemo(() => buildAudioJourneys(results), [results]);
  const [activeAudioId, setActiveAudioId] = useState<string>(audioList[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Обучение и разговори (Модули 12 & 13)
  const classes = useMemo(() => buildAstrologyClasses(results), [results]);
  const library = useMemo(() => buildContentLibrary(results), [results]);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(classes[0]?.id || null);

  // Интерактивни разговори около Insights (Модул 12)
  const [reflectionNote, setReflectionNote] = useState('');
  const [conversationLog, setConversationLog] = useState<
    Array<{ sender: 'guide' | 'user'; text: string }>
  >(() => [
    {
      sender: 'guide',
      text: `Добре дошъл в пространството за дълбоки разговори! С твоето Слънце в ${results.planetsByKey.sun?.sign} и Луна в ${results.planetsByKey.moon?.sign}, коя тема искаш да изследваме днес?`,
    },
  ]);

  // Споделени преживявания (Модул 14)
  const [experiences, setExperiences] = useState<SharedExperienceItem[]>(
    INITIAL_SHARED_EXPERIENCES
  );
  const [newPostText, setNewPostText] = useState('');

  // Колективен небесен климат днес (Модул 10.1)
  const liveSky = useMemo(() => getSkyPositionsForDate(new Date()), []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeAudio = audioList.find((a) => a.id === activeAudioId) || audioList[0];

  const handleSendReflection = () => {
    const trimmed = reflectionNote.trim();
    if (!trimmed) return;
    const reply = `Благодаря за споделеното! В контекста на твоя Асцендент в ${results.angles.asc.sign} и управител ${results.chartRuler.modernRuler}, това наблюдение показва осъзнато преминаване от автоматична реакция към личен избор.`;
    setConversationLog((prev) => [
      ...prev,
      { sender: 'user', text: trimmed },
      { sender: 'guide', text: reply },
    ]);
    setReflectionNote('');
  };

  const handleShareExperience = () => {
    const trimmed = newPostText.trim();
    if (!trimmed) return;
    const newItem: SharedExperienceItem = {
      id: `exp_${Date.now()}`,
      author: userName || 'Ти',
      bigThree: `☉ ${results.planetsByKey.sun?.sign} · ☾ ${results.planetsByKey.moon?.sign} · ↑ ${results.angles.asc.sign}`,
      topicTag: `${results.elements.dominantElement} Insight`,
      timeAgo: 'току-що',
      content: trimmed,
      resonatesCount: 1,
    };
    setExperiences((prev) => [newItem, ...prev]);
    setNewPostText('');
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Модул 10.1: Cosmic Climate Live */}
      <Section>Cosmic Climate (Live Sky)</Section>
      <Card style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {liveSky.slice(0, 8).map((b) => (
            <View
              key={b.key}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <T bold size={11}>
                {b.symbol} {b.signSymbol} {b.sign} {b.isRetrograde ? '℞' : ''}
              </T>
            </View>
          ))}
        </View>
      </Card>

      {/* Модул 11: 360° Immersive Audio & Moon Journeys */}
      <Section>360° Audio & Moon Journeys</Section>
      <Card style={{ padding: 14, gap: 10 }}>
        {activeAudio && (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.purpleSoft,
              gap: 8,
            }}
          >
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
                <T bold size={10} style={{ color: colors.purple }}>
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

              <Volume2 size={18} color={colors.purple} />
            </View>

            <T size={12} style={{ fontStyle: 'italic' }}>
              „{activeAudio.scriptPreview}“
            </T>
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
                  padding: 8,
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
                  <Headphones size={15} color={colors.purple} />
                  <View style={{ flex: 1 }}>
                    <T bold size={12}>
                      {item.title}
                    </T>
                    <T muted size={10}>
                      {item.type} · {item.durationLabel}
                    </T>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    onSaveUniverseItem('audio', item.id, item.title, item.subtitle)
                  }
                  style={{ padding: 6 }}
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

      {/* Модул 13: Astrology Classes (Astrology 101 – 108) */}
      <Section>Astrology Classes (Interactive)</Section>
      <View style={{ gap: 8 }}>
        {classes.map((cls) => {
          const isOpen = expandedClassId === cls.id;
          const isSaved = savedIds.has(cls.id);
          return (
            <Card key={cls.id} style={{ padding: 14, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setExpandedClassId(isOpen ? null : cls.id)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View style={{ flex: 1 }}>
                  <T bold size={10} style={{ color: colors.gold }}>
                    {cls.code} · {cls.level} · {cls.duration}
                  </T>
                  <T bold size={14} style={{ marginTop: 2 }}>
                    {cls.title}
                  </T>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onSaveUniverseItem('classes', cls.id, cls.title, cls.code)
                  }
                  style={{ padding: 6 }}
                >
                  {isSaved ? (
                    <Check size={14} color={colors.purple} />
                  ) : (
                    <Bookmark size={14} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>

              {isOpen && (
                <View style={{ gap: 6, paddingTop: 4 }}>
                  <T size={13} style={{ lineHeight: 19 }}>
                    {cls.concept}
                  </T>
                  <View style={{ padding: 9, borderRadius: 8, backgroundColor: colors.purpleSoft }}>
                    <T bold size={11} style={{ color: colors.purple }}>
                      В твоята карта:
                    </T>
                    <T size={12} style={{ marginTop: 2 }}>
                      {cls.personalExample}
                    </T>
                  </View>
                  <T muted size={11}>
                    <BookOpen size={11} color={colors.gold} /> Извод: {cls.takeaway}
                  </T>
                </View>
              )}
            </Card>
          );
        })}
      </View>

      {/* Модул 10: Content Library */}
      <Section>Content Library & Chapters</Section>
      <View style={{ gap: 8 }}>
        {library.map((art) => {
          const isSaved = savedIds.has(art.id);
          return (
            <Card key={art.id} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T bold size={10} style={{ color: colors.purple }}>
                  {art.category.toUpperCase()} · {art.readTime}
                </T>
                <TouchableOpacity
                  onPress={() =>
                    onSaveUniverseItem('library', art.id, art.title, art.subtitle)
                  }
                >
                  {isSaved ? (
                    <Check size={14} color={colors.purple} />
                  ) : (
                    <Bookmark size={14} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
              <T bold size={14}>
                {art.title}
              </T>
              <T size={12} style={{ lineHeight: 18 }}>
                {art.body}
              </T>
            </Card>
          );
        })}
      </View>

      {/* Модул 12: Guided Conversations around Insights */}
      <Section>Guided Conversations</Section>
      <Card style={{ padding: 14, gap: 8 }}>
        {conversationLog.map((msg, idx) => (
          <View
            key={idx}
            style={{
              padding: 10,
              borderRadius: 10,
              backgroundColor: msg.sender === 'guide' ? colors.surfaceAlt : colors.purpleSoft,
            }}
          >
            <T bold size={10} style={{ color: colors.purple, marginBottom: 2 }}>
              {msg.sender === 'guide' ? 'ASTROLOGY GUIDE' : userName || 'ТИ'}
            </T>
            <T size={12}>{msg.text}</T>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TextInput
            value={reflectionNote}
            onChangeText={setReflectionNote}
            placeholder="Задай въпрос или сподели размисъл..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
            }}
          />
          <TouchableOpacity
            onPress={handleSendReflection}
            style={{
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: colors.purple,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Модул 14: Shared Experiences Community */}
      <Section>Shared Experiences</Section>
      <Card style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newPostText}
            onChangeText={setNewPostText}
            placeholder="Сподели свое астрологично преживяване..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: colors.text,
            }}
          />
          <TouchableOpacity
            onPress={handleShareExperience}
            style={{
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {experiences.map((exp) => (
          <View
            key={exp.id}
            style={{
              padding: 10,
              borderRadius: 10,
              backgroundColor: colors.surfaceAlt,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold size={12}>
                {exp.author} · <T muted size={10}>{exp.bigThree}</T>
              </T>
              <T muted size={10}>
                {exp.timeAgo}
              </T>
            </View>
            <T size={12}>{exp.content}</T>
            <TouchableOpacity
              onPress={() =>
                setExperiences((prev) =>
                  prev.map((item) =>
                    item.id === exp.id
                      ? { ...item, resonatesCount: item.resonatesCount + 1 }
                      : item
                  )
                )
              }
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
            >
              <Heart size={12} color={colors.purple} />
              <T bold size={11} style={{ color: colors.purple }}>
                Резонира ({exp.resonatesCount})
              </T>
            </TouchableOpacity>
          </View>
        ))}
      </Card>
    </View>
  );
}