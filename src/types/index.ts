import { NextPage } from "next";
import { ReactNode, SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type NextPageWithLayout<P = object> = NextPage<P> & {
  getLayout?: (page: ReactNode) => ReactNode;
  pageTitle?: string;
};
