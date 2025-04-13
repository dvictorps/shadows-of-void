import React from "react";
import clsx from "clsx"; // Utility for conditionally joining class names

// Define the props for the Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // Add other specific props if needed in the future, e.g., variant, size
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  disabled,
  onClick,
  type = "button", // Default type to button
  ...rest // Pass down any other standard button attributes
}) => {
  // Corrected multi-line string format
  const baseClasses = `
    border border-white 
    px-4 py-2 
    rounded 
    transition-colors duration-200 
    uppercase 
    text-xs 
    font-semibold
  `;

  // Corrected multi-line string format
  const enabledClasses = `
    text-white 
    hover:bg-white hover:text-black
  `;

  // Corrected multi-line string format
  const disabledClasses = `
    border-gray-600 text-gray-600 
    cursor-not-allowed
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseClasses,
        disabled ? disabledClasses : enabledClasses,
        className // Allow merging custom classes
      )}
      {...rest} // Spread the rest of the props
    >
      {children}
    </button>
  );
};

export default Button;
