// components/Functional/InfiniteScrollStatus.tsx
import React from "react";
import { ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InfiniteScrollStatusProps {
  entityType: string;
  total: number;
  hasMore: boolean;
}

const InfiniteScrollStatus: React.FC<InfiniteScrollStatusProps> = ({
  entityType,
  total,
  hasMore,
}) => {
  const { t } = useTranslation();
  if (total === 0) return null;

  const plural = entityType;

  return (
    <div className="text-center py-8 flex flex-col items-center">
      {hasMore ? (
        <>
          <p className="text-foreground/50 mb-2 text-xs sm:text-sm">
            {t("scroll_more", { entityType: plural })}
          </p>
          <ArrowDown className="text-foreground/50 animate-bounce" size={20} />
        </>
      ) : (
        <p className="text-foreground/50 text-xs sm:text-sm">
          {t("end_reached", { total, entityType: plural })}
        </p>
      )}
    </div>
  );
};

export default InfiniteScrollStatus;
