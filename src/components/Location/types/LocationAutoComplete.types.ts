export interface LocationAutoCompleteRef {
  setInputValue: (value: string) => void;
}

export interface MainText {
  text: string;
}

export interface SecondaryText {
  text: string;
}

export interface PlacePrediction {
  placeId: string;
  mainText: MainText | null;
  secondaryText: SecondaryText | null;
}

export interface AutocompleteSuggestionResult {
  placePrediction: PlacePrediction | null;
}

export interface FetchSuggestionsResponse {
  suggestions: AutocompleteSuggestionResult[];
}

export interface AutocompleteSuggestionRequest {
  input: string;
  sessionToken: google.maps.places.AutocompleteSessionToken;
  includedRegionCodes: string[];
}

export interface PredictionItem {
  key: string;
  label: string;
  description: string;
  original: PlacePrediction | null; // Use your custom PlacePrediction type
}

export interface LocationAutoCompleteProps {
  onLocationSelect: (location: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  }) => void;
}

export interface UserLocation {
  lat: number;
  lng: number;
  placeName: string;
  placeDescription: string;
}
