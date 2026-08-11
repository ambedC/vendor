import { FC } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import CartAdditionalInfo from "./CartAdditionalInfo";
import CheckoutSection from "./CheckoutSection";
import CartPageEmpty from "../empty/CartPageEmpty";
import ConfettiTrigger from "@/components/Functional/ConfettiTrigger";
import SaveForLaterItems from "./SaveForLaterItems";

const CartPageView: FC = () => {
  const { cartData } = useSelector((state: RootState) => state.cart);

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex gap-2 flex-col">
        <CartPageEmpty />
        <SaveForLaterItems moreProductsInline={true} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-[60%] lg:w-[65%]">
        <div className="mt-4">
          <CartAdditionalInfo cart={cartData} />
        </div>
      </div>
      <ConfettiTrigger />

      {/* Checkout Section */}
      <div className="w-full md:w-[40%] lg:w-[35%] md:max-w-md">
        <CheckoutSection cart={cartData} />
      </div>
    </div>
  );
};

export default CartPageView;
