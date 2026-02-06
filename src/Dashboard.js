import React, { useState, useMemo } from 'react';
import RailwayDigitalTwin from './RailwayDigitalTwin';
import StationLayout from './StationLayout';

const Dashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [showChart, setShowChart] = useState(false);
    const [livePositions, setLivePositions] = useState({});
    const [showPredictiveDrawer, setShowPredictiveDrawer] = useState(false);

    const { stations, tracks, trains } = useMemo(() => {
        const stationData = [
            { id: 'A', name: 'Central Station', x: 200, y: 300, type: 'major', platforms: 8 },
            { id: 'B', name: 'North Junction', x: 400, y: 150, type: 'junction', platforms: 4 },
            { id: 'C', name: 'East Terminal', x: 700, y: 200, type: 'terminal', platforms: 6 },
            { id: 'D', name: 'South Hub', x: 350, y: 500, type: 'major', platforms: 10 },
            { id: 'E', name: 'West Depot', x: 100, y: 400, type: 'depot', platforms: 3 },
            { id: 'F', name: 'Express Junction', x: 600, y: 350, type: 'junction', platforms: 4 },
            { id: 'G', name: 'Suburban End', x: 800, y: 450, type: 'terminal', platforms: 2 },
            { id: 'H', name: 'Industrial Yard', x: 150, y: 200, type: 'yard', platforms: 6 },
            { id: 'I', name: 'Metro Link', x: 500, y: 600, type: 'interchange', platforms: 8 },
            { id: 'J', name: 'Airport Express', x: 900, y: 300, type: 'terminal', platforms: 4 }
        ];
        const trackData = [
            { id: 'T1', from: 'A', to: 'B', type: 'main', status: 'active', length: 25 }, { id: 'T2', from: 'B', to: 'C', type: 'main', status: 'maintenance', length: 35 }, { id: 'T3', from: 'A', to: 'D', type: 'main', status: 'active', length: 30 }, { id: 'T4', from: 'A', to: 'E', type: 'secondary', status: 'active', length: 15 }, { id: 'T5', from: 'D', to: 'F', type: 'main', status: 'active', length: 28 }, { id: 'T6', from: 'F', to: 'C', type: 'secondary', status: 'congested', length: 20 }, { id: 'T7', from: 'F', to: 'G', type: 'main', status: 'active', length: 22 }, { id: 'T8', from: 'B', to: 'F', type: 'bypass', status: 'active', length: 32 }, { id: 'T9', from: 'E', to: 'D', type: 'secondary', status: 'active', length: 18 }, { id: 'T10', from: 'A', to: 'H', type: 'freight', status: 'active', length: 12 }, { id: 'T11', from: 'H', to: 'B', type: 'freight', status: 'congested', length: 20 }, { id: 'T12', from: 'D', to: 'I', type: 'metro', status: 'active', length: 18 }, { id: 'T13', from: 'I', to: 'F', type: 'metro', status: 'active', length: 15 }, { id: 'T14', from: 'C', to: 'J', type: 'express', status: 'active', length: 25 }, { id: 'T15', from: 'F', to: 'J', type: 'express', status: 'maintenance', length: 30 }
        ];
        const trainData = [
            { id: 'TR001', name: 'Express Alpha', track: 'T1', position: 0.4, speed: 85, status: 'on_time', passengers: 450, delay: 0, delayReason: null, priority: 3 },
            { id: 'TR002', name: 'Local Beta', track: 'T3', position: 0.4, speed: 45, status: 'delayed', passengers: 180, delay: 15, delayReason: 'Signal failure at km 18.5', priority: 2 },
            { id: 'TR003', name: 'Freight Gamma', track: 'T5', position: 0.5, speed: 35, status: 'priority_hold', passengers: 0, delay: 30, delayReason: 'Awaiting clearance for express train', priority: 1 },
            { id: 'TR004', name: 'Metro Express', track: 'T12', position: 0.3, speed: 70, status: 'delayed', passengers: 320, delay: 8, delayReason: 'Platform congestion at South Hub', priority: 2 },
            { id: 'TR005', name: 'Airport Link', track: 'T14', position: 0.3, speed: 95, status: 'on_time', passengers: 150, destination: 'J', delay: 0, delayReason: null }
        ];
        return { stations: stationData, tracks: trackData, trains: trainData };
    }, []);

    const liveTrains = useMemo(() => {
        return trains.map(train => ({
            ...train,
            position: livePositions[train.id] ?? train.position,
        }));
    }, [trains, livePositions]);

    const handleNewAlert = (newAlert) => {
    setAlerts((prevAlerts) => {
        // Find if an alert for this TRAIN already exists
        const existingAlertIndex = prevAlerts.findIndex(a => a.trainId === newAlert.trainId);

        // If it exists, replace it with the new (potentially more critical) one
        if (existingAlertIndex !== -1) {
            const updatedAlerts = [...prevAlerts];
            updatedAlerts[existingAlertIndex] = newAlert;
            return updatedAlerts;
        }
        
        // Otherwise, add the new alert
        return [...prevAlerts, newAlert];
    });
};

    const handleAlertClick = (alert) => {
        if (decisions.find((d) => d.trainId === alert.trainId)) return;
        setDecisions((prev) => [
            {
                trainId: alert.trainId,
                trainName: alert.trainName,
                suggestions: alert.suggestions || [],
                factors: alert.factors || {},
                status: 'pending',
                score: alert.score,
                showOverride: false,
                showBreakdown: false,
            },
            ...prev
        ]);
    };

    const handleAccept = (trainId) => {
        setDecisions((prev) => prev.map((d) => (d.trainId === trainId ? { ...d, status: 'accepted' } : d)));
        setAlerts((prev) => prev.filter((a) => a.trainId !== trainId));
    };

    const handleOverride = (trainId, controllerDecision, reasoning) => {
        setDecisions((prev) => prev.map((d) => (d.trainId === trainId ? { ...d, status: 'overridden', overridden: { decision: controllerDecision, reason: reasoning }, showOverride: false } : d)));
        setAlerts((prev) => prev.filter((a) => a.trainId !== trainId));
    };

    return (
        <div className="dashboard-root">
            <div className="container">
                <div className="header">
                    <div className="header-left">
                        <button className="btn-predictive" onClick={() => setShowPredictiveDrawer(true)}>
                            🌊 Predictive Analysis
                        </button>
                    </div>
                    <div className="header-center">
                        <h1>🚂 RATH</h1>
                        <h2>Railway Adaptive Traffic Handling</h2>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-chart" onClick={() => setShowChart(true)}>
                            📊 Master Chart
                        </button>
                    </div>
                </div>

                <div className="main-grid">
                    <div className="grid-item info-container">
                        <h2 className="section-title">System Overview</h2>
                        <div className="overview-grid">
                            <div className="stat-card"><div className="stat-number">15</div><div className="stat-label">Active Routes</div></div>
                            <div className="stat-card"><div className="stat-number">3,547</div><div className="stat-label">Passengers</div></div>
                            <div className="stat-card"><div className="stat-number">98.2%</div><div className="stat-label">On-Time</div></div>
                            <div className="stat-card"><div className="stat-number">3</div><div className="stat-label">Issues</div></div>
                        </div>
                        <StationLayout trains={liveTrains} stations={stations} tracks={tracks} />
                    </div>

                    <div className="grid-item digital-twin-container">
                        {/* ✅ FIX: Interchanged the elements in the top bar */}
                        <div className="dt-topbar">
                            <span className="dt-station-title">Display Chart for MAS Station</span>
                            <div className="dt-live-feed-group">
                                <span className="dt-live-dot"></span>
                                <strong>Live Feed</strong>
                                <span>Active Trains: <b>{trains.length}</b></span>
                                <span>Network Load: <b>68%</b></span>
                                <span>Avg Delay: <b>+1.6 min</b></span>
                            </div>
                        </div>
                        <RailwayDigitalTwin
                            onNewAlert={handleNewAlert}
                            initialData={{ trains, stations, tracks }}
                            livePositions={livePositions}
                            setLivePositions={setLivePositions}
                        />
                    </div>

                    <div className="grid-item alerts-container">
                        <h2 className="section-title">Actionable Alerts</h2>
                        <ul className="alert-list">
                            {alerts.length === 0 && <p>No active alerts ✅</p>}
                            {alerts.map((a) => (
                                <li key={a.id} className="alert-item" onClick={() => handleAlertClick(a)}>
                                    <div className="alert-header"><span>🚨 {a.trainName} ({a.trainId})</span><span>{a.issue}</span></div>
                                    <small>{a.details}</small>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid-item rerouting-container">
                        <h2 className="section-title">Rerouting Decisions</h2>
                        {decisions.length === 0 && <p style={{ color: "#6c757d" }}>⬅️ Click an alert to view rerouting suggestion</p>}
                        {decisions.map((d) => (
                            <div key={d.trainId} className="decision-card">
                                <div className="decision-header">
                                    <div><div className="decision-title">Suggestion for {d.trainName}</div><div className="decision-sub"><span className="log-pill">Reroute: {d.suggestions[0]?.route || 'N/A'}</span></div></div>
                                    <div className="score-pill">Score: {d.score}</div>
                                </div>
                                <div id="algorithm-insights">
                                    <h4>Priority Score Decomposition</h4>
                        
                                    <button
                                        onClick={() =>
                                            setDecisions(prev =>
                                                prev.map(x =>
                                                    x.trainId === d.trainId
                                                        ? { ...x, showBreakdown: !x.showBreakdown }
                                                        : x
                                                )
                                            )
                                        }
                                        className="btn ghost"
                                        style={{ marginTop: "10px", marginBottom: "10px" }}
                                    >
                                        {d.showBreakdown ? "Hide Breakdown ▲" : "Show Breakdown ▼"}
                                    </button>
                                    <div style={{ maxHeight: d.showBreakdown ? "500px" : "0", overflow: "hidden", transition: "max-height 0.4s ease-in-out" }}>
                                        <ul className="insight-list">
                                            {Object.entries(d.factors || {}).map(([label, value], i) => {
                                                const percentage = (value * 100).toFixed(0);
                                                const sign = ["Throughput", "Aging", "TrainPriority"].includes(label) ? "+" : "-";
                                                const impactType = sign === "+" ? "positive" : "negative";
                                                return (
                                                    <li key={i} className="insight-item">
                                                        <div className="label">
                                                            {label}: {sign}{percentage}% Impact
                                                        </div>
                                                        <div className="progress-bar">
                                                            <div className={`progress-bar-inner ${impactType}`} style={{ width: `${percentage}%` }}/>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                                {d.status === "pending" && (
                                    <>
                                        <div className="actions">
                                            <button className="btn accept" onClick={() => handleAccept(d.trainId)}>Accept ✅</button>
                                            <button className="btn override" onClick={() => setDecisions((prev) => prev.map((x) => x.trainId === d.trainId ? { ...x, showOverride: !x.showOverride } : x))}>Override ✏️</button>
                                            <span className="status-badge">Pending</span>
                                        </div>
                                        {d.showOverride && (
                                            <form className="override-form" onSubmit={(e) => { e.preventDefault(); const decision = e.target.controller_decision.value; const reason = e.target.reasoning.value; handleOverride(d.trainId, decision, reason); }}>
                                                <div className="form-row"><label>Controller’s Decision</label><input type="text" name="controller_decision" placeholder="e.g., Hold at next station (5 min)" required /></div>
                                                <div className="form-row"><label>Reasoning</label><textarea name="reasoning" rows="2" placeholder="Why override? Crew availability, etc." required /></div>
                                                <div className="form-actions"><button type="submit" className="btn save">Save Override</button><button type="button" className="btn ghost" onClick={() => setDecisions((prev) => prev.map((x) => x.trainId === d.trainId ? { ...x, showOverride: false } : x))}>Cancel</button></div>
                                            </form>
                                        )}
                                    </>
                                )}
                                {d.status === "accepted" && (<div className="final-record"><div>✅ Accepted: {d.suggestions[0]?.route}</div><div>Decision Time: {new Date().toLocaleString()}</div></div>)}
                                {d.status === "overridden" && (<div className="final-record"><div>❌ Overridden Decision: <b>{d.overridden.decision}</b></div><div>Reason: {d.overridden.reason}</div><div>Decision Time: {new Date().toLocaleString()}</div><div style={{ color: "#f97316", marginTop: "8px", fontWeight: "600" }}>⚠️ Controller Override: Decision Notes saved. Priority Score Re-assigned.</div></div>)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`predictive-drawer ${showPredictiveDrawer ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
    <button className="predictive-drawer-close" onClick={() => setShowPredictiveDrawer(false)}>&times;</button>
    <h3>External Event Prediction</h3>
    <div className="predictive-flowchart">
        
        {/* ✅ FIX: Added new class for styling */}
        <div className="flow-node flow-node--trigger">
            <div className="label">Event Trigger</div>
            <div className="value">Adyar Dam Release</div>
            <small>(in 30 mins)</small>
        </div>

        <div className="flow-arrow">↓</div>

        {/* ✅ FIX: Added new class for styling */}
        <div className="flow-node flow-node--state">
            <div className="label">Current State</div>
            <div className="value">85.4m Water Level</div>
            <small>(Stable)</small>
        </div>

        <div className="flow-arrow">↓</div>
        
        {/* ✅ FIX: Added new class for styling */}
        <div className="flow-node flow-node--prediction">
            <div className="label">Prediction</div>
            <div className="value">Danger Level @ 12:45</div>
            <small>(High Confidence)</small>
        </div>

    </div>
</div>

                {showChart && (
                    <div id="chart-modal-overlay" className="flex">
                        <div id="chart-modal-content"><button id="chart-modal-close" onClick={() => setShowChart(false)}>&times;</button><div className="chart-container"><div className="chart-box"><h3 className="chart-title">📑 Manual Master-Chart</h3><img src="/images/master1.jpeg" alt="Manual Master Chart" /></div><div className="chart-box"><h3 className="chart-title">🤖 System Generated Master-Chart</h3><img src="/images/master2.jpeg" alt="System Generated Master Chart" /></div></div></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;