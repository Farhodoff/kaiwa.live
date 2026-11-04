import React from 'react';
import RoomWhiteboard from './study-room/RoomWhiteboard';

interface WhiteboardProps {
  whiteboardId: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ whiteboardId: _whiteboardId }) => {
  return (
    <div className="relative h-[600px] w-full touch-none overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700">
      <RoomWhiteboard />
    </div>
  );
};

export default Whiteboard;
