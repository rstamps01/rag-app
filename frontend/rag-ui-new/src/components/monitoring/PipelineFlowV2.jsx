// File: frontend/src/components/monitoring/PipelineFlowV2.jsx
const PipelineFlowV2 = () => {
    return (
        <div className="pipeline-flow-container">
            {/* Interactive Pipeline Diagram */}
            <InteractivePipelineMap 
                stages={pipelineStages}
                activeDocuments={activeDocuments}
                realTimeFlow={realTimeFlow}
            />
            
            {/* Live Data Stream */}
            <LiveDataStream 
                documents={streamingDocuments}
                showParticles={true}
                animationSpeed="smooth"
            />
            
            {/* Stage Performance Cards */}
            <StagePerformanceGrid 
                stages={stages}
                metrics={stageMetrics}
                alerts={stageAlerts}
            />
        </div>
    );
};