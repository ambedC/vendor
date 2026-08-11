// MyButton.tsx
import { extendVariants, Button } from "@heroui/react";

export const MyButton = extendVariants(Button, {
  variants: {
    size: {
      xs: "p-2 min-w-12 h-7 text-tiny gap-1 rounded-small",
      responsive: `
      px-3 py-2 min-w-16 h-8 text-tiny gap-2 rounded-small
      sm:px-4 sm:py-2.5 sm:min-w-16 sm:h-10 sm:text-base sm:gap-3 sm:rounded-medium
      md:px-4 md:py-2.5 md:min-w-18 md:h-10 md:text-small md:gap-2 md:rounded-medium
    `,
    },
  },
});
