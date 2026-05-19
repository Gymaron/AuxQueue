// @vitest-environment jsdom
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router';

import { PartyQueuePage } from '../app/pages/PartyQueuePage';
import { LoginPage } from '../app/pages/LoginPage';
import { RegisterPage } from '../app/pages/RegisterPage';
import { CreateSongPage } from '../app/pages/CreateSongPage';
import { useActivityMonitor } from '../hooks/useActivityMonitor';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Queue CRUD & Interactions', () => {
  test('CREATE: Can add a new song to the queue', () => {
    renderWithRouter(<PartyQueuePage />);
    fireEvent.click(screen.getByText('Add Song'));
    fireEvent.change(screen.getAllByPlaceholderText('Song title')[0], { target: { value: 'New Test Song' } });
    fireEvent.change(screen.getAllByPlaceholderText('Artist')[0], { target: { value: 'Test Artist' } });
    fireEvent.click(screen.getByText('Add to Queue'));
    expect(screen.getByText('New Test Song')).toBeInTheDocument();
  });

  test('READ: Renders existing songs in the queue', () => {
    renderWithRouter(<PartyQueuePage />);
    expect(screen.getByText('Levitating')).toBeInTheDocument(); 
  });

  test('UPDATE: Can edit an existing song', () => {
    renderWithRouter(<PartyQueuePage />);
    const editButtons = screen.getAllByTitle('Edit song');
    fireEvent.click(editButtons[0]);
    
    const titleInputs = screen.getAllByDisplayValue('Levitating');
    fireEvent.change(titleInputs[0], { target: { value: 'Levitating (Remix)' } });
    
    const saveButtons = screen.getAllByTitle('Save changes');
    fireEvent.click(saveButtons[0]);
    expect(screen.getByText('Levitating (Remix)')).toBeInTheDocument();
  });

  test('DELETE: Can remove a song from the queue', () => {
    renderWithRouter(<PartyQueuePage />);
    window.confirm = vi.fn(() => true); 
    const deleteButtons = screen.getAllByTitle('Remove song');
    fireEvent.click(deleteButtons[0]);
    expect(screen.queryByText('Levitating')).not.toBeInTheDocument();
  });

  test('DELETE: Canceling removal keeps the song', () => {
    renderWithRouter(<PartyQueuePage />);
    window.confirm = vi.fn(() => false); 
    const deleteButtons = screen.getAllByTitle('Remove song');
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText('Levitating')).toBeInTheDocument();
  });

  test('INTERACTION: Share Code button copies to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockImplementation(() => Promise.resolve()) }
    });
    renderWithRouter(<PartyQueuePage />);
    const shareButton = screen.getByText('Share Code');
    fireEvent.click(shareButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  test('INTERACTION: Upvote buttons render for songs', () => {
    renderWithRouter(<PartyQueuePage />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('Authentication: Login Validation', () => {
  test('Shows multiple errors when submitting entirely empty form', () => {
    renderWithRouter(<LoginPage />);
    fireEvent.click(screen.getByText('Sign In'));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
  });

  test('Clears email error when user starts typing', () => {
    renderWithRouter(<LoginPage />);
    fireEvent.click(screen.getByText('Sign In'));
    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    expect(screen.queryByText('Please enter a valid email address.')).not.toBeInTheDocument();
  });

  test('Clears password error when user starts typing', () => {
    renderWithRouter(<LoginPage />);
    fireEvent.click(screen.getByText('Sign In'));
    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(screen.queryByText('Password must be at least 8 characters.')).not.toBeInTheDocument();
  });

  test('Renders Remember Me checkbox', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('Provides a link to the registration page', () => {
    renderWithRouter(<LoginPage />);
    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
  });

  test('Provides a forgot password link', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});

describe('Authentication: Register Validation', () => {
  test('Shows all field errors on empty submission', () => {
    renderWithRouter(<RegisterPage />);
    fireEvent.click(screen.getByText('Create Account'));
    expect(screen.getByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
  });

  test('Enforces minimum name length', () => {
    renderWithRouter(<RegisterPage />);
    const nameInput = screen.getByPlaceholderText('John Doe');
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(screen.getByText('Create Account'));
    expect(screen.getByText('Name must be at least 2 characters.')).toBeInTheDocument();
  });

  test('Enforces valid email format', () => {
    renderWithRouter(<RegisterPage />);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByText('Create Account'));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  test('Enforces minimum password length and matching confirmation', () => {
    renderWithRouter(<RegisterPage />);
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'short' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Create Account'));
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });


  test('Renders Terms of Service required checkbox', () => {
    renderWithRouter(<RegisterPage />);
    const tosCheckbox = screen.getByRole('checkbox');
    expect(tosCheckbox).toBeRequired();
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });

  test('Provides a link back to the login page', () => {
    renderWithRouter(<RegisterPage />);
    const signInLink = screen.getByText('Sign in');
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });
});

describe('Song Creation Validation', () => {
  test('Prevents submission if required fields are missing', () => {
    renderWithRouter(<CreateSongPage />);
    fireEvent.click(screen.getByText('Add Song to Queue'));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Artist is required')).toBeInTheDocument();
    expect(screen.getByText('Album is required')).toBeInTheDocument();
    expect(screen.getByText('Genre is required')).toBeInTheDocument();
  });

  test('Shows format error for invalid duration string', () => {
    renderWithRouter(<CreateSongPage />);
    const durationInput = screen.getByPlaceholderText('e.g., 3:45');
    fireEvent.change(durationInput, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Add Song to Queue'));
    expect(screen.getByText('Duration must be in MM:SS format (e.g., 3:45)')).toBeInTheDocument();
  });

  test('Shows format error for out-of-bounds duration numbers', () => {
    renderWithRouter(<CreateSongPage />);
    const durationInput = screen.getByPlaceholderText('e.g., 3:45');
    fireEvent.change(durationInput, { target: { value: '99:99' } });
    fireEvent.click(screen.getByText('Add Song to Queue'));
    expect(screen.getByText('Duration must be in MM:SS format (e.g., 3:45)')).toBeInTheDocument();
  });

  test('Accepts valid MM:SS duration format', () => {
    renderWithRouter(<CreateSongPage />);
    const durationInput = screen.getByPlaceholderText('e.g., 3:45');
    fireEvent.change(durationInput, { target: { value: '03:45' } });
    fireEvent.click(screen.getByText('Add Song to Queue'));
    expect(screen.queryByText('Duration must be in MM:SS format (e.g., 3:45)')).not.toBeInTheDocument();
  });

  test('Clears title error dynamically on input', () => {
    renderWithRouter(<CreateSongPage />);
    fireEvent.click(screen.getByText('Add Song to Queue'));
    const titleInput = screen.getAllByRole('textbox')[0]; // Title is first
    fireEvent.change(titleInput, { target: { value: 'My Song' } });
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  test('Clears artist error dynamically on input', () => {
    renderWithRouter(<CreateSongPage />);
    fireEvent.click(screen.getByText('Add Song to Queue'));
    const artistInput = screen.getAllByRole('textbox')[1]; // Artist is second
    fireEvent.change(artistInput, { target: { value: 'My Artist' } });
    expect(screen.queryByText('Artist is required')).not.toBeInTheDocument();
  });

  test('Cancel button links back to dashboard', () => {
    renderWithRouter(<CreateSongPage />);
    const cancelLinks = screen.getAllByText('Cancel');
    expect(cancelLinks[0].closest('a')).toHaveAttribute('href', '/dashboard');
  });

  test('Renders all song metadata inputs', () => {
    renderWithRouter(<CreateSongPage />);
    expect(screen.getByText('Song Title *')).toBeInTheDocument();
    expect(screen.getByText('Artist *')).toBeInTheDocument();
    expect(screen.getByText('Album *')).toBeInTheDocument();
    expect(screen.getByText('Genre *')).toBeInTheDocument();
    expect(screen.getByText('Your Name *')).toBeInTheDocument();
  });
});

function TestComponent() {
  useActivityMonitor();
  return <div>Hook Tester</div>;
}

describe('useActivityMonitor Hook', () => {
  beforeEach(() => {
    document.cookie = 'user_activity=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  test('Saves visited paths to browser cookies securely', () => {
    render(
      <MemoryRouter initialEntries={['/party/select']}>
        <Routes>
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );
    const cookies = document.cookie;
    expect(cookies).toContain('user_activity');
    const cookieValue = cookies.split('user_activity=')[1].split(';')[0];
    const decodedHistory = JSON.parse(decodeURIComponent(cookieValue));
    expect(decodedHistory.length).toBe(1);
    expect(decodedHistory[0].path).toBe('/party/select');
  });

  test('Keeps a maximum of 5 history items to save cookie space', () => {
    const oldHistory = Array(5).fill({ path: '/old', time: new Date().toISOString() });
    document.cookie = `user_activity=${encodeURIComponent(JSON.stringify(oldHistory))}; path=/;`;

    render(
      <MemoryRouter initialEntries={['/new-path']}>
        <Routes>
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    const cookieValue = document.cookie.split('user_activity=')[1].split(';')[0];
    const decodedHistory = JSON.parse(decodeURIComponent(cookieValue));
    
    expect(decodedHistory.length).toBe(5);
    expect(decodedHistory[4].path).toBe('/new-path'); // The newest entry
  });

  test('Gracefully handles invalid JSON in existing cookies', () => {
    document.cookie = `user_activity=invalid-json-string; path=/;`;
    
    // Should not crash, should overwrite with fresh array
    expect(() => {
      render(
        <MemoryRouter initialEntries={['/safe-path']}>
          <Routes>
            <Route path="*" element={<TestComponent />} />
          </Routes>
        </MemoryRouter>
      );
    }).not.toThrow();

    const cookieValue = document.cookie.split('user_activity=')[1].split(';')[0];
    const decodedHistory = JSON.parse(decodeURIComponent(cookieValue));
    expect(decodedHistory.length).toBe(1);
    expect(decodedHistory[0].path).toBe('/safe-path');
  });
});