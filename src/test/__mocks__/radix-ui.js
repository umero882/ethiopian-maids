import React from 'react';

const Mock = ({ children, ...props }) => (
  <div data-testid="radix-mock" {...props}>
    {children}
  </div>
);

const handler = {
  get: () => Mock,
};

// Export a proxy so any named import maps to Mock
export default new Proxy({}, handler);
export const Root = Object.assign(Mock, { displayName: 'Root' });
export const Trigger = Object.assign(Mock, { displayName: 'Trigger' });
export const Content = Object.assign(Mock, { displayName: 'Content' });
export const Portal = Object.assign(Mock, { displayName: 'Portal' });
export const Overlay = Object.assign(Mock, { displayName: 'Overlay' });
export const Close = Object.assign(Mock, { displayName: 'Close' });
export const Title = Object.assign(Mock, { displayName: 'Title' });
export const Description = Object.assign(Mock, { displayName: 'Description' });
export const List = Object.assign(Mock, { displayName: 'List' });
export const Item = Object.assign(Mock, { displayName: 'Item' });
export const Value = Object.assign(Mock, { displayName: 'Value' });
export const Group = Object.assign(Mock, { displayName: 'Group' });
export const Label = Object.assign(Mock, { displayName: 'Label' });
export const Separator = Object.assign(Mock, { displayName: 'Separator' });
export const Arrow = Object.assign(Mock, { displayName: 'Arrow' });
export const Viewport = Object.assign(Mock, { displayName: 'Viewport' });
export const ScrollUpButton = Object.assign(Mock, { displayName: 'ScrollUpButton' });
export const ScrollDownButton = Object.assign(Mock, { displayName: 'ScrollDownButton' });
