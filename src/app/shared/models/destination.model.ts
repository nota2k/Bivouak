export interface DestinationRating {
  label: string;
  value: string;
  color: string;
}

export interface Destination {
  id: string;
  ville: string;
  name: string;
  region: string;
  regionFull: string;
  notes: string;
  photos: string[];
  coords: string;
  ratings: DestinationRating[];
}
