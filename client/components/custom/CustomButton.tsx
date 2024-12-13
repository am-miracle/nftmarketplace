import React, { ReactElement } from 'react'
import { Button } from '../ui/button';
import { Icons } from '../shared/icons';

interface ButtonProps{
  title: string;
  icon?: ReactElement;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
  type: "button" | "submit" | "reset";
  isDisabled?: boolean
}

const CustomButton = ({isLoading, icon, title, onClick, className, type, isDisabled}: ButtonProps) => {
  return (
    <Button
        type={type}
        className={`h-11 px-5 py-3 font-semibold rounded-[20px] text-base text-white hover:scale-95 ease-in-out duration-300 ${className}`}
        disabled={isLoading || isDisabled}
        onClick={onClick}
    >
    {isLoading && (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
    )}
    {icon && icon}
    {title}
    </Button>
  )
}

export default CustomButton