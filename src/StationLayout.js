import React, { useState, useEffect } from 'react';

// Helper function for distance (optional use if needed again)


const StationLayout = ({ trains, stations, tracks }) => {
  const [trackOccupancy, setTrackOccupancy] = useState([]);
  const [gpsData, setGpsData] = useState([]);

  useEffect(() => {
    // --- Assign trains to their "current track" ---
    const layout = tracks.map((track, idx) => {
      const currentTrain = trains.find(t => t.track === track.id);
      return {
        id: idx + 1, // UI track index
        trackId: track.id,
        train: currentTrain || null,
      };
    });

    setTrackOccupancy(layout);

    // --- Generate "simulated GPS" based on position ---
    const simGPS = trains.map((train, idx) => {
      const track = tracks.find(t => t.id === train.track);
      if (!track) return null;

      const from = stations.find(s => s.id === track.from);
      const to = stations.find(s => s.id === track.to);
      if (!from || !to) return null;

      // crude linear interp
      const posX = from.x + (to.x - from.x) * train.position;
      const posY = from.y + (to.y - from.y) * train.position;

      return {
        id: idx,
        train: `${train.id} - ${train.name}`,
        type: train.passengers > 0 ? "Passenger" : "Freight",
        gps: `(${posX.toFixed(6)}, ${posY.toFixed(6)})`,
      };
    }).filter(Boolean);

    setGpsData(simGPS);
  }, [trains, stations, tracks]);

  return (
    <div className="station-layout-container">
      <h3 className="section-title">Station Layout</h3>

      {/* === Tracks Occupied === */}
      <h4 style={{ margin: "10px 0", fontWeight: "bold", fontSize: "1.1rem" }}>📍 Tracks Occupied</h4>
      <div className="track-list">
  {/* Occupied Tracks */}
  {trackOccupancy.filter(t => t.train).map((track) => (
    <div
      key={track.id}
      className="track-item occupied"
    >
      <span className="track-name">Track {track.id}:</span>
      <span className="track-status">
        {`${track.train.id} - ${track.train.name} (${track.train.passengers > 0 ? "Passenger" : "Freight"})`}
      </span>
    </div>
  ))}

  {/* Collapsed Empty Tracks in ONE row */}
  {trackOccupancy.some(t => !t.train) && (
    <div className="track-item empty">
      <span className="track-name">Empty Tracks:</span>
      <span className="track-status">
        {trackOccupancy
          .filter(t => !t.train)
          .map(t => t.id)
          .join(", ")}
      </span>
    </div>
  )}
</div>

      {/* === GPS Data === */}
      <h4 style={{ marginTop: "20px", fontWeight: "bold", fontSize: "1.1rem" }}>
        Simulated Train GPS Data
      </h4>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Train</th>
            <th style={{ padding: "8px" }}>Type</th>
            <th style={{ padding: "8px" }}>GPS (x, y)</th>
          </tr>
        </thead>
        <tbody>
          {gpsData.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px" }}>{entry.train}</td>
              <td style={{ padding: "8px" }}>{entry.type}</td>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>{entry.gps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StationLayout;