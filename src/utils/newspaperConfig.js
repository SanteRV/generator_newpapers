// Configuración para plantillas de periódico
export const NEWSPAPER_CONFIG = {
  // Tamaño de página en mm
  pageWidth: 255,  // mm
  pageHeight: 355, // mm
  margins: 15,     // mm en todos los lados
  
  // Separación entre columnas en mm
  columnGap: 2.4,  // mm
  
  // Altura base de fila en mm (ajustable)
  baseRowHeight: 20, // mm
  
  // Conversión mm a px (aproximado a 96 DPI: 1mm = 3.779527559px)
  mmToPx: 3.779527559
}

// Calcular dimensiones del área útil
export function getUsefulArea() {
  const width = NEWSPAPER_CONFIG.pageWidth - (NEWSPAPER_CONFIG.margins * 2)
  const height = NEWSPAPER_CONFIG.pageHeight - (NEWSPAPER_CONFIG.margins * 2)
  return { width, height }
}

// Calcular número de columnas basado en ancho útil y separación
export function calculateColumns() {
  const { width } = getUsefulArea()
  const gap = NEWSPAPER_CONFIG.columnGap
  
  // Calcular columnas: intentar valores comunes (4, 5, 6, 7, 8)
  // Para n columnas: ancho_col = (width - (n-1)*gap) / n
  // Preferimos 6 columnas como estándar editorial
  const preferredColumns = 6
  const columnWidth = (width - (preferredColumns - 1) * gap) / preferredColumns
  
  // Verificar que el ancho de columna sea razonable (mínimo 25mm)
  if (columnWidth >= 25) {
    return preferredColumns
  }
  
  // Si no cabe, reducir columnas
  for (let cols = preferredColumns - 1; cols >= 4; cols--) {
    const colWidth = (width - (cols - 1) * gap) / cols
    if (colWidth >= 25) {
      return cols
    }
  }
  
  return 4 // mínimo
}

// Calcular número de filas basado en altura útil
export function calculateRows() {
  const { height } = getUsefulArea()
  const rowHeight = NEWSPAPER_CONFIG.baseRowHeight
  return Math.floor(height / rowHeight)
}

// Convertir mm a px para visualización
export function mmToPx(mm) {
  return mm * NEWSPAPER_CONFIG.mmToPx
}

// Convertir px a mm
export function pxToMm(px) {
  return px / NEWSPAPER_CONFIG.mmToPx
}

// Calcular ancho de columna en mm
export function getColumnWidthMm(columns) {
  const { width } = getUsefulArea()
  const gap = NEWSPAPER_CONFIG.columnGap
  return (width - (columns - 1) * gap) / columns
}

// Calcular altura de fila en mm
export function getRowHeightMm() {
  return NEWSPAPER_CONFIG.baseRowHeight
}
