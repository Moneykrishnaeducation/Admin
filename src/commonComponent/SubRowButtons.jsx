import React from "react";

const SubRowButtons = ({
  actionItems,
}) => {
  return (
    <>
      {actionItems.map(({ icon, label, onClick }) => (
        <button
          key={label}
          className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 transition"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <span>{icon}</span> {label}
        </button>
      ))}
    </>
  );
};

export default SubRowButtons;

