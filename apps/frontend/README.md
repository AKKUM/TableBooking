# Table Booking Frontend

A modern React-based frontend for a table reservation booking system with an advanced room layout designer.

## Features

### Room Layout Designer
- **Drag & Drop Components**: Drag tables, bars, reception areas, kitchens, stages, and decorative elements from the component palette onto the room layout
- **Resizable Components**: Click and drag the corner handles to resize any component
- **Grid Snapping**: Components automatically snap to a 20px grid for precise positioning
- **Interactive Editing**: Double-click on any table to open a detailed edit modal
- **Visual Feedback**: Selected components show resize handles and action buttons
- **Component Palette**: Toggle the component palette to show/hide available components

### Component Types
- **Tables**: Round and rectangular tables with customizable capacity
- **Service Areas**: Bar counters, reception desks, kitchens, and stages
- **Entrances**: Main entrances and exits
- **Decorative Elements**: Trees, flower pots, and umbrellas

### Table Properties
Each table can be configured with:
- Table number/label
- Seating capacity (e.g., "2-4", "6-8")
- Location description (e.g., "Window side", "Near bar")
- Price range
- Wheelchair accessibility
- Additional notes
- Active/inactive status

### Layout Management
- **Save Layouts**: Save your custom layouts to localStorage
- **Reset to Default**: Restore the original restaurant floor plan
- **Grid Toggle**: Show/hide the positioning grid
- **Statistics**: View active tables, total capacity, and room areas

## Usage

### Adding Components
1. **From Palette**: Drag any component from the left sidebar onto the canvas
2. **Quick Add**: Use the "Add Table" button for quick table placement
3. **Grid Snapping**: Components automatically align to the grid for precise positioning

### Editing Components
1. **Select**: Click on any component to select it
2. **Move**: Drag the center of a selected component to reposition it
3. **Resize**: Drag the corner handles to resize the component
4. **Edit Details**: Double-click on tables to open the edit modal

### Managing Layout
1. **Save**: Click "Save Layout" to persist your changes
2. **Reset**: Use "Reset" to restore the original layout
3. **Toggle Grid**: Show/hide the positioning grid
4. **Toggle Palette**: Show/hide the component palette

## Technical Details

### Components
- `RoomLayout.tsx` - Main layout designer component
- `ComponentPalette.tsx` - Draggable component palette
- `ResizableComponent.tsx` - Wrapper for resizable components
- `TableEditModal.tsx` - Modal for editing table properties

### State Management
- Uses React hooks for local state management
- Layout data persisted in localStorage
- Real-time updates for drag, resize, and edit operations

### Styling
- Built with Tailwind CSS
- Responsive design
- Custom CSS classes for buttons and components

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Navigate to the Room Layout page to start designing

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Dependencies

- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- React Hot Toast (notifications)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
