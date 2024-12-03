import React, { ReactElement } from 'react'
import { Label } from '../ui/label';

interface InputProps {
    label?: string;
    name?: string;
    icon?: ReactElement;
    placeholder: string;
    type: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading?: boolean;
}
const CustomInput = ({
    label,
    name,
    icon,
    placeholder,
    type,
    value,
    onChange,
    isLoading,
}: InputProps
) => {
  return (
    <div className="">
        <Label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900">{label}</Label>
            <div className="relative">
              {icon && (
                <div className="absolute inset-y-0 start-0 flex items-center ps-6 pointer-events-none">
                    {icon}
                </div>
              )}
              <input
                  type={type}
                  id={name}
                  className="bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5"
                  placeholder={placeholder}
                  disabled={isLoading}
                  value={value}
                  onChange={onChange}
              />
        </div>
    </div>

  )
}

export default CustomInput