import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Save, 
  RotateCcw, 
  Trash2, 
  X, 
  LayoutDashboard,
  Loader2,
  Grid,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TableEditModal from '../components/TableEditModal';
import ComponentPalette, { ComponentItem } from '../components/ComponentPalette';
import ResizableComponent from '../components/ResizableComponent';

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

interface RoomArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isActive: boolean;
}

const RoomLayout: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [areas, setAreas] = useState<RoomArea[]>([]);
  const [selectedItem, setSelectedItem] = useState<TableItem | RoomArea | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize] = useState(20);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [showComponentPalette, setShowComponentPalette] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load tables from backend API
  useEffect(() => {
    loadTablesFromAPI();
  }, []);

  // Auto-save layout changes
  useEffect(() => {
    if (tables.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        // Use the complete layout replacement approach for auto-save
        saveLayoutToDatabase();
      }, 3000); // Auto-save after 3 seconds of no changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [tables, areas]);

  const loadTablesFromAPI = async () => {
    try {
      setLoading(true);
      
      // Try to load the active room layout first
      try {
        const activeLayout = await adminAPI.getActiveLayout();
        if (activeLayout && activeLayout.layout_data) {
          const layoutData = activeLayout.layout_data;
         
          // Load tables from layout data
          if (layoutData.tables && Array.isArray(layoutData.tables)) {
            const convertedTables: TableItem[] = layoutData.tables.map((table: any, index: number) => ({
              id: `table-${table.id ?? table.table_number ?? index}`,
              type: 'table',
              shape: table.table_type === 'round' ? 'round' : 'rectangle',
              x: (table.location_x ?? table.x ?? 100),
              y: (table.location_y ?? table.y ?? 100),
              width: table.width ?? (table.table_type === 'round' ? 60 : 80),
              height: table.height ?? (table.table_type === 'round' ? 60 : 40),
              label: table.table_number ?? table.label ?? `T${index + 1}`,
              capacity: `${table.seats ?? 2}-${table.seats ?? 2}`,
              isActive: (table.is_active !== undefined ? table.is_active : true),
              color: table.color ?? ((table.is_active ?? true) ? '#10b981' : '#6b7280'),
              location: table.location ?? table.name,
              notes: table.notes ?? `Seats: ${table.seats ?? 2}`,
            }));
            
            setTables(convertedTables);
          }
          
          // Load areas from layout data
          if (layoutData.areas && Array.isArray(layoutData.areas)) {
            const convertedAreas: RoomArea[] = layoutData.areas.map((area: any) => ({
              id: area.id,
              name: area.name,
              x: area.x || 100,
              y: area.y || 100,
              width: area.width || 200,
              height: area.height || 150,
              color: area.color || '#f3f4f6',
              isActive: area.is_active,
            }));
            
            setAreas(convertedAreas);
          }
          
          // Load canvas settings if available
          if (layoutData.canvas) {
            // You could update canvas size here if needed
            console.log('Loaded canvas settings:', layoutData.canvas);
          }
          
          console.log('Layout loaded from database:', activeLayout.name);
          return; // Successfully loaded layout, exit early
        }
      } catch (error) {
        console.log('No active layout found, loading individual tables...');
      }
      
      // Fallback: Load individual tables if no layout exists
      const apiTables = await adminAPI.getTables();
      
      // Convert API table format to component format
      const convertedTables: TableItem[] = apiTables.map((table: any) => ({
        id: `table-${table.id}`,
        type: 'table',
        shape: table.table_type === 'round' ? 'round' : 'rectangle',
        x: table.location_x || 100,
        y: table.location_y || 100,
        width: table.table_type === 'round' ? 60 : 80,
        height: table.table_type === 'round' ? 60 : 40,
        label: table.table_number,
        capacity: `${table.seats}-${table.seats}`,
        isActive: table.is_active,
        color: table.is_active ? '#10b981' : '#6b7280',
        location: table.name,
        notes: `Seats: ${table.seats}`,
      }));
      
      setTables(convertedTables);
      
      // Initialize room areas
      initializeRoomAreas();
      
    } catch (error) {
      console.error('Failed to load tables from API:', error);
      toast.error('Failed to load tables from server');
      // Fallback to default layout
      initializeDefaultLayout();
    } finally {
      setLoading(false);
    }
  };

  const saveLayoutToDatabase = async () => {
    if (saving || loading) return;
    
    try {
      setSaving(true);
      console.log('Starting to save layout...');
      
      // Prepare the complete layout data according to RoomLayoutCreate schema
      const layoutData = {
        name: "Restaurant Layout",
        layout_data: {
          tables: tables.map(table => ({
            table_number: table.label,
            name: `Table ${table.label}`,
            seats: parseInt(table.capacity.split('-')[0]),
            location_x: table.x,
            location_y: table.y,
            table_type: table.shape === 'round' ? 'round' : 'rectangle',
            // Extra visual metadata to faithfully reload the canvas
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            color: table.color,
            is_active: table.isActive,
            notes: table.notes
          })),
          areas: areas.map(area => ({
            id: area.id,
            name: area.name,
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            color: area.color,
            is_active: area.isActive
          })),
          canvas: {
            width: canvasSize.width,
            height: canvasSize.height,
            grid_size: gridSize
          },
          metadata: {
            last_updated: new Date().toISOString(),
            total_tables: tables.length,
            active_tables: tables.filter(t => t.isActive).length,
            total_areas: areas.length
          }
        }
      };

      console.log('Saving layout data:', layoutData);

      // First, deactivate all existing layouts
      try {
        console.log('Deactivating existing layouts...');
        const existingLayouts = await adminAPI.getLayouts();
        console.log('Found existing layouts:', existingLayouts);
        
        for (const layout of existingLayouts) {
          if (layout.is_active) {
            console.log('Deleting layout:', layout.id);
            await adminAPI.deleteLayout(layout.id);
          }
        }
      } catch (error) {
        console.error('Failed to deactivate existing layouts:', error);
      }

      // Create new layout
      console.log('Creating new layout...');
      const response = await adminAPI.createLayout(layoutData);
      console.log('Layout creation response:', response);
      
      if (response) {
        // Delete all existing tables and recreate them
        try {
           // delete all the booking before today
          const responseBooking = await adminAPI.deleteYesterdayBookings();
          console.log('Response Booking:', responseBooking);
          console.log('Deleting all existing tables...');
          const deleteResponse = await adminAPI.deleteAllTables();
          console.log('Delete all tables response:', deleteResponse);
          
          const tables_data = layoutData.layout_data.tables.map(table => ({
            table_number: table.table_number,
            name: table.name,
            seats: table.seats,
            location_x: table.location_x,
            location_y: table.location_y,
            table_type: table.table_type
          }));
          
          console.log('Recreating tables with data:', tables_data);
          
          const createdTables = [];
          const failedTables = [];
          
          for (const table of tables_data) {
            try {
              console.log('Creating table:', table);
              const createdTable = await adminAPI.createTable(table);
              console.log('Table created successfully:', createdTable);
              createdTables.push(createdTable);
            } catch (tableError) {
              console.error('Failed to create table:', table, tableError);
              failedTables.push({ table, error: tableError });
              // Continue with other tables even if one fails
            }
          }
          
          console.log('Table creation summary:', {
            total: tables_data.length,
            created: createdTables.length,
            failed: failedTables.length,
            failedDetails: failedTables
          });
          
          if (createdTables.length === tables_data.length) {
            toast.success(`Layout saved successfully! Created ${createdTables.length} tables.`);
          } else if (createdTables.length > 0) {
            toast.success(`Layout saved successfully! Created ${createdTables.length}/${tables_data.length} tables.`);
            if (failedTables.length > 0) {
              console.warn('Some tables failed to create:', failedTables);
            }
          } else {
            toast.error('Layout saved but no tables were created. Please check the console for errors.');
            console.error('All table creations failed:', failedTables);
          }
          
          console.log('Layout saved:', response);
        } catch (tableError) {
          console.error('Failed to recreate tables:', tableError);
          toast.error('Layout saved but table recreation failed. Please check the console for errors.');
        }
      }
      
    } catch (error) {
      console.error('Failed to save layout to database:', error);
      toast.error('Failed to save layout changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initializeRoomAreas = () => {
    // Room areas based on the floor plan
    const initialAreas: RoomArea[] = [
      { id: 'main-dining', name: 'Main Dining Area', x: 100, y: 100, width: 800, height: 500, color: '#f3f4f6', isActive: true },
      { id: 'auxiliary', name: 'Auxiliary Area', x: 50, y: 50, width: 200, height: 150, color: '#e5e7eb', isActive: true },
      { id: 'outdoor', name: 'Outdoor Area', x: 100, y: 650, width: 800, height: 120, color: '#dbeafe', isActive: true }
    ];
    setAreas(initialAreas);
  };

  const initializeDefaultLayout = () => {
    // Fallback default layout if API fails
    const defaultTables: TableItem[] = [
      { id: 'table-1', type: 'table', shape: 'rectangle', x: 120, y: 120, width: 80, height: 40, label: 'T1', capacity: '2-2', isActive: true, color: '#10b981' },
      { id: 'table-2', type: 'table', shape: 'rectangle', x: 220, y: 120, width: 80, height: 40, label: 'T2', capacity: '4-4', isActive: true, color: '#10b981' },
      { id: 'table-3', type: 'table', shape: 'rectangle', x: 320, y: 120, width: 80, height: 40, label: 'T3', capacity: '6-6', isActive: true, color: '#10b981' },
    ];
    
    setTables(defaultTables);
    initializeRoomAreas();
  };

  const resetLayout = async () => {
    if (!window.confirm('Are you sure you want to reset the layout? This will clear all existing layouts and start fresh.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Deactivate all existing layouts
      const existingLayouts = await adminAPI.getLayouts();
      
      for (const layout of existingLayouts) {
        if (layout.is_active) {
          await adminAPI.updateLayout(layout.id, { is_active: false });
        }
      }
      
      // Load fresh tables from database
      await loadTablesFromAPI();
      
      toast.success('Layout reset successfully!');
    } catch (error) {
      console.error('Failed to reset layout:', error);
      toast.error('Failed to reset layout');
    } finally {
      setLoading(false);
    }
  };

  // Handle component drag from palette
  const handleComponentDragStart = (e: React.DragEvent, component: ComponentItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json')) as ComponentItem;
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (!rect) return;
      
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      
      // Snap to grid
      const snappedX = Math.round(dropX / gridSize) * gridSize;
      const snappedY = Math.round(dropY / gridSize) * gridSize;
      
      const newTable: TableItem = {
        id: `${componentData.type}-${Date.now()}`,
        type: componentData.type,
        shape: componentData.shape,
        x: Math.max(0, snappedX),
        y: Math.max(0, snappedY),
        width: componentData.defaultWidth,
        height: componentData.defaultHeight,
        label: componentData.type === 'table' ? `T${tables.filter(t => t.type === 'table').length + 1}` : componentData.label,
        capacity: componentData.type === 'table' ? '2-4' : '',
        isActive: true,
        color: componentData.color
      };
      
      setTables(prev => [...prev, newTable]);
      setSelectedItem(newTable);
      toast.success(`${componentData.label} added to layout`);
      
    } catch (error) {
      console.error('Error parsing dropped component:', error);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle table selection and editing
  const handleTableSelect = (table: TableItem) => {
    setSelectedItem(table);
  };

  const handleTableDoubleClick = (table: TableItem) => {
    setEditingTable(table);
    setIsEditModalOpen(true);
  };

  const handleTableUpdate = (updatedTable: TableItem) => {
    setTables(prev => prev.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    ));
    setSelectedItem(updatedTable);
  };

  const handleTableDelete = (id: string) => {
    setTables(prev => prev.filter(table => table.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    toast.success('Table deleted');
  };

  const handleTableToggleStatus = (id: string) => {
    setTables(prev => prev.map(table => 
      table.id === id ? { ...table, isActive: !table.isActive } : table
    ));
  };

  const handleAreaSelect = (area: RoomArea) => {
    setSelectedItem(area);
  };

  const deleteItem = (id: string) => {
    // Check if it's a table - tables cannot be deleted from layout, only deactivated
    const tableIndex = tables.findIndex(table => table.id === id);
    if (tableIndex !== -1) {
      // Instead of deleting, just deactivate the table
      setTables(prev => prev.map(table => 
        table.id === id ? { ...table, isActive: false } : table
      ));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast.success('Table deactivated');
      return;
    }
    
    // Check if it's an area
    const areaIndex = areas.findIndex(area => area.id === id);
    if (areaIndex !== -1) {
      setAreas(areas.filter(area => area.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      toast.success('Area deleted');
      return;
    }
  };

  const toggleItemStatus = async (id: string) => {
    // Check if it's a table
    const tableIndex = tables.findIndex(table => table.id === id);
    if (tableIndex !== -1) {
      const updatedTables = tables.map(table => 
        table.id === id ? { ...table, isActive: !table.isActive } : table
      );
      setTables(updatedTables);
      
      // Save the status change to database immediately
      try {
        const tableId = parseInt(id.replace('table-', ''));
        const tableData = { is_active: !tables[tableIndex].isActive };
        await adminAPI.updateTable(tableId, tableData);
        toast.success('Table status updated');
      } catch (error) {
        console.error('Failed to update table status:', error);
        toast.error('Failed to update table status');
        // Revert the change if database update failed
        setTables(tables);
      }
      return;
    }
    
    // Check if it's an area
    const areaIndex = areas.findIndex(area => area.id === id);
    if (areaIndex !== -1) {
      setAreas(prev => prev.map(area => 
        area.id === id ? { ...area, isActive: !area.isActive } : area
      ));
      return;
    }
  };

  const renderTable = (table: TableItem) => {
    const isSelected = selectedItem?.id === table.id;
    const opacity = table.isActive ? 1 : 0.5;
    
    // Calculate text sizes based on table dimensions
    const getTextSize = (width: number, height: number) => {
      const minSize = Math.min(width, height);
      if (minSize < 40) return 'text-xs';
      if (minSize < 60) return 'text-sm';
      if (minSize < 80) return 'text-base';
      if (minSize < 100) return 'text-lg';
      if (minSize < 120) return 'text-xl';
      return 'text-2xl';
    };

    const getCapacitySize = (width: number, height: number) => {
      const minSize = Math.min(width, height);
      if (minSize < 40) return 'text-xs';
      if (minSize < 60) return 'text-sm';
      if (minSize < 80) return 'text-base';
      return 'text-lg';
    };

    const labelSize = getTextSize(table.width, table.height);
    const capacitySize = getCapacitySize(table.width, table.height);
    
    return (
      <ResizableComponent
        key={table.id}
        item={table}
        isSelected={isSelected}
        onSelect={handleTableSelect}
        onUpdate={handleTableUpdate}
        onDelete={handleTableDelete}
        onToggleStatus={handleTableToggleStatus}
      >
        <div
          className={`border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'} rounded-lg flex flex-col items-center justify-center text-white font-medium shadow-lg cursor-pointer`}
          style={{
            backgroundColor: table.color,
            borderRadius: table.shape === 'round' ? '50%' : '8px',
            opacity,
            width: '100%',
            height: '100%'
          }}
          onDoubleClick={() => handleTableDoubleClick(table)}
        >
          <div className="text-center">
            <div className={`font-bold ${labelSize}`}>{table.label}</div>
            {table.capacity && <div className={`${capacitySize} opacity-90`}>{table.capacity}</div>}
            {table.isWheelchairAccessible && (
              <div className={`${capacitySize} opacity-90`}>♿</div>
            )}
          </div>
        </div>
      </ResizableComponent>
    );
  };

  const renderArea = (area: RoomArea) => {
    const isSelected = selectedItem?.id === area.id;
    const opacity = area.isActive ? 0.7 : 0.3;
    
    // Calculate text size based on area dimensions
    const getAreaTextSize = (width: number, height: number) => {
      const minSize = Math.min(width, height);
      if (minSize < 60) return 'text-xs';
      if (minSize < 100) return 'text-sm';
      if (minSize < 150) return 'text-base';
      if (minSize < 200) return 'text-lg';
      return 'text-xl';
    };

    const areaTextSize = getAreaTextSize(area.width, area.height);
    
    return (
      <div
        key={area.id}
        className={`absolute cursor-move select-none ${isSelected ? 'z-40' : 'z-0'}`}
        style={{
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height
        }}
        onClick={() => handleAreaSelect(area)}
      >
        <div
          className={`border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'} rounded-lg flex items-center justify-center text-gray-700 font-medium shadow-md ${areaTextSize}`}
          style={{
            backgroundColor: area.color,
            opacity,
            width: '100%',
            height: '100%'
          }}
        >
          {area.name}
        </div>
        
        {/* Action buttons for areas */}
        {isSelected && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <button
              onClick={() => toggleItemStatus(area.id)}
              className="p-1 bg-white rounded shadow text-xs hover:bg-gray-50"
              title={area.isActive ? 'Deactivate' : 'Activate'}
            >
              {area.isActive ? '✓' : '✗'}
            </button>
            <button
              onClick={() => deleteItem(area.id)}
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

  return (
    <div className="space-y-6">
      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading tables from server...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Layout</h1>
            <p className="text-gray-600">Design and manage complete restaurant layouts saved to database</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              showGrid
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Grid className="h-4 w-4 inline mr-1" />
            Grid
          </button>
          <button
            onClick={() => setShowComponentPalette(!showComponentPalette)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              showComponentPalette
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-1" />
            Palette
          </button>
          <button
            onClick={saveLayoutToDatabase}
            className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 inline mr-1" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Tables: {tables.filter(t => t.isActive).length} active, Areas: {areas.filter(a => a.isActive).length} active</span>
          <div className="flex items-center space-x-2">
            {saving && (
              <span className="text-blue-600 flex items-center">
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving layout...
              </span>
            )}
            <span className="text-green-600">✓ Database connected</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-screen">
        {/* Component Palette - 15% width, full height */}
        {showComponentPalette && (
          <div className="w-[15%] flex-shrink-0 h-full">
            <ComponentPalette onDragStart={handleComponentDragStart} />
          </div>
        )}

        {/* Layout Canvas - 85% width */}
        <div className="flex-1 h-full">
          <div className="card p-0 overflow-hidden h-full">
            <div
              ref={canvasRef}
              className="relative bg-blue-50 border-2 border-gray-300 h-full"
              style={{
                width: canvasSize.width,
                backgroundImage: showGrid ? `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                ` : 'none',
                backgroundSize: `${gridSize}px ${gridSize}px`
              }}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
            >
              {/* Render Areas */}
              {areas.map(renderArea)}
              
              {/* Render Tables */}
              {tables.map(renderTable)}
              
              {/* Instructions */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow text-sm">
                <div className="font-medium mb-2">Instructions:</div>
                <div>• Drag components from palette to layout</div>
                <div>• Click to select, double-click to edit</div>
                <div>• Drag corners to resize, drag center to move</div>
                <div>• Use grid for precise positioning</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {tables.filter(t => t.type === 'table' && t.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Tables</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {tables.filter(t => t.type === 'table' && t.isActive).reduce((sum, t) => {
              const maxCapacity = parseInt(t.capacity.split('-')[1] || '0');
              return sum + maxCapacity;
            }, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Capacity</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {areas.length}
          </div>
          <div className="text-sm text-gray-600">Room Areas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {tables.filter(t => t.isWheelchairAccessible).length}
          </div>
          <div className="text-sm text-gray-600">Wheelchair Accessible</div>
        </div>
      </div>

      {/* Table Edit Modal */}
      <TableEditModal
        table={editingTable}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTable(null);
        }}
        onSave={handleTableUpdate}
        onDelete={handleTableDelete}
      />
    </div>
  );
};

export default RoomLayout;

