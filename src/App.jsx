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

  // Load JSON graph
  useEffect(() => {
    if (jsonFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)

          // Ensure defaults
          const nodes = data.nodes.map(node => ({
            ...node,
            color: node.color || "#1A75FF",
            textSize: node.textSize || 6
          }))

          // Map node ids → node objects
          const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

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
      setGraphData({ nodes: [], links: [] }) // empty graph
    }
  }, [jsonFile])

  // Refresh simulation when data changes
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
    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }))
    setNewNodeId('')
  }

  const deleteNode = () => {
    if (!selectedNodeId) {
      alert('Please select a node to delete')
      return
    }
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
      links: prev.links.filter(l => 
        l.source.id !== selectedNodeId &&
        l.target.id !== selectedNodeId &&
        l.source !== selectedNodeId &&
        l.target !== selectedNodeId
      )
    }))
    setSelectedNodeId('')
  }

  const addLink = (sourceId, targetId, value = 1) => {
    if (!sourceId || !targetId || sourceId === targetId) return

    const linkExists = graphData.links.find(link => 
      (link.source.id === sourceId && link.target.id === targetId) ||
      (link.source.id === targetId && link.target.id === sourceId) ||
      (link.source === sourceId && link.target === targetId) ||
      (link.source === targetId && link.target === sourceId)
    )
    if (linkExists) return

    const sourceNode = graphData.nodes.find(n => n.id === sourceId)
    const targetNode = graphData.nodes.find(n => n.id === targetId)
    if (!sourceNode || !targetNode) return

    const newLink = {
      source: sourceNode,
      target: targetNode,
      value,
      color: "#F0F0F0",
      thickness: 1
    }
    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }))
  }

  const saveGraphData = () => {
    if (!graphRef.current) return
    setGraphData(prev => {
      const dataToSave = {
        nodes: prev.nodes.map(n => ({
          id: n.id,
          group: n.group,
          x: n.x ?? 0,
          y: n.y ?? 0,
          z: n.z ?? 0,
          color: n.color || "#1A75FF",
          textSize: n.textSize || 6
        })),
        links: prev.links.map(l => ({
          source: typeof l.source === 'object' ? l.source.id : l.source,
          target: typeof l.target === 'object' ? l.target.id : l.target,
          color: l.color || "#F0F0F0",
          thickness: l.thickness || 1
        }))
      }
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'graphData.json'
      a.click()
      URL.revokeObjectURL(url)
      return prev
    })
  }

  const loadNodePositions = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const positions = JSON.parse(evt.target.result)
        setNodePositions(positions)
        const updatedNodes = graphData.nodes.map(node => {
          if (positions[node.id]) {
            return {
              ...node,
              x: positions[node.id].x,
              y: positions[node.id].y,
              z: positions[node.id].z,
              fx: positions[node.id].x,
              fy: positions[node.id].y,
              fz: positions[node.id].z
            }
          }
          return node
        })
        setGraphData({ ...graphData, nodes: updatedNodes })
        setUseFixedPositions(true)
      } catch (err) {
        alert("Error loading node positions file")
      }
    }
    reader.readAsText(file)
  }

  const toggleFixedPositions = () => {
    const updatedNodes = graphData.nodes.map(node => {
      if (useFixedPositions) {
        const { fx, fy, fz, ...rest } = node
        return rest
      } else {
        return { ...node, fx: node.x, fy: node.y, fz: node.z }
      }
    })
    setGraphData({ ...graphData, nodes: updatedNodes })
    setUseFixedPositions(!useFixedPositions)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      {/* Control Panel ... keep your UI unchanged (omitted here for brevity) */}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={n => n.color || "#1A75FF"}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          const sprite = new SpriteText(`${link.source.id} > ${link.target.id}`)
          sprite.color = link.color || "#F0F0F0"
          sprite.textHeight = 1.5
          return sprite
        }}
        linkWidth={l => l.thickness || 1}
        linkPositionUpdate={(sprite, { start, end }) => {
          const middle = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2,
            z: start.z + (end.z - start.z) / 2
          }
          Object.assign(sprite.position, middle)
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
        }}
        onLinkClick={link => {
          setSelectedLinkId(link)
          setSelectedLinkColor(link.color || "#F0F0F0")
          setSelectedLinkThickness(link.thickness || 1)
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
