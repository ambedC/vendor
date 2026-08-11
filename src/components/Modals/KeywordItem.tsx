import React, { memo } from "react";
import { Search } from "lucide-react";

type Props = {
  keyword: string;
  onClick: (keyword: string) => void;
  isActive?: boolean;
  onMouseEnter?: () => void;
};

const KeywordItem: React.FC<Props> = ({
  keyword,
  onClick,
  isActive = false,
  onMouseEnter,
}) => {
  return (
    <div
      onClick={() => onClick(keyword)}
      onMouseEnter={onMouseEnter}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onClick(keyword);
        }
      }}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-default-100 cursor-pointer transition-colors border-b border-divider last:border-b-0 ${
        isActive ? "bg-default-100" : ""
      }`}
    >
      <Search className="w-4 h-4 text-foreground/50" />
      <span className="text-sm">{keyword}</span>
    </div>
  );
};

const Memo = memo(KeywordItem);
Memo.displayName = "KeywordItem";

export default Memo;
