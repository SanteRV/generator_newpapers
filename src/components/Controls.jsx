import React, { useState } from 'react'

function Controls({ columns, rows, gap, isNewspaperMode, onColumnsChange, onRowsChange, onGapChange }) {
  const [gapInputValue, setGapInputValue] = useState(gap.toString())
  const [isGapEditing, setIsGapEditing] = useState(false)

  const handleDecrease = (property, min, onChange) => {
    const currentValue = property === 'columns' ? columns : rows
    if (currentValue > min) {
      onChange(currentValue - 1)
    }
  }

  const handleIncrease = (property, max, onChange) => {
    const currentValue = property === 'columns' ? columns : rows
    if (currentValue < max) {
      onChange(currentValue + 1)
    }
  }

  const handleGapInputChange = (e) => {
    setGapInputValue(e.target.value)
  }

  const handleGapInputBlur = () => {
    const numValue = parseFloat(gapInputValue)
    const max = isNewspaperMode ? 10 : 50
    if (!isNaN(numValue) && numValue >= 0 && numValue <= max) {
      onGapChange(numValue)
      setGapInputValue(formatGapValue(numValue))
    } else {
      setGapInputValue(formatGapValue(gap))
    }
    setIsGapEditing(false)
  }

  const handleGapInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGapInputBlur()
    }
  }

  const formatGapValue = (value) => {
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return '0.000'
    return num.toFixed(3)
  }

  const handleGapInputFocus = () => {
    setIsGapEditing(true)
    setGapInputValue(gap.toString())
  }

  // Actualizar valor cuando gap cambie externamente
  React.useEffect(() => {
    if (!isGapEditing) {
      setGapInputValue(formatGapValue(gap))
    }
  }, [gap, isGapEditing])

  const handleGapDecrease = () => {
    const min = 0
    const step = isNewspaperMode ? 0.1 : 1
    const newValue = Math.max(min, gap - step)
    onGapChange(newValue)
  }

  const handleGapIncrease = () => {
    const max = isNewspaperMode ? 10 : 50
    const step = isNewspaperMode ? 0.1 : 1
    const newValue = Math.min(max, gap + step)
    onGapChange(newValue)
  }

  const ControlButton = ({ label, value, property, min, max, onChange }) => {
    const handleDecreaseClick = (e) => {
      e.stopPropagation()
      handleDecrease(property, min, onChange)
    }

    const handleIncreaseClick = (e) => {
      e.stopPropagation()
      handleIncrease(property, max, onChange)
    }

    return (
      <div className="control-item">
        <label>{label}</label>
        <button className="control-btn">
          <span className="control-decrease" onClick={handleDecreaseClick}>−</span>
          <span>{value}</span>
          <span className="control-increase" onClick={handleIncreaseClick}>+</span>
        </button>
      </div>
    )
  }

  return (
    <div className="controls-horizontal">
      <ControlButton
        label="Columnas"
        value={columns}
        property="columns"
        min={1}
        max={24}
        onChange={onColumnsChange}
      />
      <ControlButton
        label="Filas"
        value={rows}
        property="rows"
        min={1}
        max={24}
        onChange={onRowsChange}
      />
      <div className="control-item">
        <label>{isNewspaperMode ? "Espacio(mm)" : "Espacio(px)"}</label>
        <div className="control-gap-wrapper">
          <span className="control-decrease" onClick={handleGapDecrease}>−</span>
          <input
            type="number"
            className="control-gap-input"
            value={isGapEditing ? gapInputValue : formatGapValue(gap)}
            onChange={handleGapInputChange}
            onBlur={handleGapInputBlur}
            onFocus={handleGapInputFocus}
            onKeyPress={handleGapInputKeyPress}
            min={0}
            max={isNewspaperMode ? 10 : 50}
            step={isNewspaperMode ? 0.1 : 1}
          />
          <span className="control-increase" onClick={handleGapIncrease}>+</span>
        </div>
      </div>
    </div>
  )
}

export default Controls
