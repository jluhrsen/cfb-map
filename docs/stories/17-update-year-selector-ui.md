# Story 17: Update Year Selector UI for Multi-Year

## Description

Enhance the year selector dropdown in the UI to dynamically show all available seasons by fetching `public/data/index.json` instead of hardcoding year options.

## Current Behavior

Year selector likely hardcoded to show 2025 only (or fixed list).

## Target Behavior

- Fetch `public/data/index.json` on app load
- Populate dropdown with all availableYears from index
- Show years in descending order (newest first: 2027, 2026, 2025, 2024...)
- Default to smart season (Story 16)
- Persist user's selection in localStorage

## Acceptance Criteria

- [ ] App fetches public/data/index.json on mount
- [ ] Year selector dropdown populated from index.availableYears
- [ ] Years displayed in descending order
- [ ] Dropdown shows all available years (2024, 2025, 2026, 2027...)
- [ ] Default selection uses getCurrentFootballSeason()
- [ ] User selection persists in localStorage
- [ ] If selected year not available, fall back to most recent year
- [ ] Loading state while fetching index.json
- [ ] Changes committed to git

## Implementation Notes

Where to add this logic:
- Probably in FilterContext.js (already manages selectedYear)
- Or in App.js if it needs to be higher level

Fetch index:
```javascript
const [availableYears, setAvailableYears] = useState([]);

useEffect(() => {
  async function loadAvailableYears() {
    try {
      const response = await fetch('/data/index.json');
      const index = await response.json();
      setAvailableYears(index.availableYears.sort((a, b) => b - a));
    } catch (err) {
      console.error('Failed to load available years', err);
      setAvailableYears([2025]); // fallback
    }
  }
  loadAvailableYears();
}, []);
```

Dropdown component:
```jsx
<select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
  {availableYears.map(year => (
    <option key={year} value={year}>{year}</option>
  ))}
</select>
```

## Dependencies

- Story 04 (needs index.json to exist)
- Story 16 (uses getCurrentFootballSeason for default)

## Estimated Effort

Medium (2-3 hours)
