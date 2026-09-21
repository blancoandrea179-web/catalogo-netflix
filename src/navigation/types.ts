import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Rutas del stack y sus parámetros.
export type RootStackParamList = {
  Home: undefined;
  ShowDetail: { showId: number; title: string };
};

// Helpers de tipado para las props de cada pantalla.
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ShowDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ShowDetail'
>;
