export type TarotMode = 'daily' | 'spread';

export type TarotCardSize = 'micro' | 'small' | 'medium' | 'large';

export interface TarotCardData {
  id: number;
  name: string;
  pngKey: string;
  symbol: string;
  arcana: 'Major' | 'Minor';
  suit?: string;
  message: string;
}

export interface TarotArtworkCardProps {
  card?: TarotCardData;
  isRevealed: boolean;
  cardIndex?: number;
  colors: any;
  size?: TarotCardSize;
}