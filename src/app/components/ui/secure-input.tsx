import * as React from "react";
import { Input } from "./input";
import { sanitizeString } from "@/lib/security";
import { cn } from "./cn";

export interface SecureInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
}

const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type, sanitize = true, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (sanitize && onChange) {
        const sanitizedValue = sanitizeString(e.target.value);
        const sanitizedEvent = {
          ...e,
          target: {
            ...e.target,
            value: sanitizedValue,
          },
        };
        onChange(sanitizedEvent as React.ChangeEvent<HTMLInputElement>);
      } else if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        type={type}
        className={cn(className)}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SecureInput.displayName = "SecureInput";

export { SecureInput };
