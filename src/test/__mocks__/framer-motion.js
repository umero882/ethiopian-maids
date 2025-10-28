import React from 'react';

export const AnimatePresence = ({ children }) => <>{children}</>;

const Element = ({ children, ...props }) => (
  <div data-testid="motion" {...props}>
    {children}
  </div>
);

export const motion = new Proxy({}, { get: () => Element });

export default { AnimatePresence, motion };

