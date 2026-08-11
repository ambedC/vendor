import { FC } from "react";
import { SelectedFilters } from ".";
import {
  Accordion,
  AccordionItem,
  Badge,
  Checkbox,
  ScrollShadow,
} from "@heroui/react";
import { FilterAttribute } from "@/types/ApiResponse";
import { ChevronLeft } from "lucide-react";

interface AttributeSectionProps {
  attributes: FilterAttribute[];
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
}

const AttributeSection: FC<AttributeSectionProps> = ({
  attributes,
  selectedFilters,
  setSelectedFilters,
}) => {

  const handleAttributeChange = (attributeValueId: number) => {
    setSelectedFilters((prev) => {
      const attribute_values = prev.attribute_values.includes(
        String(attributeValueId),
      )
        ? prev.attribute_values.filter((id) => id !== String(attributeValueId))
        : [...prev.attribute_values, String(attributeValueId)];
      return { ...prev, attribute_values };
    });
  };

  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {attributes.map((attribute) => (
        <div key={attribute.slug} className="w-full overflow-x-hidden">
          <Accordion
            variant="light"
            itemClasses={{
              base: "overflow-hidden !important",
              title: "text-xs",
              subtitle: "text-[10px] pl-1 text-foreground/50",
              content: "text-xs p-0",
              trigger: "h-10",
              indicator: "pr-2",
            }}
            defaultExpandedKeys={["1"]}
          >
            <AccordionItem
              key="1"
              aria-label={attribute.title}
              title={attribute.title}
              indicator={({ isOpen }) => {
                const selectedInThisAttr = attribute.values.filter((v) =>
                  selectedFilters.attribute_values.includes(String(v.id)),
                ).length;

                return (
                  <Badge
                    color="primary"
                    content={selectedInThisAttr || undefined}
                    className={`transition-transform duration-300 ${selectedInThisAttr ? "" : "hidden"} ${
                      isOpen ? "rotate-90" : "rotate-0"
                    }`}
                    classNames={{
                      badge: "text-xs",
                    }}
                  >
                    <ChevronLeft size={20} />
                  </Badge>
                );
              }}
            >
              <ScrollShadow
                hideScrollBar
                className="flex flex-col gap-2 p-2 max-h-[25vh]"
              >
                {attribute.values.map((value) => (
                  <Checkbox
                    key={value.id}
                    isSelected={selectedFilters.attribute_values.includes(
                      String(value.id),
                    )}
                    isDisabled={!value.enabled}
                    onChange={() => handleAttributeChange(value.id)}
                    className="text-xs"
                    classNames={{
                      label: `text-xs ${!value.enabled ? "opacity-50" : ""}`,
                      wrapper: "w-4 h-4",
                    }}
                  >
                    {value.title}
                  </Checkbox>
                ))}
              </ScrollShadow>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
};

export default AttributeSection;
