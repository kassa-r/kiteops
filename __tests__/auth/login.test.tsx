import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';
import { AuthService } from '@/lib/auth-service';
import { toast } from 'sonner';

// Mock AuthService
vi.mock('@/lib/auth-service', () => ({
  AuthService: {
    login: vi.fn(),
    getUserRole: vi.fn(),
  },
}));

// Mock Next.js router
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome Back')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeDefined();
    expect(screen.getByText("Don't have an account?")).toBeDefined();
  });

  it('submits form with valid data and redirects', async () => {
    vi.mocked(AuthService.getUserRole).mockResolvedValue('instructor');
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    
    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(AuthService.getUserRole).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully.');
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('handles login error', async () => {
    vi.mocked(AuthService.login).mockRejectedValue(new Error('Invalid login credentials'));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid login credentials');
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it('validates form inputs', async () => {
    render(<LoginPage />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeDefined();
      expect(screen.getByText('Password is required.')).toBeDefined();
      expect(AuthService.login).not.toHaveBeenCalled();
    });
  });
});
