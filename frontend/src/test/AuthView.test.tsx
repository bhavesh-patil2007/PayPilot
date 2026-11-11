import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthView } from '../views/AuthView';
import { DEMO_CREDENTIALS } from '../services/appAuth';

describe('AuthView Component', () => {
  it('renders FinCora AI branding and "Sign in to FinCora AI" title', () => {
    const handleAuth = vi.fn();
    render(<AuthView onAuthenticated={handleAuth} />);

    expect(screen.getByRole('heading', { name: 'Sign in to FinCora AI' })).toBeInTheDocument();
    expect(screen.getByText('Autonomous Financial Defense')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('clicking the demo credentials box autofills email and password fields', () => {
    const handleAuth = vi.fn();
    render(<AuthView onAuthenticated={handleAuth} />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    const demoCard = screen.getByTitle('Click to autofill demo credentials');
    fireEvent.click(demoCard);

    expect(emailInput.value).toBe(DEMO_CREDENTIALS.email);
    expect(passwordInput.value).toBe(DEMO_CREDENTIALS.password);
    expect(screen.getByText('Loaded!')).toBeInTheDocument();
  });

  it('submits successfully with demo credentials', () => {
    const handleAuth = vi.fn();
    render(<AuthView onAuthenticated={handleAuth} />);

    const demoCard = screen.getByTitle('Click to autofill demo credentials');
    fireEvent.click(demoCard);

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitButton);

    expect(handleAuth).toHaveBeenCalledWith('demo', DEMO_CREDENTIALS.email);
  });

  it('clicking Sign in with Google triggers seamless demo sign-in when Supabase unconfigured', () => {
    const handleAuth = vi.fn();
    render(<AuthView onAuthenticated={handleAuth} />);

    const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
    fireEvent.click(googleButton);

    expect(handleAuth).toHaveBeenCalledWith('demo', 'google.demo@fincora.ai');
  });
});
