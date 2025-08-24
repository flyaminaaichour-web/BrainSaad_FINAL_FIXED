# 3D Force Graph - Les Misérables Character Network

This React application displays an interactive 3D force-directed graph visualization of character relationships from Victor Hugo's "Les Misérables" novel, with advanced node position management capabilities.

## Features

- **Interactive 3D Visualization**: Navigate around the graph using mouse controls
- **Character Network**: Displays relationships between characters from Les Misérables
- **Color-coded Groups**: Characters are colored by their group/community in the story
- **Link Labels**: Shows relationship connections between characters
- **Node Position Management**: Save and load custom node positions
- **Fixed Position Mode**: Lock nodes in place to prevent automatic repositioning
- **Drag & Drop**: Manually position nodes by dragging them
- **Dynamic Node Management**: Add and delete nodes in real-time

## Node Position Controls

### Control Panel
The application includes a control panel in the top-left corner with three main functions:

1. **Save Positions** (Green Button)
   - Downloads current node positions as `nodePositions.json`
   - Captures X, Y, Z coordinates of all nodes
   - File can be used to restore exact layout later

2. **Load Positions** (Blue Button)
   - Upload a previously saved `nodePositions.json` file
   - Automatically applies saved positions to matching nodes
   - Switches to fixed position mode to maintain layout

3. **Fix Positions / Enable Physics** (Purple/Orange Button)
   - **Fix Positions**: Locks all nodes in their current positions
   - **Enable Physics**: Allows nodes to move freely with force simulation
   - Button color and text change based on current mode

### Status Indicator
- **Dynamic Physics**: Nodes move freely based on force simulation
- **Fixed Positions**: Nodes are locked in place and won't move automatically

## Node Management Controls

### Control Panel
Below the position controls, there is a "Node Management" section. Click "Show" to expand it.

1. **Add New Node**
   - **Node ID**: Enter a unique identifier for the new node (e.g., "NewCharacter")
   - **Group**: Select a group number (1-10) for the new node. This determines its color.
   - **Add Node Button**: Creates the new node and adds it to the graph at a random initial position.

2. **Delete Node**
   - **Select node to delete**: Choose an existing node from the dropdown list. You can also click on a node in the 3D graph to select it.
   - **Delete Node Button**: Removes the selected node and all its associated links from the graph.

## Usage Workflow

### Saving Custom Layouts
1. Let the graph settle into a natural layout or manually drag nodes to desired positions
2. Click **"Fix Positions"** to lock the current arrangement
3. Click **"Save Positions"** to download the layout as a JSON file
4. The file will be saved as `nodePositions.json` in your downloads folder

### Loading Saved Layouts
1. Click **"Load Positions"** and select your saved `nodePositions.json` file
2. The graph will immediately apply the saved positions
3. Nodes will be automatically locked in fixed position mode
4. Use **"Enable Physics"** if you want to allow movement again

### Manual Positioning
1. Drag any node to a new position
2. The node will automatically be fixed in its new location
3. Use **"Save Positions"** to preserve your manual adjustments

### Adding Nodes
1. Expand the "Node Management" section.
2. Enter a unique ID for the new node in the "Node ID" field.
3. Select a "Group" for the new node.
4. Click the "Add Node" button.

### Deleting Nodes
1. Expand the "Node Management" section.
2. Select a node from the "Select node to delete" dropdown, or click on a node in the 3D graph to select it.
3. Click the "Delete Node" button.

## Technology Stack

- **React 19**: Modern React with hooks
- **react-force-graph-3d**: 3D force-directed graph visualization
- **three-spritetext**: Text labels in 3D space
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework

## Project Structure

```
force-graph-3d-app/
├── public/
│   └── datasets/
│       └── miserables.json    # Character network data
├── src/
│   ├── App.jsx               # Main application component
│   ├── App.css               # Application styles
│   └── main.jsx              # Entry point
└── package.json              # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- pnpm (or npm/yarn)

### Installation & Running

1. **Navigate to the project directory:**
   ```bash
   cd force-graph-3d-app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev --host
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:5173
   ```

### Controls

- **Mouse drag**: Rotate the view
- **Mouse wheel**: Zoom in/out
- **Right-click drag**: Pan the view
- **Hover over nodes**: See character names
- **Hover over links**: See relationship connections

## Data Format

### Character Network Data
The application loads character network data from `/public/datasets/miserables.json`. The data structure includes:

```json
{
  "nodes": [
    {"id": "CharacterName", "group": 1}
  ],
  "links": [
    {"source": "Character1", "target": "Character2", "value": 5}
  ]
}
```

- **nodes**: Characters with unique IDs and group classifications
- **links**: Relationships between characters with strength values

### Node Positions Data
The saved node positions file (`nodePositions.json`) follows this format:

```json
{
  "CharacterName": {
    "x": 100.5,
    "y": -50.2,
    "z": 25.8
  },
  "AnotherCharacter": {
    "x": -75.3,
    "y": 120.1,
    "z": -30.4
  }
}
```

- **Keys**: Character IDs that match the nodes in the graph data
- **Values**: 3D coordinates (x, y, z) as floating-point numbers
- **Missing characters**: Nodes not included in the file will use default physics positioning

## Customization

### Adding New Data
Replace the content of `/public/datasets/miserables.json` with your own network data following the same format.

### Styling
Modify the graph appearance by adjusting parameters in `App.jsx`:
- `nodeAutoColorBy`: Change node coloring scheme
- `linkThreeObject`: Customize link appearance
- `nodeLabel`: Modify node hover labels

### Graph Physics
Adjust force simulation parameters for different layouts and behaviors.

## Build for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Original Code Integration

This project successfully integrates the provided HTML/JavaScript code into a modern React application structure, maintaining all original functionality while adding:
- Proper React component architecture
- State management with hooks
- Error handling for data loading
- Responsive design principles
- Modern build tooling

## Troubleshooting

### General Issues
- **Graph not loading**: Check browser console for errors and ensure the JSON data file is accessible
- **Performance issues**: Consider reducing the dataset size for better performance on lower-end devices
- **3D rendering problems**: Ensure your browser supports WebGL

### Node Position Issues
- **Save button not working**: Ensure your browser allows file downloads and check for popup blockers
- **Load button not responding**: Verify the JSON file format matches the expected structure
- **Positions not applying**: Check that character IDs in the position file match those in the graph data
- **Nodes jumping after load**: This is normal - the graph applies saved positions and may need a moment to stabilize
- **Some nodes not positioned**: Only nodes with matching IDs in the position file will be positioned; others use default physics

### File Format Errors
- **JSON parsing errors**: Ensure the position file is valid JSON with proper syntax
- **Missing coordinates**: Each character entry must have x, y, and z values
- **Invalid numbers**: Coordinate values must be valid numbers (integers or floats)

## License

This project is open source and available under the MIT License.

