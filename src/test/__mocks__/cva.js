export function cva(base = '', options = {}) {
  const variants = options.variants || {};
  const defaultVariants = options.defaultVariants || {};
  
  return ({ variant, size, className } = {}) => {
    // Use provided values or defaults
    const currentVariant = variant ?? defaultVariants.variant;
    const currentSize = size ?? defaultVariants.size;
    
    const vClass = variants.variant && currentVariant ? variants.variant[currentVariant] : '';
    const sClass = variants.size && currentSize ? variants.size[currentSize] : '';
    
    return [base, vClass, sClass, className].filter(Boolean).join(' ');
  };
}

export default { cva };
