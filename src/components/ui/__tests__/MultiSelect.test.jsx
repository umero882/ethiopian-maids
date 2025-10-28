import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiSelect from '@/components/ui/multi-select';
import { vi } from 'vitest';

describe('MultiSelect', () => {
  it('renders placeholder and selects items with chips', () => {
    const options = ['One', 'Two', 'Three'];
    const onChange = vi.fn();
    render(<MultiSelect options={options} selected={[]} onChange={onChange} placeholder='Pick items' />);

    // Shows placeholder initially
    const triggerText = screen.getByText(/pick items/i);
    const trigger = triggerText.closest('button');
    expect(trigger).not.toBeNull();

    // Open popover
    fireEvent.click(trigger);
    // Click first option
    fireEvent.click(screen.getByText('One'));
    expect(onChange).toHaveBeenCalledWith(['One']);
  });
});

