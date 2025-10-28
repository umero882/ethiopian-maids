export const io = () => {
  const handlers = {};
  return {
    on: (event, cb) => {
      handlers[event] = cb;
    },
    emit: (event, payload) => {
      if (handlers[event]) handlers[event](payload);
    },
    disconnect: () => {},
  };
};

