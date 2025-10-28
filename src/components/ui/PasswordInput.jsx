import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PasswordValidation from './PasswordValidation';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef(({
  className,
  showValidation = true,
  showStrengthIndicator = true,
  placeholder = "Enter your password",
  value = '',
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div>
      {/* Password Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>

        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "pl-10 pr-12",
            isFocused && "ring-2 ring-primary/20 border-primary",
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-foreground text-muted-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Password Validation Component - Inline and minimal */}
      {showValidation && (
        <PasswordValidation
          password={value}
          showPassword={showPassword}
          onTogglePassword={!showStrengthIndicator ? togglePasswordVisibility : undefined}
        />
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };