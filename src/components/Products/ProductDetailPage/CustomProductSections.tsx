import { CustomProductSection } from "@/types/ApiResponse";
import Image from "next/image";
import React from "react";

interface CustomProductSectionsProps {
  sections: CustomProductSection[];
}

const CustomProductSections: React.FC<CustomProductSectionsProps> = ({
  sections,
}) => {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-10 w-full mb-10">
      {[...sections]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((section) => (
          <div key={section.uuid} className="flex flex-col gap-2">
            <h2 className="text-lg font-extrabold">{section.title}</h2>
            <p className="text-sm">{section.description}</p>
            <div className="grid grid-cols-1 gap-8 mt-2">
              {[...section.fields]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((field) => (
                  <div
                    key={field.uuid}
                    className="flex items-center gap-5 group transition-all duration-300"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0  rounded-3xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-[90%] h-[90%]">
                        {field.image ? (
                          <div className="relative w-[90%] h-[90%]">
                            <Image
                              src={field.image}
                              alt={field.title}
                              fill
                              className="object-contain cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 rounded-full">
                            <span className="text-primary font-bold text-xl uppercase">
                              {field.title?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 cursor-pointer">
                      <h3 className="text-sm font-bold  group-hover:text-primary transition-colors">
                        {field.title}
                      </h3>
                      <p className="text-xs text-foreground/50  leading-relaxed max-w-2xl">
                        {field.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default CustomProductSections;
