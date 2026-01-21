import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingScreen from '../components/LoadingScreen';
import React from 'react';

describe('LoadingScreen', () => {
  it('renders the branding text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/DRIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/PRO/i)).toBeInTheDocument();
  });
});
