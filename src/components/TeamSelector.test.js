import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamSelector from './TeamSelector';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';

jest.mock('../contexts/FilterContext', () => ({ useFilters: jest.fn() }));
jest.mock('../contexts/GameDataContext', () => ({ useGameData: jest.fn() }));

test('a team can be selected with the keyboard', () => {
  const addTeam = jest.fn();
  useFilters.mockReturnValue({ selectedTeams: [], addTeam, removeTeam: jest.fn() });
  useGameData.mockReturnValue({
    index: { teams: [{ name: 'Alabama', division: 'fbs' }] }
  });

  render(<TeamSelector />);
  fireEvent.focus(screen.getByPlaceholderText('Search or browse teams...'));
  const result = screen.getByRole('button', { name: /Alabama/ });
  result.focus();
  userEvent.keyboard('{Enter}');

  expect(addTeam).toHaveBeenCalledWith('Alabama');
});
