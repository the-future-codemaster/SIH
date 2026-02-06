import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, AlertTriangle, CloudRain, Train, Zap } from 'lucide-react';

const RailwayDigitalTwin = ({ onNewAlert, initialData, livePositions, setLivePositions }) => {
    const { stations, tracks, trains } = initialData;
    const [zoom, setZoom] = useState(1);
    const [pan] = useState({ x: 0, y: 0 });
    const [hoveredTrain, setHoveredTrain] = useState(null);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [showAIRecommendations, setShowAIRecommendations] = useState(false);
    const [conflictAlert, setConflictAlert] = useState(null);
    const [trainStates, setTrainStates] = useState({});
    const [weatherAlert] = useState({
        type: 'fog',
        severity: 'high',
        location: 'Junction B-C',
        visibility: '50m',
        impact: 'Speed reduction to 20 km/h'
    });

    const generatePriorityData = () => {
        const factors = {
            Throughput: Math.random(),
            DelayCascadeRisk: Math.random(),
            ConflictRisk: Math.random(),
            EnergyCost: Math.random(),
            Aging: Math.random(),
            TrainPriority: Math.random(),
        };
        const score = (0.80 + Math.random() * 0.15).toFixed(2);
        return { factors, score };
    };

    const getStationName = (stationId) => stations.find(s => s.id === stationId)?.name || stationId;

    const getRerouteOptions = (trainId) => {
        const options = {
            'TR001': [{ route: `${getStationName('A')} → ${getStationName('E')} → ${getStationName('D')} → ${getStationName('F')} → ${getStationName('C')}`, accuracy: 94, delay: '+3min', reason: 'Avoid maintenance on T2' }],
            'TR002': [{ route: `${getStationName('A')} → ${getStationName('E')} → ${getStationName('D')}`, accuracy: 96, delay: '-2min', reason: 'Faster secondary route' }],
            'TR003': [{ route: `Hold at ${getStationName('D')} until priority clear`, accuracy: 95, delay: '+15min', reason: 'Priority protocol' }],
            'TR004': [{ route: `Reroute via ${getStationName('I')} → ${getStationName('F')}`, accuracy: 88, delay: '+4min', reason: 'Avoid congestion at South Hub' }]
        };
        return options[trainId] || [];
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setLivePositions(prev => {
                const newPositions = { ...prev };
                trains.forEach(train => {
                    const currentState = trainStates[train.id];
                    if (currentState?.status === 'emergency_stopped') return;
                    const current = newPositions[train.id] || train.position;
                    let newPos = current + 0.005;
                    if (newPos >= 1) newPos = 0;
                    newPositions[train.id] = newPos;
                });
                return newPositions;
            });
        }, 500);
        return () => clearInterval(interval);
    }, [trains, trainStates, setLivePositions]);

    useEffect(() => {
        const conflictTimer = setTimeout(() => {
            const conflictingTrain = trains.find(t => t.id === 'TR004');
            if (!conflictingTrain) return;
            setConflictAlert({ type: 'track_conflict', trains: ['TR001', 'TR004'], location: 'Junction F', reason: 'Two trains approaching same track segment', estimatedCollision: '2 minutes', suggestedAction: 'Halt TR004 at current position' });

            if (onNewAlert) {
                const { factors, score } = generatePriorityData();
                onNewAlert({
                    id: 'conflict-' + conflictingTrain.id,
                    trainId: conflictingTrain.id,
                    trainName: conflictingTrain.name,
                    issue: 'Track Conflict',
                    details: 'Approaching same segment as TR001',
                    score,
                    factors,
                    suggestions: getRerouteOptions(conflictingTrain.id)
                });
            }
        }, 8000);

        return () => clearTimeout(conflictTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        trains
            .filter(t => t.status === 'delayed' || t.status === 'priority_hold')
            .forEach(t => {
                if (onNewAlert) {
                    const { factors, score } = generatePriorityData();
                    onNewAlert({
                        id: t.id,
                        trainId: t.id,
                        trainName: t.name,
                        issue: t.status === 'delayed' ? `Delayed (+${t.delay} min)` : 'Priority Hold',
                        details: t.delayReason || 'Awaiting clearance',
                        score,
                        factors,
                        suggestions: getRerouteOptions(t.id)
                    });
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStationCoords = (stationId) => {
        const station = stations.find(s => s.id === stationId);
        return station ? { x: station.x, y: station.y } : { x: 0, y: 0 };
    };

    const getTrainPosition = (train) => {
        const track = tracks.find(t => t.id === train.track);
        if (!track) return { x: 0, y: 0 };
        const from = getStationCoords(track.from);
        const to = getStationCoords(track.to);
        const position = livePositions[train.id] || train.position;
        return { x: from.x + (to.x - from.x) * position, y: from.y + (to.y - from.y) * position };
    };

    const getTrackColor = (status) => {
        const colors = { active: '#10b981', maintenance: '#ef4444', congested: '#f59e0b', bypass: '#3b82f6', freight: '#8b5cf6', metro: '#06b6d4', express: '#f97316' };
        return colors[status] || '#6b7280';
    };

    const getStatusColor = (status) => {
        const colors = { on_time: '#10b981', delayed: '#f59e0b', rerouting: '#3b82f6', priority_hold: '#ef4444', emergency_stopped: '#dc2626' };
        return colors[status] || '#6b7280';
    };

    const getCurrentTrainData = (train) => {
        const state = trainStates[train.id];
        return { ...train, speed: state?.speed !== undefined ? state.speed : train.speed, status: state?.status || train.status, track: state?.track || train.track };
    };

    const handleEmergencyStop = (trainId) => {
        setTrainStates(prev => ({ ...prev, [trainId]: { ...prev[trainId], speed: 0, status: 'emergency_stopped' } }));
        alert(`🚨 EMERGENCY STOP ACTIVATED!\n\nTrain: ${trainId}\nStatus: Train stopped immediately\nSpeed: 0 km/h\n\n⚠️ Manual clearance required to resume operations.`);
    };

    return (
        <div className="min-h-screen bg-gray-900 relative overflow-hidden">
            {conflictAlert && (
                <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white rounded-lg shadow-2xl p-6 w-96 border-4 border-red-400 animate-pulse">
                    <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-8 h-8 text-yellow-300" /><h2 className="text-xl font-bold">🚨 CRITICAL CONFLICT</h2></div>
                    <div className="space-y-2 mb-4"><div><strong>Location:</strong> {conflictAlert.location}</div><div><strong>Trains:</strong> {conflictAlert.trains.join(', ')}</div><div><strong>Issue:</strong> {conflictAlert.reason}</div><div><strong>ETA:</strong> {conflictAlert.estimatedCollision}</div></div>
                    <div className="flex gap-2"><button onClick={() => { handleEmergencyStop(conflictAlert.trains[0]); setConflictAlert(null); }} className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-bold">🚦 Apply Action</button><button onClick={() => setConflictAlert(null)} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm">❌ Dismiss</button></div>
                </div>
            )}
            <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg p-4 w-72">
                <div className="flex items-center gap-2 mb-3"><CloudRain className="w-5 h-5 text-red-500" /><h3 className="font-bold text-gray-900">🌫️ Weather Alert</h3></div>
                <div className="text-sm space-y-2"><div className="flex justify-between"><span className="font-medium">Status:</span><span className="text-red-600 font-semibold">{weatherAlert.type.toUpperCase()}</span></div><div className="flex justify-between"><span className="font-medium">Location:</span><span>{weatherAlert.location}</span></div><div className="flex justify-between"><span className="font-medium">Visibility:</span><span>{weatherAlert.visibility}</span></div><div className="pt-2 border-t border-gray-200"><span className="font-medium text-red-600">Impact:</span><div className="text-xs mt-1">{weatherAlert.impact}</div></div></div>
            </div>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <button onClick={() => setZoom((z) => Math.min(z * 1.2, 3))} className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))} className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={() => setShowAIRecommendations(!showAIRecommendations)} className={`p-3 rounded-lg shadow-lg transition-colors ${showAIRecommendations ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-white text-purple-600 hover:bg-purple-50'}`}>🤖</button>
            </div>
            
            {showAIRecommendations && (
                <div className="absolute bottom-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 w-80">
                    <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-600" />🤖 AI Recommendations</h3><button onClick={() => setShowAIRecommendations(false)} className="text-gray-400 hover:text-gray-600">✕</button></div>
                    <div className="space-y-3 text-sm"><div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500"><div className="font-semibold text-blue-800 mb-1">CatBoost Priority Analysis</div><div className="text-xs space-y-1"><div>• TR001: Maintain priority (94% confidence)</div><div>• TR003: Move to siding (87% confidence)</div></div></div><div className="bg-green-50 p-3 rounded border-l-4 border-green-500"><div className="font-semibold text-green-800 mb-1">PyTorch Routing Optimizer</div><div className="text-xs space-y-1"><div>• TR002: Reroute via E-D (91% confidence)</div><div>• TR004: Continue current path (82% confidence)</div></div></div><div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500"><div className="font-semibold text-yellow-800 mb-1">Network Performance</div><div className="text-xs space-y-1"><div>• Overall Efficiency: 78%</div><div>• Active Bottlenecks: T2, Junction F</div><div>• Predicted Delay: 12min average</div></div></div></div>
                </div>
            )}
            
            {(hoveredTrain || selectedTrain) && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 bg-white rounded-lg shadow-lg p-4 w-80">
                    <div className="mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Train className="w-4 h-4 text-blue-600" />{getCurrentTrainData(hoveredTrain || selectedTrain).name}</h3></div>
                    <div className="space-y-3 text-sm mb-4">
                        <div className="flex justify-between"><span className="font-medium">Speed:</span><span className="font-semibold">{getCurrentTrainData(hoveredTrain || selectedTrain).speed} km/h</span></div>
                        <div className="flex justify-between"><span className="font-medium">Passengers:</span><span className="font-semibold">{getCurrentTrainData(hoveredTrain || selectedTrain).passengers}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Status:</span><span className={`font-semibold capitalize ${getCurrentTrainData(hoveredTrain || selectedTrain).status === 'on_time' ? 'text-green-600' : getCurrentTrainData(hoveredTrain || selectedTrain).status === 'emergency_stopped' ? 'text-red-600' : 'text-yellow-600'}`}>{getCurrentTrainData(hoveredTrain || selectedTrain).status.replace('_', ' ')}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Delay:</span><span className={`font-semibold ${(hoveredTrain || selectedTrain).delay > 0 ? 'text-red-600' : 'text-green-600'}`}>{(hoveredTrain || selectedTrain).delay > 0 ? '+' : ''}{(hoveredTrain || selectedTrain).delay} min</span></div>
                    </div>
                    {(hoveredTrain || selectedTrain).delayReason && (<div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4"><div className="text-xs font-semibold text-red-700 mb-1">⚠️ Delay Reason:</div><div className="text-xs text-gray-700">{(hoveredTrain || selectedTrain).delayReason}</div></div>)}
                    
                    <div className="mb-4">
                        <button 
                            onClick={() => handleEmergencyStop((hoveredTrain || selectedTrain).id)} 
                            className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                        >
                            🛑 Emergency Stop
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full h-full">
                <svg width="100%" height="100vh" viewBox="0 0 1200 800" className="bg-gray-800" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
                    <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" />
                    {tracks.map((track) => { const from = getStationCoords(track.from); const to = getStationCoords(track.to); return (<g key={track.id}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={getTrackColor(track.status)} strokeWidth="8" opacity="0.8" strokeDasharray={track.status === 'maintenance' ? '10,5' : 'none'} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 10} fill="white" fontSize="10" textAnchor="middle" className="font-mono">{track.id} ({track.length}km)</text></g>); })}
                    {stations.map((station) => (<g key={station.id}><circle cx={station.x} cy={station.y} r={station.type === 'major' ? 20 : 15} fill="#1f2937" stroke="#60a5fa" strokeWidth="3" /><circle cx={station.x} cy={station.y} r={station.type === 'major' ? 15 : 10} fill="#60a5fa" opacity="0.8" /><text x={station.x} y={station.y - 30} fill="white" fontSize="12" textAnchor="middle" className="font-semibold">{station.name}</text></g>))}
                    {trains.map((train) => { const pos = getTrainPosition(train); const currentTrain = getCurrentTrainData(train); return (<g key={train.id} onMouseEnter={() => setHoveredTrain(train)} onMouseLeave={() => setHoveredTrain(null)} onClick={() => setSelectedTrain(selectedTrain?.id === train.id ? null : train)} className="cursor-pointer"><rect x={pos.x - 15} y={pos.y - 8} width="30" height="16" rx="8" fill={getStatusColor(currentTrain.status)} stroke="white" strokeWidth="2" /><polygon points={`${pos.x + 15},${pos.y} ${pos.x + 25},${pos.y - 5} ${pos.x + 25},${pos.y + 5}`} fill={getStatusColor(currentTrain.status)} /><circle cx={pos.x} cy={pos.y} r="4" fill="white" /><text x={pos.x} y={pos.y - 20} fill="white" fontSize="10" textAnchor="middle" className="font-semibold">{train.name}</text><text x={pos.x} y={pos.y + 30} fill="#d1d5db" fontSize="8" textAnchor="middle">{currentTrain.speed} km/h</text>{currentTrain.status === 'emergency_stopped' && (<g><circle cx={pos.x} cy={pos.y} r="30" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="5,5" opacity="0.8" /><text x={pos.x} y={pos.y + 45} fill="#dc2626" fontSize="8" textAnchor="middle" className="font-bold">🚨 STOPPED</text></g>)}{(hoveredTrain?.id === train.id || selectedTrain?.id === train.id) && (<circle cx={pos.x} cy={pos.y} r="35" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" opacity="0.8"><animate attributeName="r" values="35;40;35" dur="1s" repeatCount="indefinite" /></circle>)}</g>); })}
                    <g transform="translate(50, 680)"><rect x="0" y="0" width="400" height="110" fill="rgba(0,0,0,0.95)" rx="8" stroke="#374151" strokeWidth="2" /><text x="15" y="25" fill="white" fontSize="14" className="font-bold">🗺️ Railway Network Legend</text><g transform="translate(15, 40)"><text x="0" y="0" fill="#d1d5db" fontSize="11" className="font-semibold">Track Status:</text><g transform="translate(0, 15)"><line x1="0" y1="0" x2="20" y2="0" stroke="#10b981" strokeWidth="4" /><text x="25" y="5" fill="white" fontSize="9">Active</text></g><g transform="translate(0, 30)"><line x1="0" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="4" strokeDasharray="5,5" /><text x="25" y="5" fill="white" fontSize="9">Maintenance</text></g><g transform="translate(0, 45)"><line x1="0" y1="0" x2="20" y2="0" stroke="#f59e0b" strokeWidth="4" /><text x="25" y="5" fill="white" fontSize="9">Congested</text></g></g><g transform="translate(120, 40)"><text x="0" y="0" fill="#d1d5db" fontSize="11" className="font-semibold">Train Status:</text><g transform="translate(0, 15)"><rect x="0" y="-6" width="16" height="12" rx="6" fill="#10b981" /><text x="20" y="5" fill="white" fontSize="9">On Time</text></g><g transform="translate(0, 30)"><rect x="0" y="-6" width="16" height="12" rx="6" fill="#f59e0b" /><text x="20" y="5" fill="white" fontSize="9">Delayed</text></g><g transform="translate(0, 45)"><rect x="0" y="-6" width="16" height="12" rx="6" fill="#dc2626" /><text x="20" y="5" fill="white" fontSize="9">Emergency Stop</text></g></g><g transform="translate(230, 40)"><text x="0" y="0" fill="#d1d5db" fontSize="11" className="font-semibold">Track Types:</text><g transform="translate(0, 15)"><line x1="0" y1="0" x2="15" y2="0" stroke="#8b5cf6" strokeWidth="4" /><text x="20" y="5" fill="white" fontSize="9">Freight</text></g><g transform="translate(0, 30)"><line x1="0" y1="0" x2="15" y2="0" stroke="#06b6d4" strokeWidth="4" /><text x="20" y="5" fill="white" fontSize="9">Metro</text></g><g transform="translate(0, 45)"><line x1="0" y1="0" x2="15" y2="0" stroke="#f97316" strokeWidth="4" /><text x="20" y="5" fill="white" fontSize="9">Express</text></g></g></g>
                </svg>
            </div>
        </div>
    );
};

export default RailwayDigitalTwin;