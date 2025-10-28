import React from 'react';

export const Slot = ({ children, ...props }) => (
  <span data-testid="slot" {...props}>
    {children}
  </span>
);

export default { Slot };

