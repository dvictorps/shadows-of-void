import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  maxWidthClass?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidthClass = "max-w-sm",
}) => {
  if (!isOpen) return null;

  return (
    // Overlay: closes modal on click
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      onClick={onClose}
    >
      {/* Modal Content: stop propagation to prevent closing when clicking inside */}
      <div
        className={`bg-black border border-white p-6 rounded-lg shadow-xl ${maxWidthClass} mx-auto flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-center mb-4 flex-shrink-0">
          {title}
        </h3>
        <div className="text-center mb-6 flex-grow overflow-y-auto custom-scrollbar">
          {children}
        </div>
        <div className="flex justify-around mt-auto flex-shrink-0 pt-4">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default Modal;
