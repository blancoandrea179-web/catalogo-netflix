import React, { memo, useCallback } from 'react';
import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import type { CategoryWithShows, ShowSummary } from '../types';
import { POSTER_WIDTH, ShowCard } from './ShowCard';

interface Props {
  category: CategoryWithShows;
  onSelectShow: (show: ShowSummary) => void;
}

const CARD_SPACING = 12;

/**
 * Una categoría = título + carrusel horizontal de posters (FlatList).
 * snapToInterval hace que el scroll "encaje" tarjeta por tarjeta.
 */
function CategoryRowComponent({ category, onSelectShow }: Props) {
  const renderItem: ListRenderItem<ShowSummary> = useCallback(
    ({ item }) => <ShowCard show={item} onPress={onSelectShow} />,
    [onSelectShow]
  );

  const keyExtractor = useCallback((item: ShowSummary) => String(item.id), []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{category.name}</Text>
      <FlatList
        horizontal
        data={category.shows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={POSTER_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        // Optimizaciones de FlatList para listas horizontales
        initialNumToRender={4}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
});

export const CategoryRow = memo(CategoryRowComponent);
