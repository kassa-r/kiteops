import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SignupPage from '@/app/(auth)/signup/page';
import { AuthService } from '@/lib/auth-service';
import { toast } from 'sonner';

// Mock AuthService
vi.mock('@/lib/auth-service', () => ({
  AuthService: {
    register: vi.fn(),
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

describe('SignupPage', () => {
  it('renders sign up form correctly', () => {
    render(<SignupPage />);
    expect(screen.getByText('Create an Account')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByText('Role')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDefined();
  });

  it('submits form with valid data', async () => {
    render(<SignupPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Default role is Instructor, so we don't need to change it for this test
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledWith('test@example.com', 'password123', 'instructor');
      expect(toast.success).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/verify-email');
    });
  });
  
  it('handles registration error', async () => {
    vi.mocked(AuthService.register).mockRejectedValue(new Error('Registration failed'));
    
    render(<SignupPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Registration failed');
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
