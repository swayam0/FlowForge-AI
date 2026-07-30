import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { motion } from 'framer-motion';

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isExecuting = data?.isExecuting || false;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: '#27272a', // Default darker gray
          strokeWidth: 2,
        }} 
      />
      
      {/* Animated Light Particle Overlay */}
      <motion.path
        d={edgePath}
        fill="none"
        stroke={isExecuting ? '#3b82f6' : '#a1a1aa'}
        strokeWidth={isExecuting ? 2 : 2}
        strokeDasharray={isExecuting ? "30 100" : "10 200"}
        className={isExecuting ? "opacity-100" : "opacity-0"}
        initial={{ strokeDashoffset: 130 }}
        animate={{ strokeDashoffset: -130 }}
        transition={{
          duration: isExecuting ? 1.5 : 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          filter: isExecuting ? 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.4))' : 'none',
        }}
      />
    </>
  );
}
