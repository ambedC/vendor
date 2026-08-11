import { forgotPassword, getSettings } from "@/routes/api";
import { GetServerSideProps } from "next";
import { ReactNode, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Divider,
  Link,
} from "@heroui/react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { isSSR } from "@/helpers/getters";
import DefaultLayout from "@/layouts/default";
import { isAxiosError } from "@/helpers/functionalHelpers";
import { NextPageWithLayout } from "@/types";
import { Settings } from "@/types/ApiResponse";
import { loadTranslations } from "../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";

interface ForgotPasswordProps {
  initialSettings?: Settings | null;
}

const ForgotPassword: NextPageWithLayout = (props: ForgotPasswordProps) => {
  const { initialSettings } = props;
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage(t("pages.forgotPassword.enterEmail"));
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await forgotPassword({ email });

      if (response.success) {
        setIsSuccess(true);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push("/");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(response.message || t("pages.forgotPassword.failed"));
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            t("pages.forgotPassword.error")
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t("pages.forgotPassword.unknownError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isEmailInvalid = email !== "" && !isValidEmail(email);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageHead pageTitle={t("pageTitle.forgot-password")} />
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardBody className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {t("pages.forgotPassword.emailSent")}
              </h2>
              <p className="mb-4">
                {t("pages.forgotPassword.checkEmail", { email })}
              </p>
              <p className="text-sm">
                {t("pages.forgotPassword.instructions")}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 mb-2">
                {t("pages.forgotPassword.redirecting")}
              </p>
              <div className="text-3xl font-bold text-blue-600">
                {countdown}
              </div>
            </div>

            <Button
              color="primary"
              variant="flat"
              onPress={() => router.push("/")}
              className="w-full"
            >
              {t("pages.forgotPassword.goHome")}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <PageHead pageTitle={t("pageTitle.forgot-password")} />

      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader>
          <div className="w-full">
            <Button
              isIconOnly
              variant="light"
              className="mb-4"
              onPress={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {t("pages.forgotPassword.title")}
              </h1>
              <p className="text-sm text-foreground/50">
                {t("pages.forgotPassword.subtitle")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              isRequired
              type="email"
              label={t("pages.forgotPassword.emailLabel")}
              placeholder={t("pages.forgotPassword.emailPlaceholder")}
              value={email}
              onValueChange={setEmail}
              isInvalid={isEmailInvalid}
              errorMessage={
                isEmailInvalid ? t("pages.forgotPassword.invalidEmail") : ""
              }
              startContent={
                <Mail className="w-4 h-4 text-gray-400 pointer-events-none shrink-0" />
              }
              classNames={{
                input: "text-sm",
                inputWrapper: "border-gray-200 hover:border-gray-300",
                errorMessage: "text-xs",
              }}
            />

            {errorMessage && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={loading}
              isDisabled={!email || isEmailInvalid}
            >
              {loading
                ? t("pages.forgotPassword.sending")
                : t("pages.forgotPassword.sendLink")}
            </Button>
          </form>

          <Divider className="my-6" />

          <div className="text-center">
            <p className="text-sm text-foreground/50">
              {t("pages.forgotPassword.rememberPassword") + " "}
              <Link
                onClick={async () => {
                  await router.push("/");
                  const btn = document.getElementById("login-btn");
                  btn?.click();
                }}
                className="font-medium cursor-pointer"
              >
                {t("pages.forgotPassword.signIn")}
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
      <div className="hidden">
        <DefaultLayout initialSettings={initialSettings}>{null}</DefaultLayout>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const settings = await getSettings();
        await loadTranslations(context);
        return {
          props: {
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialSettings: null,
            error: err instanceof Error ? err.message : "SSR error",
          },
        };
      }
    }
  : undefined;

ForgotPassword.getLayout = (page: ReactNode) => page;

export default ForgotPassword;
