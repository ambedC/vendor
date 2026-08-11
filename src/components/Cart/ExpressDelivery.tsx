import { updateCartData } from "@/helpers/updators";
import { setRusDelivery } from "@/lib/redux/slices/checkoutSlice";
import { RootState } from "@/lib/redux/store";
import { Card, CardBody, Switch } from "@heroui/react";
import { Truck } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

const ExpressDelivery: React.FC = () => {
  const { selectedAddress, rushDelivery } = useSelector((state: RootState) => state.checkout);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);

  const [isRushEnabled, setIsRushEnabled] = React.useState(rushDelivery);
  const [isRushAvailable, setIsRushAvailable] = React.useState(false);

  const { t } = useTranslation();

  const dispatch = useDispatch();

  React.useEffect(() => {
    setIsRushEnabled(rushDelivery);
  }, [rushDelivery]);

  const handleRushSwitchToggle = async (checked: boolean) => {
    setIsRushEnabled(checked);

    dispatch(setRusDelivery(checked));

    setTimeout(async () => {
      const res = await updateCartData(true, false);

      if (
        !res?.data?.payment_summary?.is_rush_delivery_available &&
        checked &&
        selectedAddress?.id
      ) {
        await handleRushSwitchToggle(false);
        setIsRushAvailable(false);
      }
    }, 500);
  };

  const makeRushDeliveryOff = async () => {
    handleRushSwitchToggle(false);
  };

  const makeRushDeliveryAvailable = async () => {
    setIsRushAvailable(true);
  };

  return (
    <Card className="w-full" radius="md" shadow="sm">
      <CardBody className="space-y-4">
        <button
          onClick={makeRushDeliveryOff}
          className="hidden"
          id="rush-delivery-off"
        />
        <button
          onClick={makeRushDeliveryAvailable}
          className="hidden"
          id="rush-delivery-available"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Truck className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="flex gap-2">
                <p className="font-semibold text-xs md:text-small">
                  {t("express_rushDelivery")}
                </p>
              </div>
              <p className="text-xxs md:text-xs text-default-500">
                {t("express_rushDeliveryDescription")}
              </p>
            </div>
          </div>
          <Switch
            isDisabled={isLoading || !isRushAvailable}
            isSelected={isRushEnabled}
            onValueChange={handleRushSwitchToggle}
            color="success"
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default ExpressDelivery;
