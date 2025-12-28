import { render, screen } from '@testing-library/react';
import App from './App';
import { GameDataProvider } from './contexts/GameDataContext';
import { FilterProvider } from './contexts/FilterContext';

test('renders college football map', () => {
  render(
    <GameDataProvider>
      <FilterProvider>
        <App />
      </FilterProvider>
    </GameDataProvider>
  );
  const headingElement = screen.getByText(/football game map/i);
  expect(headingElement).toBeInTheDocument();
});
