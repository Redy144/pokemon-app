import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { deletePinPhoto } from '@/lib/photoStorage';
import { MAP_PINS_KEY, storage } from '@/lib/storage';
import type { MapPin } from '@/types/mapPin';
import type { PokemonListItem } from '@/types/pokemon';
import * as Crypto from 'expo-crypto';

function readMapPins(): MapPin[] {
  try {
    const raw = storage.getString(MAP_PINS_KEY);
    return raw ? (JSON.parse(raw) as MapPin[]) : [];
  } catch (error) {
    console.error('Error loading map pins:', error);
    return [];
  }
}

function saveMapPins(pins: MapPin[]) {
  storage.set(MAP_PINS_KEY, JSON.stringify(pins));
}

function createPinId() {
  return Crypto.randomUUID();
}

type MapPinsContextValue = {
  pins: MapPin[];
  assignedPokemonIds: Set<number>;
  addPin: (latitude: number, longitude: number) => MapPin;
  addPhotoPin: (
    id: string,
    latitude: number,
    longitude: number,
    photoUri: string,
  ) => MapPin;
  assignPokemon: (pinId: string, pokemon: PokemonListItem) => void;
  deletePin: (pinId: string) => void;
};

const MapPinsContext = createContext<MapPinsContextValue | null>(null);

export function MapPinsProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<MapPin[]>(readMapPins);

  const assignedPokemonIds = useMemo(
    () =>
      new Set(
        pins.flatMap((pin) =>
          pin.content.type === 'pokemon' ? [pin.content.pokemon.id] : [],
        ),
      ),
    [pins],
  );

  const addPin = useCallback((latitude: number, longitude: number) => {
    const newPin: MapPin = {
      id: createPinId(),
      latitude,
      longitude,
      content: { type: 'empty' },
    };
    setPins((current) => {
      const next = [...current, newPin];
      saveMapPins(next);
      return next;
    });
    return newPin;
  }, []);

  const addPhotoPin = useCallback(
    (id: string, latitude: number, longitude: number, photoUri: string) => {
      const newPin: MapPin = {
        id,
        latitude,
        longitude,
        content: { type: 'photo', photoUri },
      };
      setPins((current) => {
        const next = [...current, newPin];
        saveMapPins(next);
        return next;
      });
      return newPin;
    },
    [],
  );

  const assignPokemon = useCallback((pinId: string, pokemon: PokemonListItem) => {
    setPins((current) => {
      const next = current.map((pin) =>
        pin.id === pinId
          ? { ...pin, content: { type: 'pokemon' as const, pokemon } }
          : pin,
      );
      saveMapPins(next);
      return next;
    });
  }, []);

  const deletePin = useCallback((pinId: string) => {
    setPins((current) => {
      const pin = current.find((entry) => entry.id === pinId);
      if (pin?.content.type === 'photo') {
        deletePinPhoto(pin.content.photoUri);
      }
      const next = current.filter((entry) => entry.id !== pinId);
      saveMapPins(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      pins,
      assignedPokemonIds,
      addPin,
      addPhotoPin,
      assignPokemon,
      deletePin,
    }),
    [pins, assignedPokemonIds, addPin, addPhotoPin, assignPokemon, deletePin],
  );

  return (
    <MapPinsContext.Provider value={value}>
      {children}
    </MapPinsContext.Provider>
  );
}

export function useMapPins() {
  const context = useContext(MapPinsContext);
  if (!context) {
    throw new Error('useMapPins must be used within MapPinsProvider');
  }
  return context;
}
