import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          window.location.href = '/';
        }
      }, 300000); 
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  return <RouterProvider router={router} />;
}