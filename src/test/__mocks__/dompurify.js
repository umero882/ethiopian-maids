// Minimal DOMPurify mock for Jest environment
const DOMPurify = {
  setConfig: () => {},
  sanitize: (html) => (typeof html === 'string' ? html : ''),
};

export default DOMPurify;

