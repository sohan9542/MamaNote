import { useState, type ReactNode } from 'react';
import { Pressable, type TextInputProps } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';

import { Input } from './Input';

interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  containerClassName?: string;
}

export function PasswordInput({
  label,
  error,
  leftIcon,
  containerClassName,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      label={label}
      error={error}
      containerClassName={containerClassName}
      secureTextEntry={!visible}
      leftIcon={leftIcon ?? <Lock size={18} color="#A89FBE" />}
      rightIcon={
        <Pressable
          onPress={() => setVisible((show) => !show)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff size={18} color="#A89FBE" />
          ) : (
            <Eye size={18} color="#A89FBE" />
          )}
        </Pressable>
      }
      {...rest}
    />
  );
}
