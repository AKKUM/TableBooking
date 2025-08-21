import React from 'react';
import { Table, BarChart3, Building2, ChefHat, Music, DoorOpen, Leaf, Flower, Umbrella } from 'lucide-react';

interface ComponentItem {
  type: 'table' | 'bar' | 'reception' | 'kitchen' | 'stage' | 'entrance' | 'tree' | 'flower' | 'umbrella';
  shape: 'round' | 'rectangle' | 'bar-counter' | 'stage-area';
  label: string;
  color: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

const componentTypes: ComponentItem[] = [
  {
    type: 'table',
    shape: 'round',
    label: 'Round Table',
    color: '#10b981',
    icon: <Table className="h-8 w-8" />,
    defaultWidth: 60,
    defaultHeight: 60
  },
  {
    type: 'table',
    shape: 'rectangle',
    label: 'Rectangle Table',
    color: '#10b981',
    icon: <Table className="h-8 w-8" />,
    defaultWidth: 80,
    defaultHeight: 40
  },
  {
    type: 'bar',
    shape: 'bar-counter',
    label: 'Bar Counter',
    color: '#8b5cf6',
    icon: <BarChart3 className="h-8 w-8" />,
    defaultWidth: 120,
    defaultHeight: 30
  },
  {
    type: 'reception',
    shape: 'rectangle',
    label: 'Reception',
    color: '#f59e0b',
    icon: <Building2 className="h-8 w-8" />,
    defaultWidth: 80,
    defaultHeight: 40
  },
  {
    type: 'kitchen',
    shape: 'rectangle',
    label: 'Kitchen',
    color: '#ef4444',
    icon: <ChefHat className="h-8 w-8" />,
    defaultWidth: 100,
    defaultHeight: 60
  },
  {
    type: 'stage',
    shape: 'stage-area',
    label: 'Stage',
    color: '#ec4899',
    icon: <Music className="h-8 w-8" />,
    defaultWidth: 120,
    defaultHeight: 60
  },
  {
    type: 'entrance',
    shape: 'rectangle',
    label: 'Entrance',
    color: '#6b7280',
    icon: <DoorOpen className="h-8 w-8" />,
    defaultWidth: 100,
    defaultHeight: 20
  },
  {
    type: 'tree',
    shape: 'round',
    label: 'Tree',
    color: '#059669',
    icon: <Leaf className="h-8 w-8" />,
    defaultWidth: 40,
    defaultHeight: 40
  },
  {
    type: 'flower',
    shape: 'round',
    label: 'Flower Pot',
    color: '#f97316',
    icon: <Flower className="h-8 w-8" />,
    defaultWidth: 30,
    defaultHeight: 30
  },
  {
    type: 'umbrella',
    shape: 'round',
    label: 'Umbrella',
    color: '#ffffff',
    icon: <Umbrella className="h-8 w-8" />,
    defaultWidth: 30,
    defaultHeight: 30
  }
];

interface ComponentPaletteProps {
  onDragStart: (e: React.DragEvent, component: ComponentItem) => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onDragStart }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Components</h3>
      <div className="grid grid-cols-1 gap-4">
        {componentTypes.map((component) => (
          <div
            key={`${component.type}-${component.shape}`}
            draggable
            onDragStart={(e) => onDragStart(e, component)}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div
              className="w-16 h-16 rounded-lg mb-3 flex items-center justify-center text-white"
              style={{
                backgroundColor: component.color,
                borderRadius: component.shape === 'round' ? '50%' : '12px'
              }}
            >
              {component.icon}
            </div>
            <span className="text-sm text-gray-700 text-center font-medium">
              {component.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-gray-500 text-center">
        Drag components onto the layout
      </div>
    </div>
  );
};

export default ComponentPalette;
export type { ComponentItem };
