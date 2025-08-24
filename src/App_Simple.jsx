import { useEffect, useRef, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import SpriteText from 'three-spritetext'
import './App.css'

function App() {
  const graphRef = useRef()
  const [graphData, setGraphData] = useState({ 
    nodes: [
      { id: 'Node1', group: 1, color: '#1A75FF' },
      { id: 'Node2', group: 2, color: '#FF5722' },
      { id: 'Node3', group: 1, color: '#4CAF50' }
    ], 
    links: [
      { source: 'Node1', target: 'Node2', value: 1 },
      { source: 'Node2', target: 'Node3', value: 1 }
    ] 
  })

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, position: 'relative' }}>
      {/* Simple Control Panel */}
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
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>3D Force Graph</h3>
        <p style={{ margin: 0, fontSize: '12px' }}>
          Nodes: {graphData.nodes.length} | Links: {graphData.links.length}
        </p>
      </div>

      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="id"
        nodeAutoColorBy="group"
        nodeColor={node => node.color || "#1A75FF"}
        nodeThreeObject={node => {
          const sprite = new SpriteText(node.id)
          sprite.material.depthWrite = false
          sprite.color = node.color || "#1A75FF"
          sprite.textHeight = 8
          return sprite
        }}
        linkColor={() => "#F0F0F0"}
        linkWidth={2}
        backgroundColor="#000011"
      />
    </div>
  )
}

export default App

