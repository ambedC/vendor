// src/guards/authGuard.ts
import { GetServerSidePropsContext } from "next";
import { getAccessTokenFromContext } from "@/helpers/auth";

export const PROTECTED_ROUTES = [
  "/cart",
  "/my-account",
  "/my-account/orders",
  "/my-account/addresses",
  "/my-account/wallet",
  "/my-account/transactions",
  "/my-account/refer-and-earn",
];

export const isProtectedRoute = (path: string) => {
  return PROTECTED_ROUTES.some((route) => {
    if (route.endsWith("/*")) {
      const baseRoute = route.slice(0, -2);
      return path.startsWith(baseRoute);
    }
    return path === route;
  });
};

export const serverSideAuthGuard = async (
  context: GetServerSidePropsContext
) => {
  try {
    const access_token = await getAccessTokenFromContext(context);

    if (!access_token) {
      return {
        redirect: {
          destination: "/?auth=required",
          permanent: false,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Auth guard error:", error);
    return {
      redirect: {
        destination: "/?auth=error",
        permanent: false,
      },
    };
  }
};
