import { useEffect, useRef, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import SpriteText from 'three-spritetext'
import './App.css'

function App() {
  const graphRef = useRef()
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [nodePositions, setNodePositions] = useState({})
  const [useFixedPositions, setUseFixedPositions] = useState(false)
  
  // Node management states
  const [newNodeId, setNewNodeId] = useState('')
  const [newNodeGroup, setNewNodeGroup] = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState("")
  const [selectedNodeColor, setSelectedNodeColor] = useState("")
  const [selectedNodeTextSize, setSelectedNodeTextSize] = useState(0)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const [selectedLinkColor, setSelectedLinkColor] = useState("")
  const [selectedLinkThickness, setSelectedLinkThickness] = useState(0)
  const [sourceNodeId, setSourceNodeId] = useState("")
  const [targetNodeId, setTargetNodeId] = useState("")
  const [showNodeManager, setShowNodeManager] = useState(false)
  const [jsonFile, setJsonFile] = useState(null)

  useEffect(() => {
    if (jsonFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          setGraphData({
            nodes: data.nodes.map(node => ({ ...node, color: node.color || "#1A75FF", textSize: node.textSize || 6 })),
            links: data.links.map(link => ({ ...link, color: link.color || "#F0F0F0", thickness: link.thickness || 1 }))
          })
        } catch (error) {
          console.error("Error parsing JSON file:", error)
          alert("Error parsing JSON file. Please ensure it is valid JSON.")
        }
      }
      reader.readAsText(jsonFile)
    } else {
      setGraphData({ nodes: [], links: [] }) // Start with an empty graph
    }
  }, [jsonFile])

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Re-heat the simulation when graphData changes
      try {
        graphRef.current.d3Force("link").links(graphData.links)
        graphRef.current.d3Force("charge").nodes(graphData.nodes)
        graphRef.current.d3Force("alphaTarget", 0.3).restart()

        // Update node and link objects in the simulation to reflect property changes
        graphRef.current.graphData(graphData)
      } catch (error) {
        console.error("Error updating graph:", error)
      }
    }
  }, [graphData])

  const handleNewGraph = () => {
    setGraphData({ nodes: [], links: [] })
    setJsonFile(null) // Clear any loaded JSON file
    setSelectedNodeId("")
    setSelectedLinkId(null)
  }

  const addNode = () => {
    if (!newNodeId.trim()) {
      alert('Please enter a node ID')
      return
    }
    
    // Check if node already exists
    if (graphData.nodes.find(node => node.id === newNodeId.trim())) {
      alert('Node with this ID already exists')
      return
    }
    
    const newNode = {
      id: newNodeId.trim(),
      group: parseInt(newNodeGroup),
      color: "#1A75FF", // Default node color
      textSize: 6, // Default node text size
      x: Math.random() * 200 - 100, // Random position
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100
    }
    
    setGraphData(prevData => ({
      ...prevData,
      nodes: [...prevData.nodes, newNode]
    }))
    
    setNewNodeId('')
    console.log('Added node:', newNode)
  }

  // Delete selected node
  const deleteNode = () => {
    if (!selectedNodeId) {
      alert('Please select a node to delete')
      return
    }
    
    // Remove node and all associated links
    setGraphData(prevData => ({
      nodes: prevData.nodes.filter(node => node.id !== selectedNodeId),
      links: prevData.links.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
        const targetId = typeof link.target === 'object' ? link.target.id : link.target
        return sourceId !== selectedNodeId && targetId !== selectedNodeId
      })
    }))
    
    setSelectedNodeId('')
    console.log('Deleted node:', selectedNodeId)
  }

  // Add link between two nodes
  const addLink = (sourceId, targetId, value = 1) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    
    // Check if link already exists
    const linkExists = graphData.links.find(link => {
      const linkSourceId = typeof link.source === 'object' ? link.source.id : link.source
      const linkTargetId = typeof link.target === 'object' ? link.target.id : link.target
      return (linkSourceId === sourceId && linkTargetId === targetId) ||
             (linkSourceId === targetId && linkTargetId === sourceId)
    })
    
    if (linkExists) return
    
    const newLink = {
      source: sourceId,
      target: targetId,
      value: value,
      color: "#F0F0F0", // Default link color
      thickness: 1 // Default link thickness
    }
    
    setGraphData(prevData => ({
      ...prevData,
      links: [...prevData.links, newLink]
    }))
  }

  const saveGraphData = () => {
    if (!graphRef.current) return

    setGraphData(prevGraphData => {
      const dataToSave = {
        nodes: prevGraphData.nodes.map(node => {
          if (node.x === undefined || node.y === undefined || node.z === undefined) {
            return { ...node, x: 0, y: 0, z: 0, color: node.color || "#1A75FF", textSize: node.textSize || 6 }
          }
          return { ...node, color: node.color || "#1A75FF", textSize: node.textSize || 6 }
        }),
        links: prevGraphData.links.map(link => ({ ...link, color: link.color || "#F0F0F0", thickness: link.thickness || 1 })),
      }

      // Create downloadable JSON file
      const dataStr = JSON.stringify(dataToSave, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'graphData.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('Graph data saved:', dataToSave)
      return prevGraphData // Return the previous state as we are only saving, not modifying the state here
    })
  }

  // Load node positions from uploaded JSON file
  const loadNodePositions = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const positions = JSON.parse(e.target.result)
        setNodePositions(positions)
        
        // Apply positions to nodes
        const updatedNodes = graphData.nodes.map(node => {
          if (positions[node.id]) {
            return {
              ...node,
              x: positions[node.id].x,
              y: positions[node.id].y,
              z: positions[node.id].z,
              fx: positions[node.id].x, // Fix position
              fy: positions[node.id].y,
              fz: positions[node.id].z
            }
          }
          return node
        })
        
        setGraphData({ ...graphData, nodes: updatedNodes })
        setUseFixedPositions(true)
        console.log('Node positions loaded:', positions)
      } catch (error) {
        console.error('Error loading node positions:', error)
        alert('Error loading node positions file')
      }
    }
    reader.readAsText(file)
  }

  // Toggle between fixed and dynamic positioning
  const toggleFixedPositions = () => {
    const updatedNodes = graphData.nodes.map(node => {
      if (useFixedPositions) {
        // Remove fixed positions to allow dynamic movement
        const { fx, fy, fz, ...nodeWithoutFixed } = node
        return nodeWithoutFixed
      } else {
        // Fix current positions
        return {
          ...node,
          fx: node.x,
          fy: node.y,
          fz: node.z
        }
      }
    })
    
    setGraphData({ ...graphData, nodes: updatedNodes })
    setUseFixedPositions(!useFixedPositions)
  }

  // Helper function to safely get link source/target IDs
  const getLinkSourceId = (link) => {
    return typeof link.source === 'object' ? link.source.id : link.source
  }

  const getLinkTargetId = (link) => {
    return typeof link.target === 'object' ? link.target.id : link.target
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Graph Controls</h3>
        
        {/* Node Customization Controls */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ccc' }}>Node Customization</h4>
          <div style={{ marginBottom: '8px' }}>
            <select
              value={selectedNodeId}
              onChange={(e) => {
                const nodeId = e.target.value
                setSelectedNodeId(nodeId)
                const node = graphData.nodes.find(n => n.id === nodeId)
                if (node) {
                  setSelectedNodeColor(node.color || "#1A75FF")
                  setSelectedNodeTextSize(node.textSize || 6)
                }
              }}
              style={{
                width: '100%',
                padding: '4px 6px',
                borderRadius: '3px',
                border: '1px solid #555',
                background: '#333',
                color: 'white',
                fontSize: '11px',
                marginBottom: '8px'
              }}
            >
              <option value="">Select Node to Customize</option>
              {graphData.nodes.map(node => (
                <option key={node.id} value={node.id}>{node.id}</option>
              ))}
            </select>
          </div>
          {selectedNodeId && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', marginRight: '10px' }}>Color:</label>
                <input type="color" value={selectedNodeColor} onChange={(e) => {
                  setSelectedNodeColor(e.target.value)
                  setGraphData(prevData => ({
                    ...prevData,
                    nodes: prevData.nodes.map(node =>
                      node.id === selectedNodeId ? { ...node, color: e.target.value } : node
                    )
                  }))
                }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', marginRight: '10px' }}>Text Size:</label>
                <input type="range" min="1" max="20" value={selectedNodeTextSize} onChange={(e) => {
                  const size = parseInt(e.target.value)
                  setSelectedNodeTextSize(size)
                  setGraphData(prevData => ({
                    ...prevData,
                    nodes: prevData.nodes.map(node =>
                      node.id === selectedNodeId ? { ...node, textSize: size } : node
                    )
                  }))
                }} />
                <span style={{ fontSize: '12px', marginLeft: '5px' }}>{selectedNodeTextSize}</span>
              </div>
            </>
          )}
        </div>

        {/* Link Customization Controls */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ccc' }}>Link Customization</h4>
          <div style={{ marginBottom: '8px' }}>
            <select
              value={selectedLinkId ? `${getLinkSourceId(selectedLinkId)}-${getLinkTargetId(selectedLinkId)}` : ''}
              onChange={(e) => {
                if (!e.target.value) {
                  setSelectedLinkId(null)
                  return
                }
                const [sourceId, targetId] = e.target.value.split('-');
                const link = graphData.links.find(l => 
                  getLinkSourceId(l) === sourceId && getLinkTargetId(l) === targetId
                );
                setSelectedLinkId(link);
                if (link) {
                  setSelectedLinkColor(link.color || "#F0F0F0");
                  setSelectedLinkThickness(link.thickness || 1);
                }
              }}
              style={{
                width: '100%',
                padding: '4px 6px',
                borderRadius: '3px',
                border: '1px solid #555',
                background: '#333',
                color: 'white',
                fontSize: '11px',
                marginBottom: '8px'
              }}
            >
              <option value="">Select Link to Customize</option>
              {graphData.links.map((link, index) => (
                <option key={index} value={`${getLinkSourceId(link)}-${getLinkTargetId(link)}`}>
                  {`${getLinkSourceId(link)} - ${getLinkTargetId(link)}`}
                </option>
              ))}
            </select>
          </div>
          {selectedLinkId && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', marginRight: '10px' }}>Color:</label>
                <input type="color" value={selectedLinkColor} onChange={(e) => {
                  setSelectedLinkColor(e.target.value);
                  setGraphData(prevData => ({
                    ...prevData,
                    links: prevData.links.map(link =>
                      (getLinkSourceId(link) === getLinkSourceId(selectedLinkId) && 
                       getLinkTargetId(link) === getLinkTargetId(selectedLinkId))
                        ? { ...link, color: e.target.value } : link
                    )
                  }));
                }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', marginRight: '10px' }}>Thickness:</label>
                <input type="range" min="0.1" max="5" step="0.1" value={selectedLinkThickness} onChange={(e) => {
                  const thickness = parseFloat(e.target.value);
                  setSelectedLinkThickness(thickness);
                  setGraphData(prevData => ({
                    ...prevData,
                    links: prevData.links.map(link =>
                      (getLinkSourceId(link) === getLinkSourceId(selectedLinkId) && 
                       getLinkTargetId(link) === getLinkTargetId(selectedLinkId))
                        ? { ...link, thickness: thickness } : link
                    )
                  }));
                }} />
                <span style={{ fontSize: '12px', marginLeft: '5px' }}>{selectedLinkThickness}</span>
              </div>
            </>
          )}
        </div>

        {/* Data Loading Controls */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ccc' }}>Data Loading</h4>
          <label style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'block',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            Load Custom JSON
            <input
              type="file"
              accept=".json"
              onChange={(e) => setJsonFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleNewGraph}
            style={{
              background: '#FF5722',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'block',
              textAlign: 'center',
              width: '100%'
            }}
          >
            New Graph
          </button>
        </div>

        {/* Position Controls */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ccc' }}>Position Controls</h4>
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={saveGraphData}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
                fontSize: '12px'
              }}
            >
              Save Graph Data
            </button>
            
            <label style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Load Positions
              <input
                type="file"
                accept=".json"
                onChange={loadNodePositions}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <button
            onClick={toggleFixedPositions}
            style={{
              background: useFixedPositions ? '#FF9800' : '#607D8B',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%'
            }}
          >
            {useFixedPositions ? 'Enable Dynamic' : 'Fix Positions'}
          </button>
        </div>

        {/* Node Manager */}
        <div>
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => setShowNodeManager(!showNodeManager)}
              style={{
                background: '#9C27B0',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                width: '100%'
              }}
            >
              {showNodeManager ? 'Hide' : 'Show'} Node Manager
            </button>
          </div>
          
          {showNodeManager && (
            <div>
              {/* Add Node */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px', color: '#aaa' }}>Add New Node</div>
                <div style={{ marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Node ID"
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: '#333',
                      color: 'white',
                      fontSize: '11px',
                      marginRight: '8px'
                    }}
                  />
                  <select
                    value={newNodeGroup}
                    onChange={(e) => setNewNodeGroup(e.target.value)}
                    style={{
                      padding: '4px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: '#333',
                      color: 'white',
                      fontSize: '11px',
                      width: '60px'
                    }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(group => (
                      <option key={group} value={group}>Group {group}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addNode}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    width: '100%'
                  }}
                >
                  Add Node
                </button>
              </div>

              {/* Add Link */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px', color: '#aaa' }}>Add New Link</div>
                <div style={{ marginBottom: '8px' }}>
                  <select
                    value={sourceNodeId}
                    onChange={(e) => setSourceNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: '#333',
                      color: 'white',
                      fontSize: '11px',
                      marginBottom: '8px'
                    }}
                  >
                    <option value="">Select Source Node</option>
                    {graphData.nodes.map(node => (
                      <option key={node.id} value={node.id}>{node.id}</option>
                    ))}
                  </select>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: '#333',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >
                    <option value="">Select Target Node</option>
                    {graphData.nodes.map(node => (
                      <option key={node.id} value={node.id}>{node.id}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (sourceNodeId && targetNodeId) {
                      addLink(sourceNodeId, targetNodeId)
                      setSourceNodeId("")
                      setTargetNodeId("")
                    } else {
                      alert("Please select both source and target nodes.")
                    }
                  }}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    width: '100%'
                  }}
                >
                  Add Link
                </button>
              </div>

              {/* Delete Node */}
              <div>
                <div style={{ fontSize: '12px', marginBottom: '5px', color: '#aaa' }}>Delete Node</div>
                <div style={{ marginBottom: '8px' }}>
                  <select
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      border: '1px solid #555',
                      background: '#333',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  >
                    <option value="">Select node to delete</option>
                    {graphData.nodes.map(node => (
                      <option key={node.id} value={node.id}>{node.id}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={deleteNode}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    width: '100%'
                  }}
                >
                  Delete Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={node => node.color || "#1A75FF"}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          const sprite = new SpriteText(`${getLinkSourceId(link)} > ${getLinkTargetId(link)}`)
          sprite.color = link.color || "#F0F0F0"
          sprite.textHeight = 1.5
          return sprite
        }}
        linkWidth={link => link.thickness || 1}
        linkPositionUpdate={(sprite, { start, end }) => {
          const middlePos = Object.assign(...["x", "y", "z"].map(c => ({
            [c]: start[c] + (end[c] - start[c]) / 2
          })))
          Object.assign(sprite.position, middlePos)
        }}
        onNodeDragEnd={node => {
          node.fx = node.x
          node.fy = node.y
          node.fz = node.z
        }}
        onNodeClick={node => {
          setSelectedNodeId(node.id)
          setSelectedNodeColor(node.color || "#1A75FF")
          setSelectedNodeTextSize(node.textSize || 6)
          console.log("Selected node:", node.id)
        }}
        onLinkClick={link => {
          setSelectedLinkId(link)
          setSelectedLinkColor(link.color || "#F0F0F0")
          setSelectedLinkThickness(link.thickness || 1)
          console.log("Selected link:", link)
        }}
        nodeThreeObject={node => {
          const sprite = new SpriteText(node.id)
          sprite.material.depthWrite = false
          sprite.color = selectedNodeId === node.id ? "#ffff00" : (node.color || "#1A75FF")
          sprite.textHeight = selectedNodeId === node.id ? (node.textSize || 6) + 2 : (node.textSize || 6)
          return sprite
        }}
        backgroundColor="#000011"
      />
    </div>
  )
}

export default App
