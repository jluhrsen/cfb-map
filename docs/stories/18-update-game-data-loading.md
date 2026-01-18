# Story 18: Update GameDataContext for Multi-Year Loading

## Description

Update `src/contexts/GameDataContext.js` to load game data for the selected year dynamically instead of hardcoding paths to 2025 data.

## Current Behavior

Likely hardcoded to fetch from `/data/2025/{division}/week-{week}.json`

## Target Behavior

Fetch from `/data/{selectedYear}/{division}/week-{week}.json` where selectedYear comes from FilterContext.

## Acceptance Criteria

- [ ] GameDataContext receives selectedYear from FilterContext
- [ ] Fetches game data using selectedYear in path
- [ ] Path: `public/data/{year}/{division}/week-{week}.json`
- [ ] Handles missing files gracefully (future weeks, future years)
- [ ] Shows loading state while fetching
- [ ] Shows error state if fetch fails
- [ ] Re-fetches when selectedYear changes
- [ ] Changes committed to git

## Implementation Notes

GameDataContext should consume FilterContext:
```javascript
import { useFilter } from './FilterContext';

export function GameDataProvider({ children }) {
  const { selectedYear, selectedDivision, selectedWeek } = useFilter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        const path = `/data/${selectedYear}/${selectedDivision}/week-${selectedWeek}.json`;
        const response = await fetch(path);
        if (!response.ok) {
          // File doesn't exist (future week/year)
          setGames([]);
          return;
        }
        const data = await response.json();
        setGames(data);
      } catch (err) {
        console.error('Failed to load games', err);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [selectedYear, selectedDivision, selectedWeek]);

  // ...
}
```

## Dependencies

- Story 16 (FilterContext provides selectedYear)

## Estimated Effort

Medium (2-3 hours)
