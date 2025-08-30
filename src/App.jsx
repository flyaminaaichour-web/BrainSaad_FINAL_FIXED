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

  // Load JSON file
  useEffect(() => {
    if (jsonFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)

          // Normalize nodes
          const nodes = data.nodes.map(node => ({
            ...node,
            color: node.color || "#1A75FF",
            textSize: node.textSize || 6
          }))

          // Build a lookup map
          const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

          // Normalize links
          const links = data.links.map(link => {
            const srcId = typeof link.source === "object" ? link.source.id : link.source
            const tgtId = typeof link.target === "object" ? link.target.id : link.target
            return {
              ...link,
              source: nodeMap[srcId],
              target: nodeMap[tgtId],
              color: link.color || "#F0F0F0",
              thickness: link.thickness || 1
            }
          })

          setGraphData({ nodes, links })
        } catch (error) {
          console.error("Error parsing JSON file:", error)
          alert("Error parsing JSON file. Please ensure it is valid JSON.")
        }
      }
      reader.readAsText(jsonFile)
    } else {
      setGraphData({ nodes: [], links: [] })
    }
  }, [jsonFile])

  // Refresh simulation when graphData changes
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

  // Add node
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

  // Delete node
  const deleteNode = () => {
    if (!selectedNodeId) {
      alert('Please select a node to delete')
      return
    }

    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
      links: prev.links.filter(l =>
        (typeof l.source === "object" ? l.source.id : l.source) !== selectedNodeId &&
        (typeof l.target === "object" ? l.target.id : l.target) !== selectedNodeId
      )
    }))

    setSelectedNodeId('')
  }

  // Add link
  const addLink = (sourceId, targetId, value = 1) => {
    if (!sourceId || !targetId || sourceId === targetId) return

    const linkExists = graphData.links.find(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source
      const t = typeof l.target === "object" ? l.target.id : l.target
      return (s === sourceId && t === targetId) || (s === targetId && t === sourceId)
    })
    if (linkExists) return

    const newLink = {
      source: sourceId,
      target: targetId,
      value,
      color: "#F0F0F0",
      thickness: 1
    }

    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }))
  }

  // Save JSON
  const saveGraphData = () => {
    const cleanData = {
      nodes: graphData.nodes.map(({ id, color, textSize, group, x, y, z }) => ({
        id, color, textSize, group, x, y, z
      })),
      links: graphData.links.map(({ source, target, color, thickness }) => ({
        source: typeof source === "object" ? source.id : source,
        target: typeof target === "object" ? target.id : target,
        color, thickness
      }))
    }

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'graphData.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Load positions
  const loadNodePositions = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const positions = JSON.parse(e.target.result)
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
      } catch {
        alert('Error loading node positions file')
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
      {/* Control panel omitted for brevity (use your existing one) */}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={node => node.color || "#1A75FF"}
        linkThreeObjectExtend={true}
        linkThreeObject={link => {
          const sprite = new SpriteText(
            `${typeof link.source === "object" ? link.source.id : link.source} > ${typeof link.target === "object" ? link.target.id : link.target}`
          )
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
