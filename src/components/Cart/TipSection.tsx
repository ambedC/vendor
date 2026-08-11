import { Button, Input } from "@heroui/react";
import { Heart } from "lucide-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface TipSectionProps {
  selectedTip: number | null;
  setSelectedTip: (tip: number | null) => void;
  customTip: string;
  setCustomTip: (tip: string) => void;
}

const TipSection: FC<TipSectionProps> = ({
  selectedTip,
  setSelectedTip,
  customTip,
  setCustomTip,
}) => {
  const { t } = useTranslation();
  const predefinedTips = [10, 15, 20, 25];

  const handleTipSelect = (tip: number) => {
    setSelectedTip(tip);
    setCustomTip("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setSelectedTip(null);
  };

  const getCurrentTipAmount = () => {
    if (customTip) return parseFloat(customTip) || 0;
    return selectedTip || 0;
  };

  return (
    <div className="w-full bg-default-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={18} className="text-orange-500 fill-orange-500" />
        <h3 className="font-medium text-small">{t("tip.sectionTitle")}</h3>
      </div>
      <p className="text-xs opacity-50 mb-4">{t("tip.sectionDescription")}</p>

      {/* Predefined Tip Options */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {predefinedTips.map((tip) => (
          <button
            key={tip}
            onClick={() => handleTipSelect(tip)}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedTip === tip
                ? "bg-orange-500 text-white shadow-md"
                : "border border-gray-200 hover:border-orange-300"
            }`}
          >
            ${tip}
          </button>
        ))}
      </div>

      {/* Custom Tip Input */}
      <div className="flex gap-2">
        <Input
          placeholder={t("tip.customPlaceholder")}
          value={customTip}
          onChange={(e) => handleCustomTipChange(e.target.value)}
          type="number"
          min="0"
          step="1"
          className="flex-1"
          classNames={{
            input: "text-sm",
            inputWrapper: `border rounded-md ${
              customTip ? "border-orange-300" : "border-gray-200"
            }`,
          }}
          startContent={<span className="text-sm">$</span>}
        />
        <Button
          variant="flat"
          className="font-medium"
          onPress={() => {
            setCustomTip("");
            setSelectedTip(null);
          }}
        >
          {t("tip.clearButton")}
        </Button>
      </div>

      {getCurrentTipAmount() > 0 ? (
        <div className="mt-3 p-2 bg-secondary-50 dark:bg-transparent rounded-md">
          <p className="text-xs">
            {t("tip.currentAmount", {
              amount: `$${getCurrentTipAmount().toFixed(2)}`,
            })}
          </p>
        </div>
      ) : (
        <div className="mt-3 p-2 bg-secondary-50 dark:bg-transparent rounded-md">
          <p className="text-xs">{t("tip.defaultMessage")}</p>
        </div>
      )}
    </div>
  );
};

export default TipSection;
