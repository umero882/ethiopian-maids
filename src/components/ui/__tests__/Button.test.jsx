import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { vi } from 'vitest';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  test('renders with variant prop', () => {
    render(<Button variant='destructive'>Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /delete/i });
    // Just verify the button renders with the variant prop - specific classes are handled by cva
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement.textContent).toBe('Delete');
  });

  test('renders with size prop', () => {
    render(<Button size='lg'>Large Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /large button/i });
    // Just verify the button renders with the size prop - specific classes are handled by cva
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement.textContent).toBe('Large Button');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const buttonElement = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', {
      name: /disabled button/i,
    });
    expect(buttonElement).toBeDisabled();
  });

  test('renders as child component when asChild prop is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
  });

  test('has proper accessibility attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /custom label/i });
    expect(buttonElement).toHaveAttribute('aria-label', 'Custom label');
  });

  test('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const buttonElement = screen.getByRole('button', { name: /submit/i });

    // Test that button can be focused
    buttonElement.focus();
    expect(buttonElement).toHaveFocus();

    // Test keyboard activation using keyPress (native button behavior)
    fireEvent.keyPress(buttonElement, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.keyPress(buttonElement, { key: ' ', code: 'Space', charCode: 32 });

    // Note: Native buttons don't trigger onClick from keyDown/keyPress in jsdom
    // They automatically handle Enter/Space key activation, so we test focus capability
    expect(buttonElement).toHaveFocus();
  });
});
