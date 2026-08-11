import React, { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  highlightText?: string;
  rightContent?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  highlightText,
  rightContent,
}) => {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col gap-0">
        <h1 className="xl:text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-foreground/50 xl:text-medium text-xs">
            {subtitle}{" "}
            {highlightText && (
              <span className="font-semibold text-primary">
                {highlightText}
              </span>
            )}
          </p>
        )}
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
};

export default PageHeader;
