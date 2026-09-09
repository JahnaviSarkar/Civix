import React from 'react';
import { TopHeader } from './TopHeader';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return <TopHeader />;
};
