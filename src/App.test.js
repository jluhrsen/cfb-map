import { render, screen } from '@testing-library/react';
import App from './App';

test('renders college football map', () => {
  render(<App />);
  const headingElement = screen.getByText(/college football map/i);
  expect(headingElement).toBeInTheDocument();
});
