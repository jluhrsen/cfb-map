import { render, waitFor } from '@testing-library/react';
import App from './App';
import { useFilters } from './contexts/FilterContext';
import { useGameData } from './contexts/GameDataContext';

const mockFitBounds = jest.fn();

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  useMap: () => ({ fitBounds: mockFitBounds })
}));
jest.mock('./contexts/FilterContext', () => ({ useFilters: jest.fn() }));
jest.mock('./contexts/GameDataContext', () => ({ useGameData: jest.fn() }));

const index = {
  availableSeasons: [2026],
  divisions: ['fbs', 'nfl'],
  weeksByYear: {
    2026: [
      { number: 1, startDate: '2026-08-28' },
      { number: 2, startDate: '2026-09-04' }
    ]
  },
  teams: []
};

const game = (id, date, division) => ({
  id, date, division, home: 'Alabama', away: 'Opponent',
  day: 'Saturday', kickoff: '1p',
  venue: { name: 'Stadium', lat: 33.2, lng: -87.5 }
});

beforeEach(() => {
  jest.clearAllMocks();
  useFilters.mockReturnValue({
    selectedTeams: ['Alabama'], selectedDivisions: ['fbs'],
    selectedWeek: 1, selectedYear: 2026,
    setSelectedWeek: jest.fn(), setSelectedYear: jest.fn()
  });
});

test('moves the map to the selected games', async () => {
  useGameData.mockReturnValue({
    index, loading: false,
    loadWeekData: jest.fn(async (year, week, divisions) =>
      week === 1 && divisions.includes('fbs') ? [game('fbs-1', '2026-08-29', 'fbs')] : [])
  });

  render(<App />);

  await waitFor(() => expect(mockFitBounds).toHaveBeenCalledWith(
    [[33.2, -87.5]], expect.objectContaining({ maxZoom: expect.any(Number) })
  ));
});

test('auto location searches only visible leagues', async () => {
  const setSelectedWeek = jest.fn();
  useFilters.mockReturnValue({
    ...useFilters(), setSelectedWeek
  });
  const loadWeekData = jest.fn(async (year, week, divisions) => {
    if (divisions.includes('nfl') && week === 1) return [game('nfl-1', '2026-08-29', 'nfl')];
    if (divisions.includes('fbs') && week === 2) return [game('fbs-2', '2026-09-05', 'fbs')];
    return [];
  });
  useGameData.mockReturnValue({ index, loading: false, loadWeekData });

  render(<App />);

  await waitFor(() => expect(setSelectedWeek).toHaveBeenCalledWith(2));
  expect(loadWeekData.mock.calls.every(([, , divisions]) => !divisions.includes('nfl'))).toBe(true);
});
