import React, { useMemo } from 'react'

function CodePanel({ showCode, activeTab, columns, rows, gap, isNewspaperMode, elements, onToggleCode, onTabChange }) {
  const htmlCode = useMemo(() => {
    let html = '<div class="grid-container">\n'
    elements.forEach(element => {
      const text = element.text || ''
      if (isNewspaperMode && text) {
        html += `  <div class="grid-item item-${element.id}">${text.replace(/\n/g, '<br>')}</div>\n`
      } else {
        html += `  <div class="grid-item item-${element.id}">Elemento ${element.id}</div>\n`
      }
    })
    html += '</div>'
    return html
  }, [elements, isNewspaperMode])

  const cssCode = useMemo(() => {
    const gapUnit = isNewspaperMode ? 'mm' : 'px'
    const gapValue = gap
    
    let css = '.grid-container {\n'
    css += '  display: grid;\n'
    css += `  grid-template-columns: repeat(${columns}, 1fr);\n`
    css += `  grid-template-rows: repeat(${rows}, 1fr);\n`
    if (gapValue > 0) {
      css += `  gap: ${gapValue}${gapUnit};\n`
    }
    css += '}\n\n'
    css += '.grid-item {\n'
    css += '  background: #ffffff;\n'
    css += '  padding: 10px;\n'
    css += '  border: 2px solid #8b7e6a;\n'
    css += '  color: #2b2b2b;\n'
    css += '}\n'
    if (elements.length > 0) {
      css += '\n'
      elements.forEach(element => {
        css += `.item-${element.id} {\n`
        css += `  grid-column: ${element.column} / span ${element.columnSpan};\n`
        css += `  grid-row: ${element.row} / span ${element.rowSpan};\n`
        if (element.color && element.color !== '#ffffff') {
          css += `  background-color: ${element.color};\n`
        }
        css += '}\n\n'
      })
    }
    return css
  }, [columns, rows, gap, elements, isNewspaperMode])

  const handleCopyCode = () => {
    const code = activeTab === 'html' ? htmlCode : cssCode
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('copy-code-btn')
      if (btn) {
        const originalText = btn.textContent
        btn.textContent = '¡Copiado!'
        setTimeout(() => {
          btn.textContent = originalText
        }, 2000)
      }
    }).catch(err => {
      alert('Error al copiar: ' + err)
    })
  }

  return (
    <div className="code-section">
      <button className="toggle-code-btn" onClick={onToggleCode}>
        {showCode ? 'Ocultar Código' : 'Mostrar Código'}
      </button>
      {showCode && (
        <div className="code-panel">
          <div className="code-tabs">
            <button
              className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
              onClick={() => onTabChange('html')}
            >
              HTML
            </button>
            <button
              className={`tab-btn ${activeTab === 'css' ? 'active' : ''}`}
              onClick={() => onTabChange('css')}
            >
              CSS
            </button>
          </div>
          <div className="code-content">
            <pre className={`code-block ${activeTab === 'html' ? 'active' : ''}`}>
              <code>{htmlCode}</code>
            </pre>
            <pre className={`code-block ${activeTab === 'css' ? 'active' : ''}`}>
              <code>{cssCode}</code>
            </pre>
          </div>
          <button id="copy-code-btn" className="btn-copy" onClick={handleCopyCode}>
            Copiar Código
          </button>
        </div>
      )}
    </div>
  )
}

export default CodePanel
