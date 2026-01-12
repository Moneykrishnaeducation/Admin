import React, { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const ModalWrapper = ({ title, visible, onClose, children, footer, maxWidthClass = 'max-w-3xl' }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  /* ===============================
     LOCK BODY SCROLL
  =============================== */
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  /* ===============================
     THEME CLASSES
  =============================== */
  const overlayCls = `
    fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3
  `;

  const modalCls = isDarkMode
    ? `
      bg-black/80 text-yellow-200
      border border-yellow-600
    `
    : `
      bg-white text-gray-900
      border border-gray-300
    `;

  const headerCls = isDarkMode
    ? "border-b border-yellow-700"
    : "border-b border-gray-200";

  const footerCls = isDarkMode
    ? "border-t border-yellow-700"
    : "border-t border-gray-200";

  return (
    <>
      {/* OVERLAY */}
      <div className={overlayCls} onClick={onClose} />

      {/* MODAL CONTAINER */}
      <div
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          px-3 sm:px-4
        "
        onClick={onClose}
      >
        {/* MODAL BOX */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
            relative w-full ${maxWidthClass} min-w-[320px]
            rounded-xl shadow-2xl
            ${modalCls}
            flex flex-col
            max-h-[90vh]
          `}
        >
          {/* HEADER */}
          <div
            className={`
              flex items-center justify-between
              px-5 py-4
              sticky top-0
              z-10
              ${headerCls}
            `}
          >
            <h3 className="text-lg font-semibold truncate">
              {title}
            </h3>

            <button
              onClick={onClose}
              aria-label="Close modal"
              type="button"
              className="
                text-xl leading-none
                text-gray-400 hover:text-yellow-400
                transition
              "
            >
              &times;
            </button>
          </div>

          {/* BODY */}
          <div className="px-5 py-4 overflow-y-auto flex-1">
            {children}
          </div>

          {/* FOOTER */}
          {footer && (
            <div
              className={`
                px-5 py-4
                sticky bottom-0
                ${footerCls}
              `}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModalWrapper;
