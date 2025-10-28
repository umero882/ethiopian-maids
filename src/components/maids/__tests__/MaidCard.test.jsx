import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderComponent } from '@/utils/testUtils.jsx';
import MaidCard from '../MaidCard';
import { vi } from 'vitest';

const mockMaid = {
  id: 1,
  name: 'Test Maid',
  image: '/test-image.jpg',
  country: 'Ethiopia',
  age: 28,
  verified: true,
  rating: 4.5,
  experience: '3 years',
  skills: ['Cooking', 'Cleaning'],
  languages: ['English', 'Amharic'],
  description: 'Test description',
  availability: 'Available',
  salaryDisplay: '$300-$400',
};

const mockNavigate = vi.fn();
const mockOnContact = vi.fn();
const mockOnFavorite = vi.fn();

describe('MaidCard', () => {
  test('renders maid information correctly', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onFavorite={mockOnFavorite}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    expect(screen.getByText('Test Maid')).toBeInTheDocument();
    expect(screen.getByText('Ethiopia • 28 years old')).toBeInTheDocument();
    expect(screen.getByText('3 years')).toBeInTheDocument();
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('English, Amharic')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('$300-$400')).toBeInTheDocument();
  });

  test('calls onContact when contact button is clicked', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onFavorite={mockOnFavorite}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    fireEvent.click(screen.getByText('Contact'));
    expect(mockOnContact).toHaveBeenCalledWith(mockMaid);
  });

  test('navigates to profile when view profile button is clicked', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onFavorite={mockOnFavorite}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    fireEvent.click(screen.getByText('View Profile'));
    expect(mockNavigate).toHaveBeenCalledWith(`/profile?maidId=${mockMaid.id}`);
  });

  test('calls onFavorite when favorite button is clicked', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onFavorite={mockOnFavorite}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    const favoriteButton = screen.getByLabelText(
      `Add ${mockMaid.name} to favorites`
    );
    fireEvent.click(favoriteButton);
    expect(mockOnFavorite).toHaveBeenCalledWith(mockMaid);
  });

  test('adds ARIA attributes for accessibility', () => {
    renderComponent(
      <MaidCard
        maid={mockMaid}
        index={0}
        onContact={mockOnContact}
        onFavorite={mockOnFavorite}
        user={{ id: 'user1' }}
        navigate={mockNavigate}
      />
    );

    // Check for ARIA attributes
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute(
      'aria-labelledby',
      `maid-${mockMaid.id}-name`
    );

    const favoriteButton = screen.getByLabelText(
      `Add ${mockMaid.name} to favorites`
    );
    expect(favoriteButton).toBeInTheDocument();

    const contactButton = screen.getByLabelText(`Contact ${mockMaid.name}`);
    expect(contactButton).toBeInTheDocument();

    const viewProfileButton = screen.getByLabelText(
      `View ${mockMaid.name}'s profile`
    );
    expect(viewProfileButton).toBeInTheDocument();
  });
});
