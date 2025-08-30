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

  // --- FIXED JSON LOADER ---
  useEffect(() => {
    if (jsonFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)

          // Ensure nodes have defaults
          const nodes = data.nodes.map(node => ({
            ...node,
            color: node.color || "#1A75FF",
            textSize: node.textSize || 6
          }))

          // Build a lookup table (id -> node object)
          const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

          // Resolve link source/target into node objects
          const links = data.links.map(link => ({
            ...link,
            source: nodeMap[link.source] || link.source,
            target: nodeMap[link.target] || link.target,
            color: link.color || "#F0F0F0",
            thickness: link.thickness || 1
          }))

          setGraphData({ nodes, links })
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
    if (graphRef.current) {
      graphRef.current.d3Force("link").links(graphData.links)
      graphRef.current.d3Force("charge").nodes(graphData.nodes)
      graphRef.current.d3Force("alphaTarget", 0.3).restart()
      graphRef.current.graphData(graphData)
    }
  }, [graphData])

  const handleNewGraph = () => {
    setGraphData({ nodes: [], links: [] })
    setJsonFile(null)
    setSelectedNodeId("")
    setSelectedLinkId(null)
  }

  const addNode = () => {
    if (!newNodeId.trim()) {
      alert('Please enter a node ID')
      return
    }
    if (graphData.nodes.find(node => node.id === newNodeId.trim())) {
      alert('Node with this ID already exists')
      return
    }
    const newNode = {
      id: newNodeId.trim(),
      group: parseInt(newNodeGroup),
      color: "#1A75FF",
      textSize: 6,
      x: Math.random() * 200 - 100,
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

  const deleteNode = () => {
    if (!selectedNodeId) {
      alert('Please select a node to delete')
      return
    }
    setGraphData(prevData => ({
      nodes: prevData.nodes.filter(node => node.id !== selectedNodeId),
      links: prevData.links.filter(link => 
        (link.source.id || link.source) !== selectedNodeId &&
        (link.target.id || link.target) !== selectedNodeId
      )
    }))
    setSelectedNodeId('')
    console.log('Deleted node:', selectedNodeId)
  }

  const addLink = (sourceId, targetId, value = 1) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    const linkExists = graphData.links.find(link => 
      ((link.source.id || link.source) === sourceId && (link.target.id || link.target) === targetId) ||
      ((link.source.id || link.source) === targetId && (link.target.id || link.target) === sourceId)
    )
    if (linkExists) return

    const newLink = {
      source: sourceId,
      target: targetId,
      value,
      color: "#F0F0F0",
      thickness: 1
    }
    setGraphData(prevData => ({
      ...prevData,
      links: [...prevData.links, newLink]
    }))
  }

  // --- SAVE CLEAN JSON ---
  const saveGraphData = () => {
    if (!graphRef.current) return
    const cleanData = {
      nodes: graphData.nodes.map(({ id, group, color, textSize, x, y, z }) => ({
        id, group, color, textSize, x, y, z
      })),
      links: graphData.links.map(({ source, target, color, thickness }) => ({
        source: typeof source === "object" ? source.id : source,
        target: typeof target === "object" ? target.id : target,
        color, thickness
      }))
    }
    const dataStr = JSON.stringify(cleanData, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = 'graphData.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    console.log('Graph data saved:', cleanData)
  }

  // ... (rest of your UI & controls remain unchanged)

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      {/* Control panel and node/link management UI stays the same */}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={node => node.color || "#1A75FF"}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          const sprite = new SpriteText(`${(link.source.id || link.source)} > ${(link.target.id || link.target)}`)
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
        key={JSON.stringify(graphData)}
      />
    </div>
  )
}

export default App
