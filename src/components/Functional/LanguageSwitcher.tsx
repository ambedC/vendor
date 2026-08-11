import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Image,
} from "@heroui/react";
import { getFlagEmoji } from "@/helpers/getters";
import { ChevronDown } from "lucide-react";
import { changeLanguage } from "../../../i18n";

const languages = [
  {
    code: "en",
    countryCode: "us",
    name: "English",
    flag: "🇺🇸",
  },
  {
    code: "hi",
    countryCode: "in",
    name: "हिन्दी",
    flag: "🇮🇳",
  },
  {
    code: "ar",
    countryCode: "sa",
    name: "العربية",
    flag: "🇸🇦",
  },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const getCurrentLanguage = () => {
    return (
      languages.find((lang) => lang.code === i18n.language) || languages[0]
    );
  };

  return (
    <Dropdown
      size="sm"
      classNames={{
        trigger: "p-0 min-w-9 data-[hover=true]:bg-inherit",
        base: "text-xs",
        content: "min-w-4 text-xs",
      }}
    >
      <DropdownTrigger className="w-fit sm:w-4">
        <Button variant="light" className="flex items-center gap-2 p-0">
          <div className="flex gap-1 items-end">
            <Image
              src={getFlagEmoji(getCurrentLanguage().countryCode)}
              alt={`flag`}
              className="h-4 w-5 rounded-sm sm:hidden"
            />
            <span className="inline">
              {getCurrentLanguage().code.charAt(0).toUpperCase() +
                getCurrentLanguage().code.slice(1)}
            </span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={[i18n.language]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) {
            changeLanguage(selected as string);
          }
        }}
      >
        {languages.map((language) => (
          <DropdownItem
            key={language.code}
            textValue={language.name}
            className="flex items-center gap-2"
            startContent={
              <Image
                src={getFlagEmoji(language.countryCode)}
                alt={`flag`}
                className="h-4 w-5 rounded-sm"
              />
            }
          >
            <span className={`fi fi-${language.countryCode} mr-2`} />
            <span>{language.name}</span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
