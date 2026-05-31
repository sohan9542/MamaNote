import { Image, type ImageStyle, type StyleProp } from 'react-native';

const logoSource = require('../../assets/logo-clean.png');

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  className?: string;
}

export function Logo({ size = 96, style, className }: LogoProps) {
  return (
    <Image
      source={logoSource}
      accessibilityLabel="MamaNote logo"
      resizeMode="contain"
      className={className}
      style={[{ width: size, height: size }, style]}
    />
  );
}
