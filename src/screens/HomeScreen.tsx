import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CategoryRow } from '../components/CategoryRow';
import { useHomeCatalog } from '../hooks/useCatalog';
import type { HomeScreenProps } from '../navigation/types';
import type { CategoryWithShows, ShowSummary } from '../types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { data: categories, loading, error, refetch } = useHomeCatalog();

  // Navega al detalle. useCallback evita recrear la función en cada render,
  // así los componentes memoizados (CategoryRow/ShowCard) no se re-renderizan.
  const handleSelectShow = useCallback(
    (show: ShowSummary) => {
      navigation.navigate('ShowDetail', { showId: show.id, title: show.title });
    },
    [navigation]
  );

  const renderCategory: ListRenderItem<CategoryWithShows> = useCallback(
    ({ item }) => (
      <CategoryRow category={item} onSelectShow={handleSelectShow} />
    ),
    [handleSelectShow]
  );

  if (loading && !categories) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo cargar el catálogo</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryHint} onPress={refetch}>
          Toca aquí para reintentar
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={categories ?? []}
      renderItem={renderCategory}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          tintColor="#fff"
        />
      }
      ListHeaderComponent={<Text style={styles.brand}>MiFlix</Text>}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.errorText}>No hay shows en el catálogo.</Text>
        </View>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  brand: {
    color: '#e50914',
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#bbb',
    textAlign: 'center',
  },
  retryHint: {
    color: '#e50914',
    marginTop: 16,
    fontWeight: '600',
  },
});
