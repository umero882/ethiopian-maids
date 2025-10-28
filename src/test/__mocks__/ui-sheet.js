import React from 'react';

const Wrap = ({ children, ...props }) => (
  <div data-testid="sheet" {...props}>
    {children}
  </div>
);

export const Sheet = Wrap;
export const SheetPortal = Wrap;
export const SheetOverlay = Wrap;
export const SheetTrigger = Wrap;
export const SheetClose = Wrap;
export const SheetContent = Wrap;
export const SheetHeader = Wrap;
export const SheetFooter = Wrap;
export const SheetTitle = Wrap;
export const SheetDescription = Wrap;

export default {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

