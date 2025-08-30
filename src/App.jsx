import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import './App.css';

function App() {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [nodePositions, setNodePositions] = useState({});
  const [useFixedPositions, setUseFixedPositions] = useState(false);

  // Node management states
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeGroup, setNewNodeGroup] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedNodeColor, setSelectedNodeColor] = useState('');
  const [selectedNodeTextSize, setSelectedNodeTextSize] = useState(0);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [selectedLinkColor, setSelectedLinkColor] = useState('');
  const [selectedLinkThickness, setSelectedLinkThickness] = useState(0);
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [showNodeManager, setShowNodeManager] = useState(false);
  const [jsonFile, setJsonFile] = useState(null);

  // Load JSON file
  useEffect(() => {
    if (jsonFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // Normalize nodes
          const nodes = data.nodes.map(node => ({
            ...node,
            color: node.color || '#1A75FF',
            textSize: node.textSize || 6,
          }));

          // Build a lookup map
          const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

          // Normalize links
          const links = data.links.map(link => {
            const srcId = typeof link.source === 'object' ? link.source.id : link.source;
            const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
            return {
              ...link,
              source: nodeMap[srcId],
              target: nodeMap[tgtId],
              color: link.color || '#F0F0F0',
              thickness: link.thickness || 1,
            };
          });

          setGraphData({ nodes, links });
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Error parsing JSON file. Please ensure it is valid JSON.');
        }
      };
      reader.readAsText(jsonFile);
    } else {
      setGraphData({ nodes: [], links: [] });
    }
  }, [jsonFile]);

  // Refresh simulation when graphData changes
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('link').links(graphData.links);
      graphRef.current.d3Force('charge').nodes(graphData.nodes);
      graphRef.current.d3Force('alphaTarget', 0.3).restart();
      graphRef.current.graphData(graphData);
    }
  }, [graphData]);

  const handleNewGraph = () => {
    setGraphData({ nodes: [], links: [] });
    setJsonFile(null);
    setSelectedNodeId('');
    setSelectedLinkId(null);
  };

  // Add node
  const addNode = () => {
    if (!newNodeId.trim()) {
      alert('Please enter a node ID');
      return;
    }
    if (graphData.nodes.find(node => node.id === newNodeId.trim())) {
      alert('Node with this ID already exists');
      return;
    }

    const newNode = {
      id: newNodeId.trim(),
      group: parseInt(newNodeGroup),
      color: '#1A75FF',
      textSize: 6,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100,
    };

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setNewNodeId('');
  };

  // Delete node
  const deleteNode = () => {
    if (!selectedNodeId) {
      alert('Please select a node to delete');
      return;
    }

    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
      links: prev.links.filter(l =>
        (typeof l.source === 'object' ? l.source.id : l.source) !== selectedNodeId &&
        (typeof l.target === 'object' ? l.target.id : l.target) !== selectedNodeId
      ),
    }));

    setSelectedNodeId('');
  };

  // Add link
  const addLink = (sourceId, targetId, value = 1) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const linkExists = graphData.links.find(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
    });
    if (linkExists) return;

    const newLink = {
      source: sourceId,
      target: targetId,
      value,
      color: '#F0F0F0',
      thickness: 1,
    };

    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink],
    }));
  };

  // Save JSON
  const saveGraphData = () => {
    const cleanData = {
      nodes: graphData.nodes.map(({ id, color, textSize, group, x, y, z }) => ({
        id, color, textSize, group, x, y, z,
      })),
      links: graphData.links.map(({ source, target, color, thickness }) => ({
        source: typeof source === 'object' ? source.id : source,
        target: typeof target === 'object' ? target.id : target,
        color, thickness,
      })),
    };

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graphData.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load positions
  const loadNodePositions = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const positions = JSON.parse(e.target.result);
        setNodePositions(positions);

        const updatedNodes = graphData.nodes.map(node => {
          if (positions[node.id]) {
            return {
              ...node,
              x: positions[node.id].x,
              y: positions[node.id].y,
              z: positions[node.id].z,
              fx: positions[node.id].x,
              fy: positions[node.id].y,
              fz: positions[node.id].z,
            };
          }
          return node;
        });

        setGraphData({ ...graphData, nodes: updatedNodes });
        setUseFixedPositions(true);
      } catch {
        alert('Error loading node positions file');
      }
    };
    reader.readAsText(file);
  };

  const toggleFixedPositions = () => {
    const updatedNodes = graphData.nodes.map(node => {
      if (useFixedPositions) {
        const { fx, fy, fz, ...rest } = node;
        return rest;
      } else {
        return { ...node, fx: node.x, fy: node.y, fz: node.z };
      }
    });
    setGraphData({ ...graphData, nodes: updatedNodes });
    setUseFixedPositions(!useFixedPositions);
  };

  const updateLinkPositions = useCallback(() => {
    if (!graphRef.current) return;

    const threeScene = graphRef.current.scene();
    if (!threeScene) return;

    graphData.links.forEach(link => {
      const sourceNode = link.source;
      const targetNode = link.target;

      if (sourceNode && targetNode && sourceNode.x !== undefined && sourceNode.y !== undefined && sourceNode.z !== undefined &&
          targetNode.x !== undefined && targetNode.y !== undefined && targetNode.z !== undefined) {

        // Get the Three.js object for the link (if it's a default line object)
        // This part is tricky as react-force-graph-3d doesn't expose link Three.js objects directly for default links.
        // If you're using linkThreeObject to render custom objects, you'd access them here.
        // For default lines, we might need to iterate through scene children or rely on internal updates.

        // A more robust way for default links is to force a re-render of the graph
        // by updating the graphData, which we are already doing in onNodeDrag.
        // However, if the issue persists, it means the internal rendering isn't picking up the changes.

        // For now, let's ensure the link sprite (if any) is updated.
        // The actual line geometry update is handled by the library's internal D3-force integration.
        // If the lines are not updating, it implies the D3-force simulation is not being re-evaluated correctly.

        // Let's try to manually update the positions of the link's Three.js object if it exists.
        // This requires knowing how react-force-graph-3d names/stores its internal link objects.
        // Without direct access, forcing a simulation restart is the primary mechanism.

        // Since direct manipulation of default link Three.js objects is not straightforward
        // without diving deep into the library's internals, let's re-focus on ensuring
        // the D3-force simulation is correctly updating the link positions.

        // The problem might be that the simulation is not 'ticking' enough or fast enough
        // after a node drag to update the link positions.

        // Let's try to trigger a tick manually after the drag.
        // This is already attempted with restart(), but let's be more explicit.

        // If link lines are still disconnected, it implies the library's internal rendering
        // of default links is not reacting to the node position changes as expected.
        // In such a scenario, the most reliable solution is to render custom links
        // using linkThreeObject and manually update their geometry.

        // For now, let's ensure the simulation is always restarted after a drag.
        // The previous code already does this in onNodeDragEnd.

        // Given the persistent issue, the most direct solution is to use `linkThreeObject`
        // to render custom lines and update their geometry manually.

        // This will require importing THREE and creating a Line object.

        // This is a more advanced solution, but it gives full control over link rendering.

        // For the current problem, where the default links are not updating, it's likely
        // due to the internal D3-force simulation not propagating changes to the link rendering.

        // Let's try to force a re-render of the entire graph by changing the key prop.
        // This is a common React pattern to force component re-mount/re-render.
        // However, this can be performance intensive for large graphs.

        // The most direct way to ensure links follow nodes is to update their positions
        // within the D3-force simulation and then ensure the rendering reflects that.

        // Let's try to use `linkThreeObject` to draw a simple line and update its geometry.
        // This gives us full control over the link's visual representation.

        // First, ensure THREE is imported.
        // import * as THREE from 'three'; // Already done at the top

        // Modify linkThreeObject and linkPositionUpdate

      }
    });
  }, [graphData]);

  const onNodeDragEnd = useCallback(node => {
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
    // Explicitly restart the simulation to re-evaluate link positions
    if (graphRef.current) {
      graphRef.current.d3Force('alphaTarget', 0.3).restart();
    }
  }, []);

  const onNodeDrag = useCallback((node, translate) => {
    // Update node's position in graphData during drag
    const newNodes = graphData.nodes.map(n =>
      n.id === node.id ? { ...n, x: node.x, y: node.y, z: node.z } : n
    );
    setGraphData(prev => ({ ...prev, nodes: newNodes }));
  }, [graphData]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      {/* Control panel omitted for brevity (use your existing one) */}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={node => node.color || '#1A75FF'}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          // Create a custom Three.js Line object for the link
          const material = new THREE.LineBasicMaterial({ color: link.color || '#F0F0F0', transparent: true, opacity: 0.6 });
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); // 2 points * 3 coords (x,y,z)
          const line = new THREE.Line(geometry, material);

          // Add the text sprite to the line object
          const sprite = new SpriteText(
            `${typeof link.source === 'object' ? link.source.id : link.source} > ${typeof link.target === 'object' ? link.target.id : link.target}`
          );
          sprite.color = link.color || '#F0F0F0';
          sprite.textHeight = 1.5;
          line.add(sprite);

          return line;
        }}
        linkPositionUpdate={(threeObject, { start, end }) => {
          // Update the line geometry
          const positions = threeObject.geometry.attributes.position.array;
          positions[0] = start.x;
          positions[1] = start.y;
          positions[2] = start.z;
          positions[3] = end.x;
          positions[4] = end.y;
          positions[5] = end.z;
          threeObject.geometry.attributes.position.needsUpdate = true;

          // Update the text sprite position
          const sprite = threeObject.children[0];
          if (sprite) {
            const middlePos = Object.assign({}, ...['x', 'y', 'z'].map(c => ({
              [c]: start[c] + (end[c] - start[c]) / 2
            })));
            Object.assign(sprite.position, middlePos);
          }
        }}
        onNodeDrag={onNodeDrag}
        onNodeDragEnd={onNodeDragEnd}
        onNodeClick={node => {
          setSelectedNodeId(node.id);
          setSelectedNodeColor(node.color || '#1A75FF');
          setSelectedNodeTextSize(node.textSize || 6);
        }}
        onLinkClick={link => {
          setSelectedLinkId(link);
          setSelectedLinkColor(link.color || '#F0F0F0');
          setSelectedLinkThickness(link.thickness || 1);
        }}
        nodeThreeObject={node => {
          const sprite = new SpriteText(node.id);
          sprite.material.depthWrite = false;
          sprite.color = selectedNodeId === node.id ? '#ffff00' : (node.color || '#1A75FF');
          sprite.textHeight = selectedNodeId === node.id ? (node.textSize || 6) + 2 : (node.textSize || 6);
          return sprite;
        }}
        key={JSON.stringify(graphData)}
      />
    </div>
  );
}

export default App;


