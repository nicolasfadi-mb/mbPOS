import React from 'react';

import { CoffeeIcon } from './icons/CoffeeIcon';
import { EspressoIcon } from './icons/EspressoIcon';
import { LatteArtIcon } from './icons/LatteArtIcon';
import { MugIcon } from './icons/MugIcon';
import { MochaIcon } from './icons/MochaIcon';
import { IcedCoffeeIcon } from './icons/IcedCoffeeIcon';
import { CroissantIcon } from './icons/CroissantIcon';
import { MuffinIcon } from './icons/MuffinIcon';
import { BagelIcon } from './icons/BagelIcon';
import { TeaCupIcon } from './icons/TeaCupIcon';
import { JuiceIcon } from './icons/JuiceIcon';

const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'coffee': CoffeeIcon,
  'espresso': EspressoIcon,
  'latte-art': LatteArtIcon,
  'mug': MugIcon,
  'mocha': MochaIcon,
  'iced-coffee': IcedCoffeeIcon,
  'croissant': CroissantIcon,
  'muffin': MuffinIcon,
  'bagel': BagelIcon,
  'tea-cup': TeaCupIcon,
  'juice': JuiceIcon,
};

export const productIconNames = Object.keys(iconMap);

interface ProductIconProps {
  icon: string;
  className?: string;
}

const ProductIcon: React.FC<ProductIconProps> = ({ icon, className }) => {
  const IconComponent = iconMap[icon] || CoffeeIcon; // Fallback to CoffeeIcon
  return <IconComponent className={className} />;
};

export default ProductIcon;
