// Estado global
const state = {
    columns: 5,
    rows: 12,
    gap: 8,
    elements: [],
    elementCounter: 1,
    isSelecting: false,
    selectionStart: null,
    selectionEnd: null,
    pendingSelection: null
};

// Referencias DOM
const gridCells = document.getElementById('grid-cells');
const gridItems = document.getElementById('grid-items');
const gridMain = document.querySelector('.grid-main');
const columnsValue = document.getElementById('columns-value');
const rowsValue = document.getElementById('rows-value');
const gapValue = document.getElementById('gap-value');
const columnsBtn = document.getElementById('columns-btn');
const rowsBtn = document.getElementById('rows-btn');
const gapBtn = document.getElementById('gap-btn');
const toggleCodeBtn = document.getElementById('toggle-code');
const codePanel = document.getElementById('code-panel');
const copyCodeBtn = document.getElementById('copy-code');
const tabBtns = document.querySelectorAll('.tab-btn');
const htmlCodeBlock = document.querySelector('#html-code code');
const cssCodeBlock = document.querySelector('#css-code code');
const selectionOverlay = document.getElementById('selection-overlay');
const confirmationPanel = document.getElementById('confirmation-panel');
const panelSize = document.getElementById('panel-size');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Variables para drag & drop de elementos existentes
let draggedElement = null;
let resizingElement = null;
let startX, startY, startColSpan, startRowSpan;

// Inicializar
function init() {
    generateGridCells();
    updateGridStyles();
    generateCode();
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Controles con botones +/-
    setupControlButton(columnsBtn, 'columns', 1, 24);
    setupControlButton(rowsBtn, 'rows', 1, 24);
    setupControlButton(gapBtn, 'gap', 0, 50);

    // Toggle código
    toggleCodeBtn.addEventListener('click', () => {
        const isVisible = codePanel.style.display !== 'none';
        codePanel.style.display = isVisible ? 'none' : 'block';
        toggleCodeBtn.textContent = isVisible ? 'Show Code' : 'Hide Code';
    });

    // Copiar código
    copyCodeBtn.addEventListener('click', copyCode);

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Selección por arrastre
    gridMain.addEventListener('mousedown', handleSelectionStart);
    gridMain.addEventListener('mousemove', handleSelectionMove);
    gridMain.addEventListener('mouseup', handleSelectionEnd);
    gridMain.addEventListener('mouseleave', handleSelectionCancel);

    // Botones de confirmación
    confirmBtn.addEventListener('click', confirmSelection);
    cancelBtn.addEventListener('click', cancelSelection);
}

// Configurar botón de control con +/-
function setupControlButton(btn, property, min, max) {
    const decreaseBtn = btn.querySelector('.control-decrease');
    const increaseBtn = btn.querySelector('.control-increase');
    const valueSpan = document.getElementById(`${property}-value`);

    decreaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state[property] > min) {
            state[property]--;
            valueSpan.textContent = state[property];
            updateGrid();
        }
    });

    increaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state[property] < max) {
            state[property]++;
            valueSpan.textContent = state[property];
            updateGrid();
        }
    });
}

// Actualizar grid
function updateGrid() {
    updateGridStyles();
    generateGridCells();
    rerenderElements();
    generateCode();
}

// Generar celdas del grid
function generateGridCells() {
    // Limpiar solo las celdas
    gridCells.innerHTML = '';

    // Crear celdas con símbolo + (FIJAS según columns x rows)
    const totalCells = state.columns * state.rows;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        const col = (i % state.columns) + 1;
        const row = Math.floor(i / state.columns) + 1;
        cell.dataset.col = col;
        cell.dataset.row = row;
        cell.innerHTML = '<span class="plus-icon">+</span>';

        gridCells.appendChild(cell);
    }
}

// Actualizar estilos del grid
function updateGridStyles() {
    const gridStyle = `repeat(${state.columns}, 1fr)`;
    const rowStyle = `repeat(${state.rows}, 1fr)`;
    const gapStyle = `${state.gap}px`;

    // Actualizar celdas base
    gridCells.style.gridTemplateColumns = gridStyle;
    gridCells.style.gridTemplateRows = rowStyle;
    gridCells.style.gap = gapStyle;

    // Actualizar capa de items
    gridItems.style.gridTemplateColumns = gridStyle;
    gridItems.style.gridTemplateRows = rowStyle;
    gridItems.style.gap = gapStyle;

    // Actualizar overlay de selección
    selectionOverlay.style.gridTemplateColumns = gridStyle;
    selectionOverlay.style.gridTemplateRows = rowStyle;
    selectionOverlay.style.gap = gapStyle;
}

// Obtener celda desde coordenadas del mouse
function getCellFromPoint(x, y) {
    const cells = gridCells.querySelectorAll('.grid-cell');
    for (let cell of cells) {
        const rect = cell.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return {
                col: parseInt(cell.dataset.col),
                row: parseInt(cell.dataset.row),
                element: cell
            };
        }
    }
    return null;
}

// Obtener celda desde coordenadas usando cálculo directo
function getCellFromPointCalculated(x, y) {
    const gridRect = gridCells.getBoundingClientRect();

    // Calcular posición relativa dentro del grid
    const relX = x - gridRect.left;
    const relY = y - gridRect.top;

    // Calcular dimensiones de cada celda incluyendo el gap
    const totalGapX = state.gap * (state.columns - 1);
    const totalGapY = state.gap * (state.rows - 1);
    const cellWidth = (gridRect.width - totalGapX) / state.columns;
    const cellHeight = (gridRect.height - totalGapY) / state.rows;

    // Calcular columna y fila
    let col = 1;
    let row = 1;
    let accumulatedX = 0;
    let accumulatedY = 0;

    // Encontrar columna
    for (let c = 1; c <= state.columns; c++) {
        const cellEnd = accumulatedX + cellWidth;
        if (relX < cellEnd) {
            col = c;
            break;
        }
        accumulatedX = cellEnd + state.gap;
        if (c === state.columns) col = state.columns;
    }

    // Encontrar fila
    for (let r = 1; r <= state.rows; r++) {
        const cellEnd = accumulatedY + cellHeight;
        if (relY < cellEnd) {
            row = r;
            break;
        }
        accumulatedY = cellEnd + state.gap;
        if (r === state.rows) row = state.rows;
    }

    return {
        col: Math.max(1, Math.min(state.columns, col)),
        row: Math.max(1, Math.min(state.rows, row))
    };
}

// Iniciar selección
function handleSelectionStart(e) {
    // Ignorar si se hace clic en un elemento existente
    if (e.target.closest('.grid-item')) {
        const item = e.target.closest('.grid-item');
        // Si es el botón de eliminar, permitir
        if (e.target.classList.contains('delete-btn')) {
            return;
        }
        // Si es el resize handle, permitir resize
        if (e.target.classList.contains('resize-handle')) {
            const elementId = parseInt(item.dataset.id);
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
                startResize(e, element);
            }
            return;
        }
        // Iniciar drag
        draggedElement = item;
        item.classList.add('dragging');
        return;
    }

    // Ignorar si no es sobre una celda
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    state.isSelecting = true;
    state.selectionStart = { col: cell.col, row: cell.row };
    state.selectionEnd = { col: cell.col, row: cell.row };

    updateSelectionOverlay();
}

// Mover selección
function handleSelectionMove(e) {
    // Si estamos arrastrando un elemento existente
    if (draggedElement) {
        return;
    }

    if (!state.isSelecting) return;

    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    state.selectionEnd = { col: cell.col, row: cell.row };
    updateSelectionOverlay();
}

// Finalizar selección
function handleSelectionEnd(e) {
    // Si estábamos arrastrando un elemento
    if (draggedElement) {
        const cell = getCellFromPointCalculated(e.clientX, e.clientY);
        if (cell) {
            const elementId = parseInt(draggedElement.dataset.id);
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
                let newCol = cell.col;
                let newRow = cell.row;

                // Ajustar automáticamente si el elemento se sale por la derecha
                if (newCol + element.columnSpan - 1 > state.columns) {
                    newCol = state.columns - element.columnSpan + 1;
                }

                // Ajustar automáticamente si el elemento se sale por abajo
                if (newRow + element.rowSpan - 1 > state.rows) {
                    newRow = state.rows - element.rowSpan + 1;
                }

                // Asegurar que la posición sea válida
                element.column = Math.max(1, newCol);
                element.row = Math.max(1, newRow);

                // Mantener el tamaño original del elemento
                draggedElement.style.gridColumn = `${element.column} / span ${element.columnSpan}`;
                draggedElement.style.gridRow = `${element.row} / span ${element.rowSpan}`;
                generateCode();
            }
        }
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        return;
    }

    if (!state.isSelecting) return;

    state.isSelecting = false;

    // Calcular área seleccionada
    const minCol = Math.min(state.selectionStart.col, state.selectionEnd.col);
    const maxCol = Math.max(state.selectionStart.col, state.selectionEnd.col);
    const minRow = Math.min(state.selectionStart.row, state.selectionEnd.row);
    const maxRow = Math.max(state.selectionStart.row, state.selectionEnd.row);

    const colSpan = maxCol - minCol + 1;
    const rowSpan = maxRow - minRow + 1;

    // Si es un clic simple (1x1), crear directamente sin panel de confirmación
    if (colSpan === 1 && rowSpan === 1) {
        const element = {
            id: state.elementCounter++,
            column: minCol,
            row: minRow,
            columnSpan: 1,
            rowSpan: 1
        };

        state.elements.push(element);
        renderElement(element);
        generateCode();
        hideSelectionOverlay();
        return;
    }

    // Para selecciones múltiples, guardar y mostrar panel
    state.pendingSelection = {
        column: minCol,
        row: minRow,
        columnSpan: colSpan,
        rowSpan: rowSpan
    };

    // Mostrar panel de confirmación
    showConfirmationPanel(e.clientX, e.clientY, colSpan, rowSpan);
}

// Cancelar selección si el mouse sale del grid
function handleSelectionCancel(e) {
    if (state.isSelecting) {
        state.isSelecting = false;
        hideSelectionOverlay();
    }
}

// Actualizar overlay de selección
function updateSelectionOverlay() {
    if (!state.selectionStart || !state.selectionEnd) return;

    const minCol = Math.min(state.selectionStart.col, state.selectionEnd.col);
    const maxCol = Math.max(state.selectionStart.col, state.selectionEnd.col);
    const minRow = Math.min(state.selectionStart.row, state.selectionEnd.row);
    const maxRow = Math.max(state.selectionStart.row, state.selectionEnd.row);

    selectionOverlay.style.setProperty('--sel-col-start', minCol);
    selectionOverlay.style.setProperty('--sel-col-end', maxCol + 1);
    selectionOverlay.style.setProperty('--sel-row-start', minRow);
    selectionOverlay.style.setProperty('--sel-row-end', maxRow + 1);
    selectionOverlay.classList.add('active');
}

// Ocultar overlay de selección
function hideSelectionOverlay() {
    selectionOverlay.classList.remove('active');
}

// Mostrar panel de confirmación
function showConfirmationPanel(x, y, cols, rows) {
    panelSize.textContent = `${cols}x${rows}`;
    confirmationPanel.style.display = 'flex';
    confirmationPanel.style.left = `${x}px`;
    confirmationPanel.style.top = `${y}px`;
}

// Ocultar panel de confirmación
function hideConfirmationPanel() {
    confirmationPanel.style.display = 'none';
    hideSelectionOverlay();
    state.pendingSelection = null;
}

// Confirmar selección y crear elemento
function confirmSelection() {
    if (!state.pendingSelection) return;

    const element = {
        id: state.elementCounter++,
        column: state.pendingSelection.column,
        row: state.pendingSelection.row,
        columnSpan: state.pendingSelection.columnSpan,
        rowSpan: state.pendingSelection.rowSpan
    };

    state.elements.push(element);
    renderElement(element);
    generateCode();

    hideConfirmationPanel();
}

// Cancelar selección
function cancelSelection() {
    hideConfirmationPanel();
}

// Renderizar elemento en el grid
function renderElement(element) {
    const div = document.createElement('div');
    div.className = 'grid-item';
    div.draggable = false;
    div.dataset.id = element.id;

    div.style.gridColumn = `${element.column} / span ${element.columnSpan}`;
    div.style.gridRow = `${element.row} / span ${element.rowSpan}`;

    div.innerHTML = `
        <span class="item-number">${element.id}</span>
        <button class="delete-btn">×</button>
        <div class="resize-handle"></div>
    `;

    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteElement(element.id);
    });

    const resizeHandle = div.querySelector('.resize-handle');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startResize(e, element);
    });

    gridItems.appendChild(div);
}

// Re-renderizar todos los elementos
function rerenderElements() {
    // Limpiar elementos existentes
    gridItems.innerHTML = '';

    // Filtrar elementos que están completamente fuera del grid
    state.elements = state.elements.filter(el => {
        return el.column <= state.columns && el.row <= state.rows;
    });

    // Ajustar solo la posición si está fuera, pero mantener el tamaño
    state.elements.forEach(el => {
        // Si el elemento se sale del borde derecho o inferior, ajustar su posición
        if (el.column + el.columnSpan - 1 > state.columns) {
            el.column = Math.max(1, state.columns - el.columnSpan + 1);
        }
        if (el.row + el.rowSpan - 1 > state.rows) {
            el.row = Math.max(1, state.rows - el.rowSpan + 1);
        }
    });

    state.elements.forEach(element => renderElement(element));
}

// Eliminar elemento
function deleteElement(id) {
    state.elements = state.elements.filter(el => el.id !== id);
    const elementDiv = gridItems.querySelector(`[data-id="${id}"]`);
    if (elementDiv) {
        elementDiv.remove();
    }
    generateCode();
}

// Resize
function startResize(e, element) {
    resizingElement = element;
    startX = e.clientX;
    startY = e.clientY;
    startColSpan = element.columnSpan;
    startRowSpan = element.rowSpan;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    e.preventDefault();
}

function handleResize(e) {
    if (!resizingElement) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const gridRect = gridCells.getBoundingClientRect();

    // Calcular dimensiones de celda considerando gaps
    const totalGapX = state.gap * (state.columns - 1);
    const totalGapY = state.gap * (state.rows - 1);
    const cellWidth = (gridRect.width - totalGapX) / state.columns;
    const cellHeight = (gridRect.height - totalGapY) / state.rows;

    const colChange = Math.round(deltaX / (cellWidth + state.gap));
    const rowChange = Math.round(deltaY / (cellHeight + state.gap));

    const maxColSpan = state.columns - resizingElement.column + 1;
    const maxRowSpan = state.rows - resizingElement.row + 1;

    const newColSpan = Math.max(1, Math.min(maxColSpan, startColSpan + colChange));
    const newRowSpan = Math.max(1, Math.min(maxRowSpan, startRowSpan + rowChange));

    resizingElement.columnSpan = newColSpan;
    resizingElement.rowSpan = newRowSpan;

    const elementDiv = gridItems.querySelector(`[data-id="${resizingElement.id}"]`);
    if (elementDiv) {
        elementDiv.style.gridColumn = `${resizingElement.column} / span ${resizingElement.columnSpan}`;
        elementDiv.style.gridRow = `${resizingElement.row} / span ${resizingElement.rowSpan}`;
    }

    generateCode();
}

function stopResize() {
    resizingElement = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Generar código
function generateCode() {
    generateHTML();
    generateCSS();
}

function generateHTML() {
    let html = '<div class="grid-container">\n';

    state.elements.forEach(element => {
        html += `  <div class="grid-item item-${element.id}">Element ${element.id}</div>\n`;
    });

    html += '</div>';

    htmlCodeBlock.textContent = html;
}

function generateCSS() {
    let css = '.grid-container {\n';
    css += '  display: grid;\n';
    css += `  grid-template-columns: repeat(${state.columns}, 1fr);\n`;
    css += `  grid-template-rows: repeat(${state.rows}, 1fr);\n`;

    if (state.gap > 0) {
        css += `  gap: ${state.gap}px;\n`;
    }

    css += '}\n\n';

    css += '.grid-item {\n';
    css += '  background: #8b7e6a;\n';
    css += '  padding: 20px;\n';
    css += '  border-radius: 10px;\n';
    css += '  color: white;\n';
    css += '  display: flex;\n';
    css += '  align-items: center;\n';
    css += '  justify-content: center;\n';
    css += '}\n';

    if (state.elements.length > 0) {
        css += '\n';
        state.elements.forEach(element => {
            css += `.item-${element.id} {\n`;
            css += `  grid-column: ${element.column} / span ${element.columnSpan};\n`;
            css += `  grid-row: ${element.row} / span ${element.rowSpan};\n`;
            css += '}\n\n';
        });
    }

    cssCodeBlock.textContent = css;
}

// Copiar código
function copyCode() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    const code = activeTab === 'html' ? htmlCodeBlock.textContent : cssCodeBlock.textContent;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = 'Copied!';

        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Error copying: ' + err);
    });
}

// Cambiar tab
function switchTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.code-block').forEach(block => {
        block.classList.remove('active');
    });

    document.getElementById(`${tab}-code`).classList.add('active');
}

// Iniciar aplicación
init();
