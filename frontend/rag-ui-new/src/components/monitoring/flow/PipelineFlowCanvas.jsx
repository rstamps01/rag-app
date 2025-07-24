/**
 * Pipeline Flow Canvas
 * n8n.io-inspired visual canvas for displaying pipeline stages and connections
 */

import React, { useRef, useState, useEffect } from 'react';



const PipelineFlowCanvas = ({ 
    pipelineState, 
    onNodeSelect, 
    debugMode = false, 
    isConnected = false,
    simulateEvent 
}) => {
    const canvasRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Node positions optimized for visual flow
    const nodePositions = {
        query_input: { x: 200, y: 250 },
        embedding: { x: 400, y: 250 },
        vector_search: { x: 600, y: 250 },
        document_retrieval: { x: 800, y: 250 },
        context_prep: { x: 800, y: 450 },
        llm_processing: { x: 600, y: 450 },
        response: { x: 400, y: 450 },
        history_log: { x: 200, y: 450 }
    };

    // Update canvas size on mount and resize
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasSize({ width: rect.width, height: rect.height });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Handle mouse wheel for zooming
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.5, Math.min(2, zoom * delta));
        setZoom(newZoom);
    };

    // Handle mouse down for panning
    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left mouse button
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    // Handle mouse move for panning
    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Reset view
    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Zoom in
    const zoomIn = () => {
        setZoom(prev => Math.min(2, prev * 1.2));
    };

    // Zoom out
    const zoomOut = () => {
        setZoom(prev => Math.max(0.5, prev / 1.2));
    };

    // Handle canvas click (deselect nodes)
    const handleCanvasClick = (e) => {
        if (e.target === canvasRef.current) {
            onNodeSelect(null);
        }
    };

    // Get active data flows for animation
    const getActiveDataFlows = () => {
        if (!pipelineState?.connections) return [];
        
        return pipelineState.connections
            .filter(connection => connection.active)
            .map(connection => ({
                from: nodePositions[connection.from],
                to: nodePositions[connection.to],
                id: `${connection.from}-${connection.to}`,
                speed: 2000 // Animation duration in ms
            }));
    };

    // Development helper - simulate events
    const handleNodeDoubleClick = (node) => {
        if (debugMode && process.env.NODE_ENV === 'development') {
            simulateEvent?.({
                pipeline_id: 'debug_pipeline',
                stage: node.id,
                data: {
                    status: node.status === 'processing' ? 'success' : 'processing',
                    timestamp: new Date().toISOString()
                }
            });
        }
    };

    return (
        <div 
            ref={canvasRef}
            className="relative w-full h-full bg-gray-900 overflow-hidden cursor-grab select-none"
            style={{ 
                backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', 
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
        >
            {/* Grid Overlay */}
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
            >
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4B5563" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Main Canvas Content */}
            <div 
                className="absolute inset-0"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
            >
                {/* Render Connections */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                    {pipelineState?.connections?.map((connection, index) => (
                        <FlowConnection
                            key={`${connection.from}-${connection.to}`}
                            from={nodePositions[connection.from]}
                            to={nodePositions[connection.to]}
                            active={connection.active}
                            debugMode={debugMode}
                            isConnected={isConnected}
                        />
                    ))}
                </svg>

                {/* Render Data Flow Animations */}
                {getActiveDataFlows().map((flow) => (
                    <DataFlowAnimation
                        key={flow.id}
                        from={flow.from}
                        to={flow.to}
                        speed={flow.speed}
                        isActive={isConnected}
                    />
                ))}

                {/* Render Pipeline Nodes */}
                {pipelineState?.stages?.map((stage) => {
                    const position = nodePositions[stage.id];
                    if (!position) return null;

                    return (
                        <PipelineNode
                            key={stage.id}
                            stage={stage}
                            position={position}
                            onClick={() => onNodeSelect(stage)}
                            onDoubleClick={() => handleNodeDoubleClick(stage)}
                            debugMode={debugMode}
                            isConnected={isConnected}
                        />
                    );
                })}

                {/* Debug Information Overlay */}
                {debugMode && (
                    <div className="absolute top-4 left-4 bg-purple-800 bg-opacity-90 text-white p-3 rounded-lg text-xs space-y-1 pointer-events-none">
                        <div>Canvas Size: {canvasSize.width} x {canvasSize.height}</div>
                        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
                        <div>Pan: {pan.x.toFixed(0)}, {pan.y.toFixed(0)}</div>
                        <div>Stages: {pipelineState?.stages?.length || 0}</div>
                        <div>Active Connections: {pipelineState?.connections?.filter(c => c.active).length || 0}</div>
                    </div>
                )}
            </div>

            {/* Canvas Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
                <button 
                    onClick={zoomIn}
                    className="p-2 bg-gray-800 bg-opacity-90 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    title="Zoom In"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                
                <button 
                    onClick={zoomOut}
                    className="p-2 bg-gray-800 bg-opacity-90 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    title="Zoom Out"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                
                <button 
                    onClick={resetView}
                    className="p-2 bg-gray-800 bg-opacity-90 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    title="Reset View"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Zoom Level Indicator */}
            <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 text-white px-3 py-1 rounded text-sm">
                {(zoom * 100).toFixed(0)}%
            </div>

            {/* Connection Status Indicator */}
            {!isConnected && (
                <div className="absolute bottom-4 left-4 bg-red-600 bg-opacity-90 text-white px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm">Pipeline Disconnected</span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!pipelineState && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading pipeline state...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipelineFlowCanvas;
