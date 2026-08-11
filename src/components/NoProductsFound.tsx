import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface NoProductsFoundProps {
  title: string;
  description: string;
  icon: LucideIcon;
  customActions?: ReactNode;
}

const NoProductsFound: React.FC<NoProductsFoundProps> = ({
  title,
  description,
  icon: IconComponent,
  customActions,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-foreground/10 rounded-full flex items-center justify-center mb-6">
          <IconComponent
            className="w-10 h-10 sm:w-12 sm:h-12 text-foreground/50"
            strokeWidth={1.5}
          />
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold mb-3">{title}</h2>

        {/* Description */}
        <p className="text-foreground/50 text-xs leading-relaxed mb-8">
          {description}
        </p>

        {/* Custom Actions */}
        {customActions && (
          <div className="flex gap-3 mt-2">{customActions}</div>
        )}
      </div>
    </div>
  );
};

export default NoProductsFound;
