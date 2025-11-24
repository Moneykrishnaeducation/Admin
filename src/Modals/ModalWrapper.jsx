import React from 'react';

const ModalWrapper = ({ title, visible, onClose, children, footer }) => {
  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
<div
  className="fixed inset-0 flex items-center justify-center z-50 px-4 
             bg-black bg-opacity-50 backdrop-blur-lg"
  onClick={onClose} // click outside closes modal
>
  <div
    className="
      bg-black bg-opacity-70 text-white rounded-lg shadow-lg 
      border border-yellow-500 
      p-6 relative 
      w-auto max-w-3xl min-w-[320px]
    "
    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button
        onClick={onClose}
        className="text-gray-300 hover:text-white text-2xl leading-none"
        aria-label="Close modal"
        type="button"
      >
        &times;
      </button>
    </div>

    {/* Body */}
    <div className="mb-4">{children}</div>

    {/* Footer */}
    {footer && <div>{footer}</div>}
  </div>
</div>

    </>
  );
};

export default ModalWrapper;
