import React from "react";
const EmptyWishListState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon className="w-16 h-16 text-default-300 mb-4" />
      <h3 className="text-lg font-semibold text-default-500 mb-2">{title}</h3>
      <p className="text-sm text-default-400 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyWishListState;
