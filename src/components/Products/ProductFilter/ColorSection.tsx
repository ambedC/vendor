import { Accordion, AccordionItem, Badge, Tooltip } from "@heroui/react";
import { FC } from "react";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { SelectedFilters } from ".";

interface ColorSectionProps {
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
}

const ColorSection: FC<ColorSectionProps> = ({
  selectedFilters,
  setSelectedFilters,
}) => {
  const colors = [
    { name: "Black", value: "#1a1a1a" },
    { name: "Red", value: "#ff4d4d" },
    { name: "Blue", value: "#4d79ff" },
    { name: "Green", value: "#4dff88" },
    { name: "Yellow", value: "#ffd14d" },
    { name: "Dark", value: "#333333" },
    { name: "White", value: "#ffffff" },
  ];

  const handleColorSelect = (color: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      colors: prev?.colors?.includes(color)
        ? prev.colors.filter((c: string) => c !== color)
        : [...prev.colors, color],
    }));
  };

  return (
    <div className="w-full">
      <Accordion
        variant="light"
        itemClasses={{
          base: "mx-0",
          title: "text-xs",
          subtitle: "text-[10px] pl-1 text-foreground/50",
          content: "text-xs",
          trigger: "h-10",
        }}
      >
        <AccordionItem
          key="1"
          aria-label="Accordion Colors"
          title="Colors"
          subtitle="Click to select"
          indicator={
            <Badge
              color="primary"
              content={selectedFilters.colors.length || undefined}
              classNames={{
                badge: "text-xs",
              }}
            >
              <ChevronLeft size={20} />
            </Badge>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            {colors.map((color) => (
              <div className="w-auto shadow-2xl" key={color.name}>
                <Tooltip
                  content={color.name}
                  classNames={{ content: "text-xs" }}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full shadow-2xl cursor-pointer transition",
                      selectedFilters.colors.includes(color.value)
                        ? "border-primary-500 border-2"
                        : "border"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorSelect(color.value)}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ColorSection;
