import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, circle }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/70 ${circle ? 'rounded-full' : ''} ${className}`}
      style={{
        width: width,
        height: height,
      }}
    />
  );
};

export default Skeleton;
