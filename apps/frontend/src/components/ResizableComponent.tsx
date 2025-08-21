import React, { useState, useRef, useEffect } from 'react';
import { Move, CornerDownRight } from 'lucide-react';

interface TableItem {
  id: string;
  type: 'table' | 'bar' | 'reception' | 'kitchen' | 'stage' | 'entrance' | 'tree' | 'flower' | 'umbrella';
  shape: 'round' | 'rectangle' | 'bar-counter' | 'stage-area';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  capacity: string;
  isWheelchairAccessible?: boolean;
  isActive: boolean;
  color: string;
  location?: string;
  notes?: string;
  price?: string;
}

interface ResizableComponentProps {
  item: TableItem;
  isSelected: boolean;
  onSelect: (item: TableItem) => void;
  onUpdate: (updatedItem: TableItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  children: React.ReactNode;
}

const ResizableComponent: React.FC<ResizableComponentProps> = ({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onToggleStatus,
  children
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const rect = componentRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      offsetX,
      offsetY
    });
    
    setIsDragging(true);
    onSelect(item);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isResizing) {
      const newX = item.x + (e.clientX - dragStart.x);
      const newY = item.y + (e.clientY - dragStart.y);
      
      onUpdate({
        ...item,
        x: Math.max(0, newX),
        y: Math.max(0, newY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: item.width,
      height: item.height
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(20, resizeStart.width + deltaX);
    const newHeight = Math.max(20, resizeStart.height + deltaY);
    
    onUpdate({
      ...item,
      width: newWidth,
      height: newHeight
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // This will be handled by the parent component to open the edit modal
  };

  useEffect(() => {
    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleResizeMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, isDragging]);



  return (
    <div
      ref={componentRef}
      className={`absolute select-none ${isSelected ? 'z-50' : 'z-10'}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      
      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Southeast corner resize handle */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-full opacity-75 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ transform: 'translate(50%, 50%)' }}
          >
            <CornerDownRight className="w-2 h-2 text-white" />
          </div>
          
          {/* Southwest corner resize handle */}
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize rounded-full opacity-75 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{ transform: 'translate(-50%, 50%)' }}
          />
          
          {/* Northeast corner resize handle */}
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize rounded-full opacity-75 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{ transform: 'translate(50%, -50%)' }}
          />
          
          {/* Northwest corner resize handle */}
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize rounded-full opacity-75 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
          
          {/* Move indicator */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            <Move className="w-3 h-3 inline mr-1" />
            Drag to move
          </div>
        </>
      )}
      
      {/* Action buttons - only show when selected */}
      {isSelected && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(item.id);
            }}
            className="p-1 bg-white rounded shadow text-xs hover:bg-gray-50"
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? '✓' : '✗'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1 bg-red-500 text-white rounded shadow text-xs hover:bg-red-600"
            title="Delete"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ResizableComponent;
