import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Marker } from 'react-native-maps';
import { Heart, MapPin } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import type { MapPin as MapPinData } from '@/types/mapPin';
import PokemonSprite from '@/components/ui/PokemonSprite';

const MARKER_SPRITE_SIZE = 36;
const MARKER_PHOTO_SIZE = 36;

type Props = {
  pin: MapPinData;
  isSelected: boolean;
  isFavorite: boolean;
  onPress: (pin: MapPinData) => void;
};

export default function MapPinMarker({ pin, isSelected, isFavorite, onPress }: Props) {
  const hasPhoto = pin.content.type === 'photo';
  const [tracksViewChanges, setTracksViewChanges] = useState(hasPhoto);

  const handlePhotoLoad = useCallback(() => {
    setTracksViewChanges(false);
  }, []);

  const isEmpty = pin.content.type === 'empty';

  return (
    <Marker
      coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress(pin)}
    >
      <View style={styles.markerWrapper} collapsable={false}>
        <View
          style={[
            styles.marker,
            isSelected && styles.markerSelected,
            isEmpty && styles.markerEmpty,
            hasPhoto && styles.markerPhoto,
          ]}
        >
          {pin.content.type === 'photo' ? (
            <Image
              source={{ uri: pin.content.photoUri }}
              style={styles.photo}
              contentFit="cover"
              onLoad={handlePhotoLoad}
              onError={handlePhotoLoad}
            />
          ) : pin.content.type === 'pokemon' ? (
            <PokemonSprite
              key={pin.content.pokemon.imageUrl}
              imageUrl={pin.content.pokemon.imageUrl}
              size={MARKER_SPRITE_SIZE}
            />
          ) : (
            <MapPin color={colors.primary} size={20} />
          )}
        </View>
        {isFavorite && (
          <View style={[styles.favoriteBadge, isSelected && styles.favoriteBadgeSelected]}>
            <Heart color={colors.primary} size={10} fill={colors.primary} />
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    overflow: 'visible',
    ...Platform.select({
      android: { paddingTop: 2, paddingRight: 2 },
    }),
  },
  marker: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  markerPhoto: {
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    width: MARKER_PHOTO_SIZE,
    height: MARKER_PHOTO_SIZE,
    borderRadius: radius.full,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  favoriteBadgeSelected: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  markerEmpty: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  markerSelected: {
    borderColor: colors.secondary,
    borderWidth: 3,
  },
});
