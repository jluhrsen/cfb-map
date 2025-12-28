import React, { useState } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';
import './TeamSelector.css';

function TeamSelector() {
  const { selectedTeams, addTeam, removeTeam } = useFilters();
  const { index } = useGameData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  if (!index) return null;

  const filteredTeams = index.teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTeams.includes(team.name)
  );

  const handleAddTeam = (teamName) => {
    addTeam(teamName);
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div className="team-selector">
      <div className="selected-teams">
        {selectedTeams.map(teamName => (
          <div key={teamName} className="team-chip">
            <span>{teamName}</span>
            <button
              onClick={() => removeTeam(teamName)}
              className="remove-btn"
              aria-label={`Remove ${teamName}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search to add teams..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="search-input"
        />

        {showDropdown && searchTerm && (
          <div className="search-dropdown">
            {filteredTeams.length > 0 ? (
              filteredTeams.slice(0, 10).map(team => (
                <div
                  key={team.name}
                  className="search-result"
                  onClick={() => handleAddTeam(team.name)}
                >
                  {team.logo && (
                    <img src={team.logo} alt="" className="team-logo-small" />
                  )}
                  <span>{team.name}</span>
                  <span className="team-division">{team.division.toUpperCase()}</span>
                </div>
              ))
            ) : (
              <div className="no-results">No teams found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamSelector;
