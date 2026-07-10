import type { PokemonListItem } from '@/types/pokemon';

export type MapPinContent = 
  | { type: 'empty' }
  | { type: 'pokemon', pokemon: PokemonListItem }
  | { type: 'photo', photoUri: string };

export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
  content: MapPinContent;
};
