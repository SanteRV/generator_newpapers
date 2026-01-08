import React, { useEffect, useRef } from 'react'
import { DEFAULT_COLOR } from '../utils/colors'

function GridItems({ elements, draggedElement, dragOffset, onDeleteElement, onResizeStart, onUpdateElement, selectedElementId, columns, rows, gap, isNewspaperMode, style }) {
  const itemRefs = useRef({})
  const dragDimensionsRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    if (draggedElement) {
      const elementId = draggedElement.elementId
      const item = itemRefs.current[elementId]
      if (item) {
        const element = draggedElement.element
        
        // Capturar dimensiones ANTES de cambiar a position: fixed
        const rect = item.getBoundingClientRect()
        const originalWidth = rect.width
        const originalHeight = rect.height
        
        // Guardar dimensiones para uso posterior
        dragDimensionsRef.current = {
          width: originalWidth,
          height: originalHeight
        }
        
        // Aplicar estilos de dragging
        item.classList.add('dragging')
        item.style.position = 'fixed'
        item.style.left = `${rect.left}px`
        item.style.top = `${rect.top}px`
        item.style.width = `${originalWidth}px`
        item.style.height = `${originalHeight}px`
        item.style.margin = '0'
        item.style.zIndex = '1000'
        // Asegurar que mantenga sus dimensiones
        item.style.minWidth = `${originalWidth}px`
        item.style.minHeight = `${originalHeight}px`
        item.style.maxWidth = `${originalWidth}px`
        item.style.maxHeight = `${originalHeight}px`
      }
    } else {
      Object.values(itemRefs.current).forEach(item => {
        if (item) {
          item.classList.remove('dragging')
          item.style.position = ''
          item.style.left = ''
          item.style.top = ''
          item.style.width = ''
          item.style.height = ''
          item.style.margin = ''
          item.style.zIndex = ''
          item.style.minWidth = ''
          item.style.minHeight = ''
          item.style.maxWidth = ''
          item.style.maxHeight = ''
        }
      })
      dragDimensionsRef.current = { width: 0, height: 0 }
    }
  }, [draggedElement])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedElement) {
        const elementId = draggedElement.elementId
        const item = itemRefs.current[elementId]
        if (item) {
          // Mantener las dimensiones originales durante el arrastre
          const { width, height } = dragDimensionsRef.current
          item.style.left = `${e.clientX - dragOffset.x}px`
          item.style.top = `${e.clientY - dragOffset.y}px`
          // Asegurar que las dimensiones se mantengan
          if (width > 0 && height > 0) {
            item.style.width = `${width}px`
            item.style.height = `${height}px`
          }
        }
      }
    }

    if (draggedElement) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [draggedElement, dragOffset])


  return (
    <div className="grid-items" style={style}>
      {elements.map(element => (
        <div
          key={element.id}
          ref={el => itemRefs.current[element.id] = el}
          className="grid-item"
          data-id={element.id}
          style={{
            gridColumn: `${element.column} / span ${element.columnSpan}`,
            gridRow: `${element.row} / span ${element.rowSpan}`,
            backgroundColor: element.color || DEFAULT_COLOR,
            outline: selectedElementId === element.id && draggedElement?.elementId !== element.id ? '3px solid #2b2b2b' : 'none',
            outlineOffset: '-2px'
          }}
        >
          {isNewspaperMode ? (
            <>
              <textarea
                className="grid-item-text"
                value={element.text || ''}
                onChange={(e) => {
                  e.stopPropagation()
                  onUpdateElement(element.id, { text: e.target.value })
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                placeholder="Escribe tu contenido aquí..."
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteElement(element.id)
                }}
              >
                ×
              </button>
              <div 
                className="resize-handle"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  onResizeStart(e, element)
                }}
              ></div>
            </>
          ) : (
            <>
              <span className="item-number">{element.id}</span>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteElement(element.id)
                }}
              >
                ×
              </button>
              <div 
                className="resize-handle"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  onResizeStart(e, element)
                }}
              ></div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default GridItems
