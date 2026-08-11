import React, { memo } from "react";
import { Clock, X } from "lucide-react";

type Props = {
  searchTerm: string;
  onChipClick: (searchTerm: string) => void;
  onRemoveSearch?: (searchTerm: string, e: React.MouseEvent) => void;
};

const RecentSearchItem: React.FC<Props> = ({
  searchTerm,
  onChipClick,
  onRemoveSearch,
}) => {
  return (
    <div
      onClick={() => onChipClick(searchTerm)}
      className="flex items-center justify-between px-4 py-3 hover:bg-default-100 cursor-pointer transition-colors border-b border-divider last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-foreground/50" />
        <span className="text-sm">{searchTerm}</span>
      </div>
      {onRemoveSearch && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSearch(searchTerm, e);
          }}
          className="p-1 rounded-full hover:bg-default-200 transition-colors"
        >
          <X className="w-4 h-4 text-foreground/50" />
        </button>
      )}
    </div>
  );
};

const Memo = memo(RecentSearchItem);
Memo.displayName = "RecentSearchItem";

export default Memo;
