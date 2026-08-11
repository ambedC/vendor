import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { FC } from "react";
import GoogleMap from "../Location/GoogleMap";
import { Address } from "@/types/ApiResponse";
import { Building, Home, MapPin } from "lucide-react";

type AddressGoogleModalProps = {
  address: Address;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const AddressGoogleModal: FC<AddressGoogleModalProps> = ({
  isOpen,
  onOpenChange,
  address,
}) => {
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4 text-green-500" />;
      case "work":
        return <Building className="w-4 h-4 text-green-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAddress = () => {
    return [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.zipcode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {getAddressTypeIcon(address.address_type)}
                <span className="capitalize">{address.address_type}</span>
              </div>
              <div className="text-sm font-normal text-foreground/70">
                {formatAddress()}
              </div>
            </ModalHeader>
            <ModalBody className="pb-6">
              <GoogleMap
                latLng={{ lat: address.latitude, lng: address.longitude }}
                onLocationUpdate={() => {}} // Read-only mode
              />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddressGoogleModal;
