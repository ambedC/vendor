import React, { FC } from "react";

interface SectionHeadingProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

const SectionHeading: FC<SectionHeadingProps> = ({
  title,
  description,
  icon,
  color,
}) => {
  return (
    <div>
      <div className="flex justify-between w-full items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-r from-primary-500 to-primary-400 rounded-full">
            {icon}
          </div>

          <div>
            <h1
              className="text-sm sm:text-lg font-bold tracking-wide sm:tracking-wider"
              style={{ color: color || undefined }}
            >
              {title}
            </h1>

            <p
              className="text-xxs sm:text-xs text-foreground/50"
              style={{ color: color || undefined }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionHeading;
