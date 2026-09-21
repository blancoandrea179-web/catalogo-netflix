import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ShowSummary } from '../types';

export const POSTER_WIDTH = 130;
const POSTER_HEIGHT = 195;

interface Props {
  show: ShowSummary;
  onPress: (show: ShowSummary) => void;
}

/**
 * Poster + título de un show dentro de un carrusel.
 * memo() evita re-renders innecesarios al desplazar la FlatList.
 */
function ShowCardComponent({ show, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(show)}
    >
      {show.poster_url ? (
        <Image
          source={{ uri: show.poster_url }}
          style={styles.poster}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.poster, styles.posterFallback]}>
          <Text style={styles.posterFallbackText}>{show.title}</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {show.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: POSTER_WIDTH,
    marginRight: 12,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  posterFallbackText: {
    color: '#bbb',
    textAlign: 'center',
    fontSize: 12,
  },
  title: {
    color: '#eaeaea',
    fontSize: 13,
    marginTop: 6,
  },
});

export const ShowCard = memo(ShowCardComponent);
