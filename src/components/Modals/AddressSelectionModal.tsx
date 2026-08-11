import React from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Radio,
  RadioGroup,
  Chip,
  Spinner,
} from "@heroui/react";
import { MapPin, Plus, Check } from "lucide-react";
import { Address } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

type AddressSelectionModalProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  onAddNew: () => void;
  addresses: Address[];
  selectedAddressId: string | null;
  tempSelectedId: string;
  handleModalSelection: (id: string) => void;
  handleConfirmSelection: () => void;
  getAddressTypeIcon: (type: string) => string;
  getAddressTypeColor: (
    type: string
  ) => "success" | "primary" | "warning" | "default";
  isLoading?: boolean;
  totalAddresses: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  isOpen,
  onOpenChange,
  onAddNew,
  addresses,
  selectedAddressId,
  tempSelectedId,
  handleModalSelection,
  handleConfirmSelection,
  getAddressTypeIcon,
  getAddressTypeColor,
  isLoading = false,
  totalAddresses,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const { t } = useTranslation();

  const handleAddNewClick = () => {
    onOpenChange(); // Close the modal first
    onAddNew(); // Then open add address modal
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
      backdrop="blur"
      isKeyboardDismissDisabled={false}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* HEADER */}
            <ModalHeader className="flex flex-col gap-1 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-semibold">
                    {t("addressSelection.header.title")}
                  </h2>
                  <p className="text-xs text-default-500 font-normal">
                    {totalAddresses > 0
                      ? t("addressSelection.header.subtitle.withAddresses", {
                          count: totalAddresses,
                          plural: totalAddresses > 1 ? "es" : "",
                        })
                      : t("addressSelection.header.subtitle.empty")}
                  </p>
                </div>
              </div>
            </ModalHeader>

            {/* BODY */}
            <ModalBody className="py-4 max-h-96">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Spinner size="lg" color="primary" />
                  <p className="text-sm text-default-500 mt-3">
                    {t("addressSelection.loading.message")}
                  </p>
                </div>
              ) : totalAddresses === 0 || addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-default-300 mx-auto mb-3" />
                  <p className="text-sm text-default-500 mb-4">
                    {totalAddresses === 0
                      ? t("addressSelection.empty.noAddresses")
                      : t("addressSelection.empty.failed")}
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleAddNewClick}
                  >
                    {t("addressSelection.empty.button")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <RadioGroup
                    value={tempSelectedId}
                    onValueChange={handleModalSelection}
                    classNames={{
                      wrapper: "gap-3",
                    }}
                  >
                    {addresses.map((address) => (
                      <Radio
                        key={address.id}
                        value={address.id.toString()}
                        classNames={{
                          base: "inline-flex m-0 bg-content1 hover:bg-content2 items-start justify-between flex-row-reverse max-w-full cursor-pointer rounded-xl gap-4 p-4 border border-foreground/20 data-[selected=true]:border-primary transition-all duration-200",
                          wrapper: "group-data-[selected=true]:border-primary",
                        }}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="text-xl">
                            {getAddressTypeIcon(address.address_type)}
                          </div>
                          <div className="flex flex-col gap-2 flex-1 w-full">
                            <div className="flex items-center justify-start gap-4 w-full">
                              <Chip
                                size="sm"
                                color={getAddressTypeColor(
                                  address.address_type
                                )}
                                variant="flat"
                                className="text-xs capitalize"
                              >
                                {address.address_type}
                              </Chip>
                              {selectedAddressId === address.id.toString() && (
                                <Chip
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  startContent={<Check className="w-3 h-3" />}
                                  className="text-xs"
                                >
                                  {t("addressSelection.current")}
                                </Chip>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium mb-1">
                                {address.address_line1}
                                {address.address_line2 &&
                                  `, ${address.address_line2}`}
                              </p>
                              <p className="text-xs text-default-500">
                                {address.city}, {address.state}{" "}
                                {address.zipcode}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Radio>
                    ))}
                  </RadioGroup>

                  {addresses.length < totalAddresses && (
                    <div className="flex justify-center mt-2 pb-2">
                      <Button
                        variant="light"
                        color="primary"
                        size="md"
                        onPress={onLoadMore}
                        isLoading={isLoadingMore}
                        className="font-semibold text-sm"
                      >
                        {isLoadingMore ? t("loading") : t("load_more")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            {/* FOOTER */}
            {!isLoading && addresses.length > 0 && (
              <ModalFooter className="pt-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={onClose}
                  className="text-sm"
                >
                  {t("cancel")}
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmSelection}
                  className="text-sm"
                  isDisabled={
                    !tempSelectedId || tempSelectedId === selectedAddressId
                  }
                >
                  {tempSelectedId === selectedAddressId
                    ? t("addressSelection.footer.alreadySelected")
                    : t("addressSelection.footer.confirm")}
                </Button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddressSelectionModal;
