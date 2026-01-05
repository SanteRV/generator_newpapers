import React, { useState, useEffect } from 'react'

function TemplatesPanel({ onLoadTemplate, currentTemplate }) {
  const [templates, setTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')

  // Cargar plantillas del localStorage al montar
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('grid-templates')
      if (saved) {
        setTemplates(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Por favor, ingresa un nombre para la plantilla')
      return
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      data: currentTemplate,
      createdAt: new Date().toISOString()
    }

    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    
    try {
      localStorage.setItem('grid-templates', JSON.stringify(updatedTemplates))
      setTemplateName('')
      alert('Plantilla guardada exitosamente')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al guardar la plantilla')
    }
  }

  const deleteTemplate = (id, e) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      const updatedTemplates = templates.filter(t => t.id !== id)
      setTemplates(updatedTemplates)
      
      try {
        localStorage.setItem('grid-templates', JSON.stringify(updatedTemplates))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template.data)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="templates-panel">
      <div className="templates-panel-header">
        <h2>Plantillas</h2>
      </div>

      <div className="templates-save-section">
        <div className="templates-save-form">
          <input
            type="text"
            placeholder="Nombre de la plantilla"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                saveTemplate()
              }
            }}
          />
          <button className="templates-save-btn" onClick={saveTemplate}>
            Guardar
          </button>
        </div>
      </div>

      <div className="templates-list-section">
        <h3>Plantillas guardadas ({templates.length})</h3>
        {templates.length === 0 ? (
          <div className="templates-empty">
            <p>No hay plantillas guardadas</p>
            <p className="templates-empty-hint">Guarda tu primera plantilla para comenzar</p>
          </div>
        ) : (
          <div className="templates-list">
            {templates.map(template => (
              <div
                key={template.id}
                className="template-item"
                onClick={() => handleLoadTemplate(template)}
              >
                <div className="template-item-header">
                  <span className="template-item-name">{template.name}</span>
                  <button
                    className="template-delete-btn"
                    onClick={(e) => deleteTemplate(template.id, e)}
                    title="Eliminar plantilla"
                  >
                    ×
                  </button>
                </div>
                <div className="template-item-info">
                  <span className="template-item-stats">
                    {template.data.columns}×{template.data.rows} • {template.data.elements.length} elementos
                  </span>
                  <span className="template-item-date">{formatDate(template.createdAt)}</span>
                </div>
                <div className="template-item-preview">
                  <div 
                    className="template-preview-grid"
                    style={{
                      gridTemplateColumns: `repeat(${template.data.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${Math.min(template.data.rows, 12)}, 1fr)`,
                      gap: `${Math.max(1, Math.floor(template.data.gap / 4))}px`
                    }}
                  >
                    {/* Renderizar elementos con sus spans correctos */}
                    {template.data.elements
                      .filter(el => el.row <= Math.min(template.data.rows, 12))
                      .map((element) => {
                        const maxRow = Math.min(template.data.rows, 12)
                        const adjustedRowSpan = Math.min(element.rowSpan, maxRow - element.row + 1)
                        return (
                          <div
                            key={`element-${element.id}`}
                            className="template-preview-element"
                            style={{
                              gridColumn: `${element.column} / span ${element.columnSpan}`,
                              gridRow: `${element.row} / span ${adjustedRowSpan}`
                            }}
                          />
                        )
                      })}
                    {/* Renderizar celdas vacías para el fondo */}
                    {Array.from({ length: template.data.columns * Math.min(template.data.rows, 12) }).map((_, i) => {
                      const col = (i % template.data.columns) + 1
                      const row = Math.floor(i / template.data.columns) + 1
                      const hasElement = template.data.elements.some(el => {
                        const endCol = el.column + el.columnSpan - 1
                        const endRow = el.row + el.rowSpan - 1
                        return col >= el.column && col <= endCol && row >= el.row && row <= endRow
                      })
                      if (hasElement) return null
                      return (
                        <div
                          key={`cell-${i}`}
                          className="template-preview-cell"
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplatesPanel
