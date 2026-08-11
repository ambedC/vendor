import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  FC,
  ChangeEvent,
} from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Image,
} from "@heroui/react";
import { ChevronDown, Search, Smartphone } from "lucide-react";
import CountryList from "country-list-with-dial-code-and-flag";
import { debounce } from "lodash";
import { getFlagEmoji, getUserCountryCode } from "@/helpers/getters";
import {
  getExampleNumber,
  CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json"; // needed for max length check
import { useTranslation } from "react-i18next";

interface CountryData {
  name: string;
  code: string;
  dialCode: string;
  flag?: string;
}

interface PhoneInputProps {
  onPhoneChange?: (
    countryCode: string,
    phoneNumber: string,
    dialCode: string,
    name: string,
  ) => void;
  label?: string;
  labelPlacement?: "outside" | "outside-left" | "inside";
  variant?: "flat" | "bordered" | "faded" | "underlined";
  defaultCountry?: string;
  defaultValue?: string;
  placeholder?: string;
  isReadOnly?: boolean;
  className?: string;
  endContent?: React.ReactNode;
}

const PhoneInput: FC<PhoneInputProps> = ({
  onPhoneChange,
  defaultCountry = "US",
  label = "Mobile",
  labelPlacement = "outside",
  variant = "flat",
  placeholder = "Phone number",
  isReadOnly = false,
  className = "",
  defaultValue = "",
  endContent,
}) => {
  const [state, setState] = useState<{
    selectedCountryCode: string;
    phoneNumber: string;
    searchQuery: string;
    isDropdownOpen: boolean;
    selectedCountry: CountryData | null;
    maxPhoneLength: number | undefined;
  }>({
    selectedCountryCode: defaultCountry,
    phoneNumber: defaultValue,
    searchQuery: "",
    isDropdownOpen: false,
    selectedCountry: null,
    maxPhoneLength: undefined,
  });

  const [filteredCountries, setFilteredCountries] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const allCountries = useMemo(() => CountryList.getAll?.() || [], []);

  const searchCountries = useCallback(
    (query: string) => {
      const debouncedSearch = debounce(async (q: string) => {
        if (!q.trim()) {
          setFilteredCountries(allCountries.slice(0, 5));
          return;
        }
        try {
          setIsLoading(true);
          const countries = CountryList.findByKeyword(q.toLowerCase());
          setFilteredCountries(countries.slice(0, 5));
        } catch {
          setError("Failed to search countries");
          setFilteredCountries([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      debouncedSearch(query);
    },
    [allCountries],
  );

  useEffect(() => {
    const fetchDefaultCountry = async () => {
      try {
        setIsLoading(true);
        const country = CountryList.findOneByCountryCode(defaultCountry);
        if (country) {
          setState((prev) => ({
            ...prev,
            selectedCountryCode: country.code,
            selectedCountry: country,
          }));
        } else {
          setError("Invalid default country");
        }
      } catch {
        setError("Failed to load default country");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaultCountry();
  }, [defaultCountry]);

  const prevDefaultValueRef = useRef(defaultValue);
  useEffect(() => {
    if (defaultValue !== prevDefaultValueRef.current) {
      setState((prev) => ({ ...prev, phoneNumber: defaultValue || "" }));
      prevDefaultValueRef.current = defaultValue;
    }
  }, [defaultValue]);

  useEffect(() => {
    // fetch the real country code asynchronously
    const fetchUserCountry = async () => {
      try {
        const countryCode = await getUserCountryCode();
        const country = CountryList.findOneByCountryCode(countryCode);
        if (country) {
          setState((prev) => ({
            ...prev,
            selectedCountryCode: country.code,
            selectedCountry: country,
          }));
        }
      } catch (err) {
        console.error("Failed to get user country code", err);
      }
    };
    if (!defaultValue) {
      fetchUserCountry();
    }
  }, [defaultValue]);

  // Get example number for max length
  useEffect(() => {
    if (state.selectedCountryCode) {
      try {
        const example = getExampleNumber(
          state.selectedCountryCode as CountryCode,
          examples,
        );
        const maxLength = example
          ? example.nationalNumber.toString().length
          : undefined;
        setState((prev) => ({ ...prev, maxPhoneLength: maxLength }));
      } catch {
        setState((prev) => ({ ...prev, maxPhoneLength: undefined }));
        setError("Failed to fetch phone number format");
      }
    }
  }, [state.selectedCountryCode]);

  useEffect(() => {
    if (state.isDropdownOpen) {
      searchCountries(state.searchQuery);
    }
  }, [state.searchQuery, state.isDropdownOpen, searchCountries]);

  const handleCountryChange = useCallback(
    async (code: string) => {
      try {
        const country = await CountryList.findOneByCountryCode(code);
        if (country) {
          setState((prev) => ({
            ...prev,
            selectedCountryCode: code,
            selectedCountry: country,
            phoneNumber: "",
            isDropdownOpen: false,
          }));
          onPhoneChange?.(
            code,
            state.phoneNumber,
            country.dialCode,
            country.name,
          );
        }
      } catch {
        setError("Failed to select country");
      }
    },
    [onPhoneChange, state.phoneNumber],
  );

  const formatNumber = useCallback((num: string): string => {
    // Don't format the number - just return it as is to avoid leading zeros and spaces
    // The user will see exactly what they type
     return num;
  }, []);

  const handlePhoneNumberChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const cleanedValue = value.replace(/[^\d+]/g, "");
      const formattedValue = state.selectedCountryCode
        ? formatNumber(cleanedValue)
        : cleanedValue;
      setState((prev) => ({ ...prev, phoneNumber: formattedValue }));
      onPhoneChange?.(
        state.selectedCountryCode,
        cleanedValue,
        state.selectedCountry?.dialCode || "",
        state.selectedCountry?.name || "",
      );
    },
    [
      formatNumber,
      onPhoneChange,
      state.selectedCountryCode,
      state.selectedCountry,
    ],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {error && <span className="text-tiny text-danger">{error}</span>}
      <div className="flex w-full gap-2">
        <Input
          name="mobile"
          isRequired
          isReadOnly={isReadOnly}
          label={label}
          labelPlacement={labelPlacement}
          startContent={
            <Dropdown
              isDisabled={isReadOnly}
              className="w-full p-2"
              classNames={{ trigger: "max-h-[90%]" }}
              isOpen={state.isDropdownOpen}
              onOpenChange={(open) =>
                setState((prev) => ({ ...prev, isDropdownOpen: open }))
              }
            >
              <DropdownTrigger className="p-1">
                <Button
                  variant="flat"
                  className="min-w-[100px] justify-between bg-inherit p-2 min-h-full"
                  endContent={
                    <ChevronDown className="text-default-500" size={16} />
                  }
                  aria-label="Select country"
                >
                  {state.selectedCountry?.dialCode ? (
                    <div className="flex items-center gap-2">
                      <Image
                        src={getFlagEmoji(state.selectedCountry.code)}
                        alt={`${state.selectedCountry.code} flag`}
                        className="h-5 w-6 rounded-sm"
                      />
                      <span className="text-sm">
                        {state.selectedCountry.dialCode}
                      </span>
                    </div>
                  ) : (
                    "Select"
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Country Selection"
                className="w-[280px] max-h-[200px] p-0"
                closeOnSelect
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey) handleCountryChange(selectedKey);
                }}
                selectionMode="single"
                selectedKeys={[state.selectedCountryCode]}
                topContent={
                  <div className="sticky top-0 z-10 border-b border-divider px-1 py-2 shadow-sm">
                    <Input
                      placeholder="Search countries..."
                      value={state.searchQuery}
                      onValueChange={(value) =>
                        setState((prev) => ({ ...prev, searchQuery: value }))
                      }
                      startContent={
                        <Search className="text-default-400" size={16} />
                      }
                      size="sm"
                      variant="bordered"
                      classNames={{ inputWrapper: "border-1" }}
                      autoFocus
                      aria-label="Search countries"
                    />
                  </div>
                }
                classNames={{
                  list: "overflow-y-auto max-h-[150px] p-0 px-1",
                }}
              >
                {isLoading ? (
                  <DropdownItem key="loading" textValue="Loading...">
                    <span className="text-default-400">Loading...</span>
                  </DropdownItem>
                ) : filteredCountries.length === 0 &&
                  state.searchQuery.trim() === "" ? (
                  <DropdownItem
                    key="placeholder"
                    className="p-0 px-0.5"
                    textValue="Start typing to search countries"
                  >
                    <span className="text-default-400">
                      Start typing to search countries...
                    </span>
                  </DropdownItem>
                ) : filteredCountries.length === 0 ? (
                  <DropdownItem
                    key="no-results"
                    className="p-0"
                    textValue="No countries found"
                  >
                    <span className="text-default-400">No countries found</span>
                  </DropdownItem>
                ) : (
                  filteredCountries.map((item) => (
                    <DropdownItem
                      key={item.code}
                      textValue={`${item.name} (${item.dialCode})`}
                      className="p-2 my-1"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={getFlagEmoji(item.code)}
                          alt={`${item.code} flag`}
                          className="h-7 w-7 rounded-lg"
                        />
                        <div className="flex flex-col">
                          <span className="text-small">{item.name}</span>
                          <span className="text-xs text-default-500">
                            {`${item.dialCode} | ${item.code}`}
                          </span>
                        </div>
                      </div>
                    </DropdownItem>
                  ))
                )}
              </DropdownMenu>
            </Dropdown>
          }
          endContent={endContent || <Smartphone className="text-default-400" />}
          value={state.phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className="flex-1"
          type="tel"
          maxLength={state.maxPhoneLength}
          variant={variant}
          classNames={{
            inputWrapper: "pl-0",
            errorMessage: "text-xs",
          }}
          isDisabled={isLoading}
          aria-label="Phone number"
          isInvalid={
            state.phoneNumber.length > 0 &&
            state.phoneNumber.length < (state.maxPhoneLength ?? 12)
          }
          errorMessage={({ validationDetails }) => {
            if (validationDetails.valueMissing) {
              return t("phoneInput.error.required");
            }

            if (
              state.phoneNumber.length > 0 &&
              state.phoneNumber.length < (state.maxPhoneLength ?? 12)
            ) {
              return t("phoneInput.error.invalidLength", {
                max: state.maxPhoneLength,
              });
            }
            return "";
          }}
        />
      </div>
    </div>
  );
};

export default PhoneInput;
