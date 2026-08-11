import { FC } from "react";
import { Image } from "@heroui/react";
import { ProductAttribute, SwatchValue } from "@/types/ApiResponse";

interface AttributeSelectorProps {
  attribute: ProductAttribute;
  selectedAttributes: Record<string, string>;
  onChange: (attributeSlug: string, value: string) => void;
}

const AttributeSelector: FC<AttributeSelectorProps> = ({
  attribute,
  selectedAttributes,
  onChange,
}) => {
  const { name, slug, swatche_type, swatch_values } = attribute;

  return (
    <div key={slug} className="space-y-2">
      <h4 className="text-xxs sm:text-xs font-medium text-gray-700 dark:text-gray-300">
        {name}:{" "}
        <span className="text-gray-900 dark:text-white">
          {selectedAttributes[slug]}
        </span>
      </h4>

      <div className="flex flex-wrap gap-2">
        {swatch_values.map((swatch: SwatchValue) => {
          const isSelected = selectedAttributes[slug] === swatch.value;

          if (swatche_type === "image") {
            return (
              <button
                key={swatch.value}
                onClick={() => onChange(slug, swatch.value)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-2 overflow-hidden transition-all ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-200"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Image
                  src={swatch.swatch}
                  alt={swatch.value}
                  className="w-full h-full object-fill rounded-none"
                  classNames={{ wrapper: "h-full w-full" }}
                />
              </button>
            );
          } else if (swatche_type == "color") {
            return (
              <button
                key={swatch.value}
                onClick={() => onChange(slug, swatch.value)}
                className={`flex items-center gap-2 p-0 sm:text-xs font-medium rounded-lg  border-2 transition-all ${
                  isSelected
                    ? "border-primary-500 border-2"
                    : "border-gray-200 dark:border-default-200"
                }`}
              >
                {/* Color box */}
                <span
                  className="w-7 h-7 rounded-lg"
                  style={{ backgroundColor: swatch.value }}
                />
              </button>
            );
          } else {
            return (
              <button
                key={swatch.value}
                onClick={() => onChange(slug, swatch.value)}
                className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-300"
                }`}
              >
                {swatch.value}
              </button>
            );
          }
        })}
      </div>
    </div>
  );
};

export default AttributeSelector;
