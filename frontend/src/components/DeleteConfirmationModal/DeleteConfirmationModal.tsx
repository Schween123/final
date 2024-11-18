import React from "react";
import { Button, Text } from "../../components";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
};

const DeleteConfirmationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure you want to remove this tenant?", // default title
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="bg-white p-5 rounded shadow-lg">
          <Text size="lg" as="p" className="font-open-sans mb-4">
            {title}
          </Text>
          <div className="flex justify-between">
            <Button onClick={onConfirm} className="mr-2">
              Remove
            </Button>
            <Button onClick={onClose} className="ml-2">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
