import { FC, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  useDisclosure,
  Divider,
  CardHeader,
  addToast,
} from "@heroui/react";
import {
  MapPin,
  Phone,
  Edit3,
  Trash2,
  Home,
  Building,
  Eye,
  Navigation,
  Globe,
  Building2,
} from "lucide-react";
import { Address } from "@/types/ApiResponse";
import AddressGoogleModal from "../Modals/AddressGoogleModal";
import AddressModal from "../Modals/AddressModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { deleteAddress } from "@/routes/api";
import { useTranslation } from "react-i18next";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: number | string) => void;
}

const AddressCard: FC<AddressCardProps> = ({ address, onDelete, onEdit }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isOpen: editOpen,
    onOpen: editOnOpen,
    onOpenChange: editOnOpenChange,
  } = useDisclosure();

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4 text-blue-500" />;
      case "work":
        return <Building className="w-4 h-4 text-green-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "home":
        return "primary";
      case "work":
        return "success";
      default:
        return "default";
    }
  };

  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  const handleDeleteAddress = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await deleteAddress({ id });

      if (res?.success) {
        addToast({
          title: t("address.deleted_title"),
          description: t("address.deleted_description"),
          color: "success",
        });
        onDelete?.(id);
      } else {
        addToast({
          title: t("address.delete_failed_title"),
          description: res?.message || t("address.delete_failed_description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      addToast({
        title: t("address.unexpected_error_title"),
        description: t("address.unexpected_error_description"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);

  const openConfirm = (id: number) => {
    setToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setToDeleteId(null);
    setIsConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (toDeleteId != null) {
      await handleDeleteAddress(toDeleteId);
    }
    closeConfirm();
  };

  return (
    <>
      <Card className="w-full h-full" shadow="sm">
        <CardHeader className="flex items-center justify-between pb-0">
          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              color={getAddressTypeColor(address.address_type)}
              variant="flat"
              className="capitalize text-xs"
              startContent={
                <div className="mr-1">
                  {getAddressTypeIcon(address.address_type)}
                </div>
              }
              title={t(
                `${address.address_type == "home" ? "home_title" : address.address_type}`
              )}
            >
              {t(
                `${address.address_type == "home" ? "home_title" : address.address_type}`
              )}
            </Chip>
          </div>
        </CardHeader>

        <CardBody className="space-y-3 pb-0">
          <div className="space-y-2">
            <div className="text-sm font-medium">{address.address_line1}</div>
            {address.address_line2 && (
              <div className="text-sm opacity-80">{address.address_line2}</div>
            )}
            <div className="flex items-center gap-4">
              {address.landmark && (
                <div className="flex items-center gap-2 text-sm opacity-50 w-fit">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>
                    {address.city}, {address.state} , {address.zipcode}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {address.landmark && (
                <div className="flex items-center gap-2 text-sm opacity-50 w-fit">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {truncateText(address.landmark, 30)}
                  </span>
                </div>
              )}
              {address.landmark && address.country && (
                <Divider orientation="vertical" className="h-4" />
              )}
              {address.country && (
                <div className="flex items-center gap-2 text-sm opacity-50">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{address.country}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-start w-full gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              <span>{address.mobile}</span>
            </div>
            <Divider orientation="vertical" />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>
                {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Eye className="w-3 h-3" />}
            onPress={onOpen}
            className="flex-1 text-xs"
            isDisabled={isLoading}
            title={t("view_map")}
          >
            {t("view_map")}
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="default"
            startContent={<Edit3 className="w-3 h-3" />}
            onPress={editOnOpen}
            className="flex-1 text-xs"
            isDisabled={isLoading}
            title={t("edit")}
          >
            {t("edit")}
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Trash2 className="w-3 h-3" />}
            onPress={() => openConfirm(address.id as number)}
            className="flex-1 text-xs"
            isLoading={isLoading}
            title={t("delete")}
          >
            {t("delete")}
          </Button>
        </CardFooter>
      </Card>

      <AddressGoogleModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        address={address}
      />
      <AddressModal
        isOpen={editOpen}
        onOpenChange={editOnOpenChange}
        initialData={address}
        onSave={() => {
          onEdit?.(address);
        }}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        title={t("address.delete_confirm_title") || "Delete address"}
        description={
          t("address.delete_confirm_description") ||
          "Are you sure you want to delete this address?"
        }
        alertTitle={t("address.delete_confirm_description")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="danger"
        size="sm"
      />
    </>
  );
};

export default AddressCard;
