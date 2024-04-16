import React from 'react';
import { Tag } from '@chakra-ui/react';

type ColorfulTagProps = {
  color: 'RED' | 'GREEN' | 'BLUE' | 'YELLOW' | 'ORANGE' | 'PURPLE' | 'BLACK' | 'WHITE';
  label: string;
};

const ColorfulTag: React.FC<ColorfulTagProps> = ({ color, label }) => {
  const mapColorScheme = (colorEnum: ColorfulTagProps['color']) => {
    const colorMap: { [key in ColorfulTagProps['color']]: string } = {
      RED: 'red',
      GREEN: 'green',
      BLUE: 'blue',
      YELLOW: 'yellow',
      ORANGE: 'orange',
      PURPLE: 'purple',
      BLACK: 'gray', // Chakra UI doesn't have a 'black' color scheme
      WHITE: 'whiteAlpha', // 'whiteAlpha' for a white-ish scheme
    };

    return colorMap[colorEnum] || '';
  };

  return (
    <Tag colorScheme={mapColorScheme(color)} variant="solid" borderRadius='full'>
      {label}
    </Tag>
  );
};

export default ColorfulTag;
