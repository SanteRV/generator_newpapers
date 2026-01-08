import React, { useState, useCallback, useRef, useEffect } from 'react'
import Controls from './components/Controls'
import GridVisualizer from './components/GridVisualizer'
import CodePanel from './components/CodePanel'
import TemplatesPanel from './components/TemplatesPanel'
import { calculateColumns, calculateRows, NEWSPAPER_CONFIG, mmToPx } from './utils/newspaperConfig'

function App() {
  // Modo periódico: calcular dimensiones automáticamente
  const initialColumns = calculateColumns()
  const initialRows = calculateRows()
  const initialGapMm = NEWSPAPER_CONFIG.columnGap
  
  const [columns, setColumns] = useState(initialColumns)
  const [rows, setRows] = useState(initialRows)
  const [gap, setGap] = useState(initialGapMm) // Ahora en mm
  const [elements, setElements] = useState([])
  const [elementCounter, setElementCounter] = useState(1)
  const [showCode, setShowCode] = useState(false)
  const [activeTab, setActiveTab] = useState('html')
  const [isNewspaperMode, setIsNewspaperMode] = useState(true)
  const [selectedElementId, setSelectedElementId] = useState(null)

  const updateGrid = useCallback(() => {
    // Filtrar elementos que están completamente fuera del grid
    setElements(prev => {
      const filtered = prev.filter(el => {
        return el.column <= columns && el.row <= rows
      })

      // Ajustar posición si está fuera, pero mantener el tamaño
      return filtered.map(el => {
        let newColumn = el.column
        let newRow = el.row

        if (el.column + el.columnSpan - 1 > columns) {
          newColumn = Math.max(1, columns - el.columnSpan + 1)
        }
        if (el.row + el.rowSpan - 1 > rows) {
          newRow = Math.max(1, rows - el.rowSpan + 1)
        }

        return {
          ...el,
          column: newColumn,
          row: newRow
        }
      })
    })
  }, [columns, rows])

  useEffect(() => {
    updateGrid()
  }, [columns, rows, updateGrid])

  const handleAddElement = useCallback((newElement) => {
    setElements(prev => [...prev, { ...newElement, id: elementCounter, text: '', color: '#ffffff' }])
    setElementCounter(prev => prev + 1)
  }, [elementCounter])

  const handleUpdateElement = useCallback((id, updates) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }, [])

  const handleDeleteElement = useCallback((id) => {
    setElements(prev => prev.filter(el => el.id !== id))
  }, [])

  const handleLoadTemplate = useCallback((templateData) => {
    setColumns(templateData.columns)
    setRows(templateData.rows)
    setGap(templateData.gap)
    setIsNewspaperMode(templateData.isNewspaperMode !== undefined ? templateData.isNewspaperMode : true)
    setElements((templateData.elements || []).map(el => ({
      ...el,
      color: el.color || '#ffffff'
    })))
    // Ajustar el contador para evitar conflictos de IDs
    if (templateData.elements && templateData.elements.length > 0) {
      const maxId = Math.max(...templateData.elements.map(el => el.id))
      setElementCounter(maxId + 1)
    } else {
      setElementCounter(1)
    }
  }, [])

  const getCurrentTemplate = useCallback(() => {
    return {
      columns,
      rows,
      gap,
      isNewspaperMode,
      elements: elements.map(el => ({
        id: el.id,
        column: el.column,
        row: el.row,
        columnSpan: el.columnSpan,
        rowSpan: el.rowSpan,
        text: el.text || '',
        color: el.color || '#ffffff'
      }))
    }
  }, [columns, rows, gap, elements, isNewspaperMode])
  
  // Calcular gap en px para visualización
  const gapPx = isNewspaperMode ? mmToPx(gap) : gap

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="container">
          <div className="header-actions">
            <p className="instruction-text">
              Finalmente, copia el código HTML y CSS generado y pégalo en tu proyecto.
            </p>
            <span className="templates-label">Plantillas</span>
          </div>

          <Controls
            columns={columns}
            rows={rows}
            gap={gap}
            isNewspaperMode={isNewspaperMode}
            onColumnsChange={setColumns}
            onRowsChange={setRows}
            onGapChange={setGap}
          />

          <GridVisualizer
            columns={columns}
            rows={rows}
            gap={gapPx}
            gapMm={gap}
            isNewspaperMode={isNewspaperMode}
            elements={elements}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
          />

          <CodePanel
            showCode={showCode}
            activeTab={activeTab}
            columns={columns}
            rows={rows}
            gap={gap}
            isNewspaperMode={isNewspaperMode}
            elements={elements}
            onToggleCode={() => setShowCode(prev => !prev)}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <TemplatesPanel
        onLoadTemplate={handleLoadTemplate}
        currentTemplate={getCurrentTemplate()}
        selectedElementId={selectedElementId}
        onUpdateElement={handleUpdateElement}
      />
    </div>
  )
}

export default App
