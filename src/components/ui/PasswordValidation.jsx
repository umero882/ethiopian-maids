import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PasswordValidation = ({
  password = '',
  showPassword = false,
  onTogglePassword,
  className
}) => {
  // Simplified password validation rules
  const validations = [
    {
      id: 'minLength',
      label: '8+ characters',
      test: (pwd) => pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'Uppercase',
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      id: 'number',
      label: 'Number',
      test: (pwd) => /\d/.test(pwd),
    },
    {
      id: 'special',
      label: 'Special char',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    }
  ];

  // Only show if password has content
  if (password.length === 0) return null;

  return (
    <div className={cn("mt-1", className)}>
      {/* Inline validation items */}
      <div className="flex flex-wrap gap-1.5">
        {validations.map((validation) => {
          const isValid = validation.test(password);

          return (
            <div
              key={validation.id}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                isValid
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              )}
            >
              {isValid ? (
                <Check className="w-2.5 h-2.5" />
              ) : (
                <X className="w-2.5 h-2.5" />
              )}
              <span>{validation.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordValidation;