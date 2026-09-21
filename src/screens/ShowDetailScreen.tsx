import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useShowDetail } from '../hooks/useCatalog';
import type { ShowDetailScreenProps } from '../navigation/types';
import type { Episode } from '../types';

export default function ShowDetailScreen({
  route,
  navigation,
}: ShowDetailScreenProps) {
  const { showId, title } = route.params;
  const { data: show, loading, error } = useShowDetail(showId);

  // Pone el título del show en el header de navegación apenas se conoce.
  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  // Texto derivado (año + nº de capítulos). useMemo evita recalcular
  // en cada render si el show no cambió.
  const meta = useMemo(() => {
    if (!show) return '';
    const parts: string[] = [];
    if (show.year) parts.push(String(show.year));
    parts.push(
      `${show.episodes.length} ${
        show.episodes.length === 1 ? 'capítulo' : 'capítulos'
      }`
    );
    return parts.join('  •  ');
  }, [show]);

  const renderEpisode: ListRenderItem<Episode> = useCallback(
    ({ item }) => (
      <View style={styles.episodeRow}>
        <Text style={styles.episodeNumber}>{item.episode_number}</Text>
        <View style={styles.episodeInfo}>
          <Text style={styles.episodeTitle}>{item.title}</Text>
          {item.duration_minutes != null && (
            <Text style={styles.episodeDuration}>
              {item.duration_minutes} min
            </Text>
          )}
        </View>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (error || !show) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error ?? 'No se encontró el show.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={show.episodes}
      renderItem={renderEpisode}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          {show.poster_url && (
            <Image
              source={{ uri: show.poster_url }}
              style={styles.poster}
              resizeMode="cover"
            />
          )}
          <Text style={styles.title}>{show.title}</Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
          {!!show.synopsis && (
            <Text style={styles.synopsis}>{show.synopsis}</Text>
          )}
          <Text style={styles.sectionTitle}>Capítulos</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyEpisodes}>
          Este show todavía no tiene capítulos.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  poster: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    backgroundColor: '#222',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  meta: {
    color: '#9a9a9a',
    marginTop: 6,
    fontSize: 13,
  },
  synopsis: {
    color: '#d0d0d0',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  episodeNumber: {
    color: '#e50914',
    fontSize: 18,
    fontWeight: '800',
    width: 36,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#eaeaea',
    fontSize: 15,
    fontWeight: '600',
  },
  episodeDuration: {
    color: '#8a8a8a',
    fontSize: 12,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorText: {
    color: '#bbb',
    textAlign: 'center',
  },
  emptyEpisodes: {
    color: '#8a8a8a',
    fontStyle: 'italic',
  },
});
