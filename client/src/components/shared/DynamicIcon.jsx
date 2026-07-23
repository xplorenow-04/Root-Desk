import React from 'react';
import { getIcon } from '@/lib/icons';

/**
 * Dynamic Icon renderer that fetches Lucide components by string identifier.
 */
const DynamicIcon = ({ name, className = 'h-5 w-5', style }) => {
  const IconComponent = getIcon(name);
  return <IconComponent className={className} style={style} />;
};

export default DynamicIcon;
