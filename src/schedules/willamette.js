import { LOGOS } from '../data/logos';

const WILLAMETTE_LOGO = LOGOS["Willamette"];
const POMONA_PITZER_LOGO = LOGOS["Pomona-Pitzer"];
const PACIFIC_LOGO = LOGOS["Pacific"];
const LAVERNE_LOGO = LOGOS["La Verne"];
const PACIFIC_LUTHERAN_LOGO = LOGOS["Pacific Lutheran"];
const LEWIS_CLARK_LOGO = LOGOS["Lewis & Clark"];
const PUGET_SOUND_LOGO = LOGOS["Puget Sound"];
const GEORGE_FOX_LOGO = LOGOS["George Fox"];
const WHITWORTH_LOGO = LOGOS["Whitworth"];
const LINFIELD_LOGO = LOGOS["Linfield"];

export const Willamette_GAMES = [
    {
        week: 1,
        date: "2025-09-06",
        day: "Saturday",
        kickoff: "13:00",
        home: "Willamette",
        away: "Pomona-Pitzer",
        homeLogo: WILLAMETTE_LOGO,
        awayLogo: POMONA_PITZER_LOGO,
        location: { lat: 44.9384, lng: -123.0438, venue: "McCulloch Stadium" }
    },
    {
        week: 2,
        date: "2025-09-13",
        day: "Saturday",
        kickoff: "13:00",
        home: "Willamette",
        away: "Pacific",
        homeLogo: WILLAMETTE_LOGO,
        awayLogo: PACIFIC_LOGO,
        location: { lat: 44.9384, lng: -123.0438, venue: "McCulloch Stadium" }
    },
    {
        week: 3,
        date: "2025-09-20",
        day: "Saturday",
        kickoff: "13:00",
        home: "La Verne",
        away: "Willamette",
        homeLogo: LAVERNE_LOGO,
        awayLogo: WILLAMETTE_LOGO,
        location: { lat: 34.1006, lng: -117.7678, venue: "Ortmayer Stadium" }
    },
    {
        week: 5,
        date: "2025-10-04",
        day: "Saturday",
        kickoff: "13:00",
        home: "Pacific Lutheran",
        away: "Willamette",
        homeLogo: PACIFIC_LUTHERAN_LOGO,
        awayLogo: WILLAMETTE_LOGO,
        location: { lat: 47.1880, lng: -122.2923, venue: "Sparks Stadium" }
    },
    {
        week: 6,
        date: "2025-10-11",
        day: "Saturday",
        kickoff: "13:00",
        home: "Willamette",
        away: "Lewis & Clark",
        homeLogo: WILLAMETTE_LOGO,
        awayLogo: LEWIS_CLARK_LOGO,
        location: { lat: 44.9384, lng: -123.0438, venue: "McCulloch Stadium" }
    },
    {
        week: 7,
        date: "2025-10-18",
        day: "Saturday",
        kickoff: "13:00",
        home: "Puget Sound",
        away: "Willamette",
        homeLogo: PUGET_SOUND_LOGO,
        awayLogo: WILLAMETTE_LOGO,
        location: { lat: 47.2618, lng: -122.4817, venue: "Baker Stadium" }
    },
    {
        week: 8,
        date: "2025-10-25",
        day: "Saturday",
        kickoff: "13:00",
        home: "Pacific",
        away: "Willamette",
        homeLogo: PACIFIC_LOGO,
        awayLogo: WILLAMETTE_LOGO,
        location: { lat: 45.5207, lng: -123.1103, venue: "Hanson Stadium" }
    },
    {
        week: 9,
        date: "2025-11-01",
        day: "Saturday",
        kickoff: "13:00",
        home: "Willamette",
        away: "George Fox",
        homeLogo: WILLAMETTE_LOGO,
        awayLogo: GEORGE_FOX_LOGO,
        location: { lat: 44.9384, lng: -123.0438, venue: "McCulloch Stadium" }
    },
    {
        week: 10,
        date: "2025-11-08",
        day: "Saturday",
        kickoff: "13:00",
        home: "Willamette",
        away: "Whitworth",
        homeLogo: WILLAMETTE_LOGO,
        awayLogo: WHITWORTH_LOGO,
        location: { lat: 44.9384, lng: -123.0438, venue: "McCulloch Stadium" }
    },
    {
        week: 11,
        date: "2025-11-15",
        day: "Saturday",
        kickoff: "13:00",
        home: "Linfield",
        away: "Willamette",
        homeLogo: LINFIELD_LOGO,
        awayLogo: WILLAMETTE_LOGO,
        location: { lat: 45.1940, lng: -123.1360, venue: "Maxwell Field" }
    }
];
