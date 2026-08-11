import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { MapPin, Loader2, LocateFixed } from "lucide-react";
import type { Key } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import type {
  LocationAutoCompleteRef,
  PlacePrediction,
  PredictionItem,
  AutocompleteSuggestionRequest,
  LocationAutoCompleteProps,
} from "./types/LocationAutoComplete.types";
import { useTranslation } from "react-i18next";

// Enhanced props interface to include initial location
interface EnhancedLocationAutoCompleteProps extends LocationAutoCompleteProps {
  initialLocation?: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  } | null;
}

// Use forwardRef to pass the ref to the component
const LocationAutoComplete = forwardRef<
  LocationAutoCompleteRef,
  EnhancedLocationAutoCompleteProps
>(({ onLocationSelect, initialLocation }, ref) => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const allowedCountries = useMemo(() => {
    return webSettings?.enableCountryValidation
      ? webSettings?.allowedCountries || []
      : [];
  }, [webSettings?.allowedCountries, webSettings?.enableCountryValidation]);

  const [inputValue, setInputValue] = useState<string>("");
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<PlacePrediction | null>(null);
  const [gettingCurrentLocation, setGettingCurrentLocation] =
    useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [, setHasValidSelection] = useState<boolean>(false);

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Expose setInputValue to the parent via the ref
  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => {
      setInputValue(value);
      // Also update the selected state if we're setting a value
      if (value && initialLocation) {
        setSelected({
          mainText: { text: initialLocation.placeName },
          secondaryText: { text: initialLocation.placeDescription },
          placeId: "",
        });
      }
    },
  }));

  // Initialize with initial location if provided
  useEffect(() => {
    if (initialLocation && !isInitialized) {
      const displayText = initialLocation.placeDescription
        ? `${initialLocation.placeName}, ${initialLocation.placeDescription}`
        : initialLocation.placeName;

      setInputValue(displayText);
      setSelected({
        mainText: { text: initialLocation.placeName },
        secondaryText: { text: initialLocation.placeDescription },
        placeId: "",
      });
      setIsInitialized(true);
    } else if (!initialLocation && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialLocation, isInitialized]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.google === "undefined") {
      return;
    }

    // Don't fetch predictions if we're just displaying the initial location
    if (!isInitialized) return;

    // Skip prediction fetching if the input matches our initial location
    if (
      initialLocation &&
      inputValue ===
        (initialLocation.placeDescription
          ? `${initialLocation.placeName}, ${initialLocation.placeDescription}`
          : initialLocation.placeName)
    ) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    if (inputValue && inputValue.length > 1) {
      setLoading(true);

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(async () => {
        try {
          const { AutocompleteSuggestion, AutocompleteSessionToken } =
            (await google.maps.importLibrary(
              "places"
            )) as google.maps.PlacesLibrary;

          const token = new AutocompleteSessionToken();

          const request: AutocompleteSuggestionRequest = {
            input: inputValue,
            sessionToken: token,
            includedRegionCodes: allowedCountries,
          };

          const { suggestions } =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

          setPredictions(
            suggestions.map((s) => {
              // Check if s.placePrediction is not null
              if (s.placePrediction) {
                return {
                  key: s.placePrediction.placeId,
                  label: s.placePrediction.mainText?.text || "",
                  description: s.placePrediction.secondaryText?.text || "",
                  original: s.placePrediction,
                };
              } else {
                return {
                  key: "",
                  label: "",
                  description: "",
                  original: null,
                };
              }
            })
          );
        } catch (error) {
          console.error("Error fetching predictions:", error);
          setPredictions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setPredictions([]);
      setLoading(false);
    }

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [inputValue, isInitialized, initialLocation, allowedCountries]);

  const handleSelectionChange = async (key: Key | null): Promise<void> => {
    if (key !== null) {
      const selectedItem = predictions.find((item) => item.key === key);
      if (selectedItem) {
        setSelected(selectedItem.original);
        setHasValidSelection(true); // Mark that we have a valid selection

        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ placeId: selectedItem.key });
          if (result?.results[0]?.geometry?.location) {
            const { lat, lng } = result.results[0].geometry.location.toJSON();

            onLocationSelect({
              placeName: selectedItem.label,
              latLng: { lat, lng },
              placeDescription: selectedItem.description,
            });

            // Update input to show the selected location
            const displayText = selectedItem.description
              ? `${selectedItem.label}, ${selectedItem.description}`
              : selectedItem.label;
            setInputValue(displayText);
          }
        } catch (error) {
          console.error("Error fetching geocode:", error);
        }
      }
    } else {
      setSelected(null);
    }
  };

  // Update handleInputChange to clear the valid selection flag only when user types
  const handleInputChange = (value: string) => {
    setInputValue(value);
    // Clear the selected state when user starts typing
    if (selected && value !== inputValue) {
      setSelected(null);
      setHasValidSelection(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setGettingCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          try {
            const { Geocoder } = (await google.maps.importLibrary(
              "geocoding"
            )) as google.maps.GeocodingLibrary;
            const geocoder = new Geocoder();
            const result = await geocoder.geocode({ location: latLng });

            let placeName = "Current Location";
            const placeDescription = ""; // Changed from let to const

            if (result?.results[0]) {
              placeName = result.results[0].formatted_address;
            }

            onLocationSelect({
              placeName: placeName,
              latLng: latLng,
              placeDescription: placeDescription,
            });

            setInputValue(placeName);
            setSelected({
              mainText: { text: placeName },
              secondaryText: { text: "" },
              placeId: "",
            });
          } catch (error) {
            console.error("Error geocoding current location:", error);
          } finally {
            setGettingCurrentLocation(false);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          setGettingCurrentLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="w-full">
      <Autocomplete
        aria-label="Location selector"
        inputValue={inputValue}
        onInputChange={handleInputChange}
        items={predictions}
        placeholder={t("enter-city-or-address")}
        variant="faded"
        // allowsEmptyCollection={inputValue.length == 0}
        allowsCustomValue={true}
        classNames={{
          base: "group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:outline-none",
          selectorButton: "hidden",
        }}
        startContent={
          loading ? (
            <Loader2 className="h-5 w-5 text-default-400 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5 text-default-400" />
          )
        }
        listboxProps={{
          emptyContent: "",
        }}
        endContent={
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gettingCurrentLocation}
            className="p-1 rounded-full hover:bg-default-200 focus:outline-none focus:ring-2 focus:ring-default-400 cursor-pointer"
            aria-label="Get current location"
          >
            {gettingCurrentLocation ? (
              <Loader2 className="h-5 w-5 text-default-400 animate-spin" />
            ) : (
              <LocateFixed className="h-5 w-5 text-primary" />
            )}
          </button>
        }
        onSelectionChange={handleSelectionChange}
      >
        {(item: PredictionItem) => (
          <AutocompleteItem key={item.key} textValue={item.label}>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-default-500" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-default-500">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>

      {/* Display current selection info */}
      <div className="h-12 hidden">
        {selected && (
          <div className="mt-2 p-2 bg-default-100 rounded-md">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-success-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-success-700">
                  {selected.mainText?.text}
                </span>
                {selected.secondaryText?.text && (
                  <span className="text-xs text-default-600">
                    {selected.secondaryText.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LocationAutoComplete.displayName = "LocationAutoComplete";

export default LocationAutoComplete;
