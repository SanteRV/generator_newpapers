import React, { useState, useRef, useCallback, useEffect } from 'react'
import GridCells from './GridCells'
import GridItems from './GridItems'
import SelectionOverlay from './SelectionOverlay'

function GridVisualizer({ columns, rows, gap, gapMm, isNewspaperMode, elements, onAddElement, onUpdateElement, onDeleteElement, selectedElementId, onSelectElement }) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [draggedElement, setDraggedElement] = useState(null)
  const [resizingElement, setResizingElement] = useState(null)
  const [ghostPosition, setGhostPosition] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState(null)

  const gridCellsRef = useRef(null)
  const gridMainRef = useRef(null)

  // Verificar si una posición está ocupada
  const isPositionOccupied = useCallback((col, row, colSpan, rowSpan, excludeId = null) => {
    const endCol = col + colSpan - 1
    const endRow = row + rowSpan - 1

    for (const element of elements) {
      if (excludeId !== null && element.id === excludeId) {
        continue
      }

      const elemEndCol = element.column + element.columnSpan - 1
      const elemEndRow = element.row + element.rowSpan - 1

      const overlapX = !(endCol < element.column || col > elemEndCol)
      const overlapY = !(endRow < element.row || row > elemEndRow)

      if (overlapX && overlapY) {
        return true
      }
    }

    return false
  }, [elements])

  // Encontrar la posición válida más cercana
  const findNearestValidPosition = useCallback((targetCol, targetRow, colSpan, rowSpan, excludeId = null) => {
    if (!isPositionOccupied(targetCol, targetRow, colSpan, rowSpan, excludeId)) {
      return { col: targetCol, row: targetRow }
    }

    const maxDistance = Math.max(columns, rows)

    for (let distance = 1; distance <= maxDistance; distance++) {
      const positions = [
        { col: targetCol + distance, row: targetRow },
        { col: targetCol, row: targetRow + distance },
        { col: targetCol - distance, row: targetRow },
        { col: targetCol, row: targetRow - distance },
        { col: targetCol + distance, row: targetRow + distance },
        { col: targetCol - distance, row: targetRow + distance },
        { col: targetCol + distance, row: targetRow - distance },
        { col: targetCol - distance, row: targetRow - distance },
      ]

      for (const pos of positions) {
        if (pos.col >= 1 && pos.row >= 1 &&
            pos.col + colSpan - 1 <= columns &&
            pos.row + rowSpan - 1 <= rows) {
          if (!isPositionOccupied(pos.col, pos.row, colSpan, rowSpan, excludeId)) {
            return { col: pos.col, row: pos.row }
          }
        }
      }
    }

    return { col: targetCol, row: targetRow }
  }, [columns, rows, isPositionOccupied])

  // Obtener celda desde coordenadas
  const getCellFromPoint = useCallback((x, y) => {
    if (!gridCellsRef.current) return null

    const cells = gridCellsRef.current.querySelectorAll('.grid-cell')
    for (let cell of cells) {
      const rect = cell.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return {
          col: parseInt(cell.dataset.col),
          row: parseInt(cell.dataset.row),
          element: cell
        }
      }
    }
    return null
  }, [])

  // Obtener celda desde coordenadas usando cálculo directo
  const getCellFromPointCalculated = useCallback((x, y) => {
    if (!gridCellsRef.current) return null

    const gridRect = gridCellsRef.current.getBoundingClientRect()

    if (x < gridRect.left || x > gridRect.right || y < gridRect.top || y > gridRect.bottom) {
      x = Math.max(gridRect.left, Math.min(x, gridRect.right))
      y = Math.max(gridRect.top, Math.min(y, gridRect.bottom))
    }

    const relX = x - gridRect.left
    const relY = y - gridRect.top

    const totalGapX = gap * (columns - 1)
    const totalGapY = gap * (rows - 1)
    const cellWidth = (gridRect.width - totalGapX) / columns
    const cellHeight = (gridRect.height - totalGapY) / rows

    let col = 1
    let row = 1

    let accX = 0
    for (let c = 1; c <= columns; c++) {
      const cellCenter = accX + cellWidth / 2
      const cellEnd = accX + cellWidth

      if (relX <= cellCenter) {
        col = c
        break
      } else if (c < columns) {
        const gapEnd = cellEnd + gap
        if (relX < gapEnd - gap / 2) {
          col = c
          break
        } else if (relX < gapEnd) {
          col = c + 1
          break
        }
        accX = gapEnd
      } else {
        col = columns
      }
    }

    let accY = 0
    for (let r = 1; r <= rows; r++) {
      const cellCenter = accY + cellHeight / 2
      const cellEnd = accY + cellHeight

      if (relY <= cellCenter) {
        row = r
        break
      } else if (r < rows) {
        const gapEnd = cellEnd + gap
        if (relY < gapEnd - gap / 2) {
          row = r
          break
        } else if (relY < gapEnd) {
          row = r + 1
          break
        }
        accY = gapEnd
      } else {
        row = rows
      }
    }

    return {
      col: Math.max(1, Math.min(columns, col)),
      row: Math.max(1, Math.min(rows, row))
    }
  }, [columns, rows, gap])

  // Iniciar selección
  const handleSelectionStart = useCallback((e) => {
    if (e.target.closest('.grid-item')) {
      const item = e.target.closest('.grid-item')
      if (e.target.classList.contains('delete-btn')) {
        return
      }
      if (e.target.classList.contains('resize-handle')) {
        // El resize se maneja en GridItems
        return
      }

      const elementId = parseInt(item.dataset.id)
      const element = elements.find(el => el.id === elementId)

      if (element) {
        // Seleccionar el elemento
        if (onSelectElement) {
          onSelectElement(elementId)
        }
        
        const rect = item.getBoundingClientRect()
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
        setGhostPosition({
          col: element.column,
          row: element.row,
          colSpan: element.columnSpan,
          rowSpan: element.rowSpan
        })
        setDraggedElement({ element, elementId })
      }
      return
    }

    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return

    setIsSelecting(true)
    setSelectionStart({ col: cell.col, row: cell.row })
    setSelectionEnd({ col: cell.col, row: cell.row })
  }, [elements, getCellFromPoint])

  // Mover selección
  const handleSelectionMove = useCallback((e) => {
    if (resizingElement && resizeStart) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      if (!gridCellsRef.current) return

      const gridRect = gridCellsRef.current.getBoundingClientRect()
      const totalGapX = gap * (columns - 1)
      const totalGapY = gap * (rows - 1)
      const cellWidth = (gridRect.width - totalGapX) / columns
      const cellHeight = (gridRect.height - totalGapY) / rows

      const colChange = Math.round(deltaX / (cellWidth + gap))
      const rowChange = Math.round(deltaY / (cellHeight + gap))

      const maxColSpan = columns - resizingElement.column + 1
      const maxRowSpan = rows - resizingElement.row + 1

      const newColSpan = Math.max(1, Math.min(maxColSpan, resizeStart.colSpan + colChange))
      const newRowSpan = Math.max(1, Math.min(maxRowSpan, resizeStart.rowSpan + rowChange))

      // Validar que el nuevo tamaño no invada otras posiciones ocupadas
      const isOccupied = isPositionOccupied(
        resizingElement.column, 
        resizingElement.row, 
        newColSpan, 
        newRowSpan, 
        resizingElement.id
      )

      // Solo actualizar si no está ocupado
      if (!isOccupied) {
        onUpdateElement(resizingElement.id, {
          columnSpan: newColSpan,
          rowSpan: newRowSpan
        })
      }
      return
    }

    if (draggedElement) {
      const element = draggedElement.element
      const elementId = draggedElement.elementId

      if (!gridCellsRef.current) return

      const gridRect = gridCellsRef.current.getBoundingClientRect()
      const totalGapX = gap * (columns - 1)
      const totalGapY = gap * (rows - 1)
      const cellWidth = (gridRect.width - totalGapX) / columns
      const cellHeight = (gridRect.height - totalGapY) / rows

      const elementTopLeftX = e.clientX - dragOffset.x
      const elementTopLeftY = e.clientY - dragOffset.y

      const relX = elementTopLeftX - gridRect.left
      const relY = elementTopLeftY - gridRect.top

      let targetCol = 1
      let targetRow = 1

      let accX = 0
      for (let c = 1; c <= columns; c++) {
        const cellMid = accX + cellWidth / 2
        const cellEnd = accX + cellWidth

        if (relX < cellMid) {
          targetCol = c
          break
        } else if (c === columns) {
          targetCol = columns
        } else {
          accX = cellEnd + gap
        }
      }

      let accY = 0
      for (let r = 1; r <= rows; r++) {
        const cellMid = accY + cellHeight / 2
        const cellEnd = accY + cellHeight

        if (relY < cellMid) {
          targetRow = r
          break
        } else if (r === rows) {
          targetRow = rows
        } else {
          accY = cellEnd + gap
        }
      }

      if (targetCol + element.columnSpan - 1 > columns) {
        targetCol = columns - element.columnSpan + 1
      }
      if (targetRow + element.rowSpan - 1 > rows) {
        targetRow = rows - element.rowSpan + 1
      }

      targetCol = Math.max(1, targetCol)
      targetRow = Math.max(1, targetRow)

      // Validar si la posición objetivo está ocupada
      const isOccupied = isPositionOccupied(targetCol, targetRow, element.columnSpan, element.rowSpan, elementId)
      
      // Siempre actualizar la posición del ghost para mostrar el overlay
      // El overlay mostrará rojo si está ocupada
      setGhostPosition({
        col: targetCol,
        row: targetRow,
        colSpan: element.columnSpan,
        rowSpan: element.rowSpan,
        isOccupied: isOccupied
      })
      return
    }

    if (!isSelecting) return

    const cell = getCellFromPoint(e.clientX, e.clientY)
    if (!cell) return

    setSelectionEnd({ col: cell.col, row: cell.row })
  }, [draggedElement, resizingElement, resizeStart, dragOffset, gap, columns, rows, isSelecting, isPositionOccupied, findNearestValidPosition, getCellFromPoint, onUpdateElement])

  // Finalizar selección
  const handleSelectionEnd = useCallback((e) => {
    if (resizingElement) {
      setResizingElement(null)
      setResizeStart(null)
      return
    }

    if (draggedElement) {
      const element = draggedElement.element
      
      // Solo mover si la posición del ghost no está ocupada
      if (ghostPosition && !ghostPosition.isOccupied) {
        onUpdateElement(element.id, {
          column: ghostPosition.col,
          row: ghostPosition.row
        })
      }
      // Si está ocupada, no hacer nada (el elemento permanece en su posición original)

      setDraggedElement(null)
      setGhostPosition(null)
      return
    }

    if (!isSelecting) return

    setIsSelecting(false)

    if (!selectionStart || !selectionEnd) return

    const minCol = Math.min(selectionStart.col, selectionEnd.col)
    const maxCol = Math.max(selectionStart.col, selectionEnd.col)
    const minRow = Math.min(selectionStart.row, selectionEnd.row)
    const maxRow = Math.max(selectionStart.row, selectionEnd.row)

    const colSpan = maxCol - minCol + 1
    const rowSpan = maxRow - minRow + 1

    // Validar si la posición seleccionada está ocupada
    // Si está ocupada, NO crear el elemento (cancelar la acción)
    if (!isPositionOccupied(minCol, minRow, colSpan, rowSpan)) {
      onAddElement({
        column: minCol,
        row: minRow,
        columnSpan: colSpan,
        rowSpan: rowSpan
      })
    }
    // Si está ocupada, simplemente no hacer nada (cancelar la creación)

    setSelectionStart(null)
    setSelectionEnd(null)
  }, [draggedElement, resizingElement, isSelecting, selectionStart, selectionEnd, ghostPosition, isPositionOccupied, onAddElement, onUpdateElement])

  // Cancelar selección
  const handleSelectionCancel = useCallback(() => {
    if (resizingElement) {
      setResizingElement(null)
      setResizeStart(null)
      return
    }

    if (draggedElement) {
      // Al cancelar, simplemente limpiar el estado sin mover el elemento
      setDraggedElement(null)
      setGhostPosition(null)
      return
    }

    if (isSelecting) {
      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }, [draggedElement, resizingElement, isSelecting, ghostPosition, onUpdateElement])

  // Event listeners globales para mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleSelectionMove(e)
    }

    const handleMouseUp = (e) => {
      handleSelectionEnd(e)
    }

    if (isSelecting || draggedElement || resizingElement) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isSelecting, draggedElement, resizingElement, handleSelectionMove, handleSelectionEnd])

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, minmax(50px, 1fr))`,
    gap: `${gap}px`
  }

  return (
    <div className="grid-wrapper">
      <div 
        className="grid-main" 
        ref={gridMainRef}
        onMouseDown={handleSelectionStart}
        onMouseLeave={handleSelectionCancel}
      >
        <GridCells
          ref={gridCellsRef}
          columns={columns}
          rows={rows}
          style={gridStyle}
        />
        <GridItems
          columns={columns}
          rows={rows}
          gap={gap}
          isNewspaperMode={isNewspaperMode}
          elements={elements}
          draggedElement={draggedElement}
          dragOffset={dragOffset}
          selectedElementId={selectedElementId}
          onDeleteElement={onDeleteElement}
          onUpdateElement={onUpdateElement}
          onResizeStart={(e, element) => {
            setResizingElement(element)
            setResizeStart({
              x: e.clientX,
              y: e.clientY,
              colSpan: element.columnSpan,
              rowSpan: element.rowSpan
            })
          }}
          style={gridStyle}
        />
        <SelectionOverlay
          isSelecting={isSelecting}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          ghostPosition={ghostPosition}
          isPositionOccupied={isPositionOccupied}
          draggedElement={draggedElement}
          style={gridStyle}
        />
      </div>
    </div>
  )
}

export default GridVisualizer
