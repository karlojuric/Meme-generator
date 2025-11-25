// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');

// State
let backgroundImage = null;
let textBoxes = [];
let nextTextBoxId = 1;
let selectedTextBoxId = null;
let isDragging = false;
let isResizing = false;
let resizeHandle = null;
let dragOffset = { x: 0, y: 0 };
let resizeStartPos = { x: 0, y: 0 };
let resizeStartSize = { width: 0, height: 0 };

// DOM elements
const imageInput = document.getElementById('imageInput');
const imageInputControl = document.getElementById('imageInputControl');
const uploadOverlay = document.getElementById('uploadOverlay');
const addDescriptionBtn = document.getElementById('addDescriptionBtn');
const descriptionsContainer = document.getElementById('descriptionsContainer');
const downloadBtn = document.getElementById('downloadBtn');
const templatesGrid = document.getElementById('templatesGrid');
const textBoxesOverlay = document.getElementById('textBoxesOverlay');

// Initialize canvas
function initCanvas() {
    canvas.width = 800;
    canvas.height = 600;
    updateOverlaySize();
    drawCanvas();
}

// Update overlay size and position to match canvas
function updateOverlaySize() {
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvasContainer.getBoundingClientRect();
    
    // Position overlay to match canvas position
    textBoxesOverlay.style.width = canvasRect.width + 'px';
    textBoxesOverlay.style.height = canvasRect.height + 'px';
    textBoxesOverlay.style.left = (canvasRect.left - containerRect.left) + 'px';
    textBoxesOverlay.style.top = (canvasRect.top - containerRect.top) + 'px';
}

// Load image onto canvas
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            backgroundImage = img;
            // Resize canvas to fit image while maintaining aspect ratio
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            uploadOverlay.classList.add('hidden');
            setTimeout(() => {
                updateOverlaySize();
                renderTextBoxOverlays();
            }, 100);
            drawCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Load image from URL (for templates)
function loadImageFromUrl(url) {
    const img = new Image();
    img.onload = function() {
        backgroundImage = img;
        // Resize canvas to fit image while maintaining aspect ratio
        const maxWidth = 2400;
        const maxHeight = 1800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        uploadOverlay.classList.add('hidden');
        setTimeout(() => {
            updateOverlaySize();
            renderTextBoxOverlays();
        }, 100);
        drawCanvas();
    };
    img.onerror = function() {
        console.error('Failed to load image:', url);
        alert('Failed to load template image. Please try again.');
    };
    img.src = url;
}

// Template images from assets folder
const templateImages = [
    'assets/DSCI0952.JPG',
    'assets/DSCI0953.JPG',
    'assets/DSCI0954.JPG',
    'assets/DSCI0955.JPG',
    'assets/DSCI0956.JPG',
    'assets/DSCI0957.JPG',
    'assets/DSCI0958.JPG',
    'assets/DSCI0959.JPG',
    'assets/n1286238688_30243831_2079.jpg',
    'assets/plakat1.jpg'
];

// Render template gallery
function renderTemplates() {
    templatesGrid.innerHTML = '';
    
    templateImages.forEach((imagePath, index) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
            <img src="${imagePath}" alt="Template ${index + 1}" loading="lazy">
            <div class="template-overlay">
                <span>Use Template</span>
            </div>
        `;
        
        templateItem.addEventListener('click', () => {
            loadImageFromUrl(imagePath);
            // Update active state
            document.querySelectorAll('.template-item').forEach(item => {
                item.classList.remove('active');
            });
            templateItem.classList.add('active');
        });
        
        templatesGrid.appendChild(templateItem);
    });
}

// Draw everything on canvas
function drawCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Upload an image to get started', canvas.width / 2, canvas.height / 2);
    }
    
    // Draw all text boxes
    textBoxes.forEach(textBox => {
        drawText(textBox);
    });
}

// Draw text with customizable fill color and black stroke
function drawText(textBox) {
    const { text, x, y, fontSize, color } = textBox;
    
    if (!text) return;
    
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw black stroke (border) - made thicker
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, fontSize / 12); // Thicker border
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
    
    // Draw fill with user-selected color (default white)
    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(text, x, y);
}

// Convert canvas coordinates to overlay coordinates
function canvasToOverlay(x, y) {
    const canvasRect = canvas.getBoundingClientRect();
    const overlayRect = textBoxesOverlay.getBoundingClientRect();
    const scaleX = overlayRect.width / canvas.width;
    const scaleY = overlayRect.height / canvas.height;
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

// Convert overlay coordinates to canvas coordinates
function overlayToCanvas(x, y) {
    const canvasRect = canvas.getBoundingClientRect();
    const overlayRect = textBoxesOverlay.getBoundingClientRect();
    const scaleX = canvas.width / overlayRect.width;
    const scaleY = canvas.height / overlayRect.height;
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

// Create a new text box overlay
function createTextBoxOverlay(textBox) {
    const overlay = document.createElement('div');
    overlay.className = 'text-box-overlay';
    overlay.dataset.id = textBox.id;
    
    const pos = canvasToOverlay(textBox.x, textBox.y);
    
    // Calculate initial size based on text
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const metrics = ctx.measureText(textBox.text || 'New Text');
    const textWidth = metrics.width;
    const textHeight = textBox.fontSize * 1.5;
    
    const overlayWidth = Math.max(150, textWidth + 40);
    const overlayHeight = Math.max(60, textHeight + 20);
    
    overlay.style.left = pos.x + 'px';
    overlay.style.top = pos.y + 'px';
    overlay.style.width = overlayWidth + 'px';
    overlay.style.height = overlayHeight + 'px';
    
    // Text input
    const textInput = document.createElement('textarea');
    textInput.className = 'text-box-input';
    textInput.value = textBox.text || 'New Text';
    textInput.placeholder = 'Enter text...';
    textInput.style.fontSize = textBox.fontSize + 'px';
    textInput.addEventListener('input', (e) => {
        updateTextBox(textBox.id, 'text', e.target.value);
        updateTextBoxSize(textBox.id);
    });
    textInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectTextBox(textBox.id);
    });
    textInput.addEventListener('focus', (e) => {
        e.stopPropagation();
        selectTextBox(textBox.id);
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-box-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDescription(textBox.id);
    });
    
    // Resize handles
    const handles = ['nw', 'ne', 'sw', 'se'];
    handles.forEach(handle => {
        const handleEl = document.createElement('div');
        handleEl.className = `resize-handle resize-handle-${handle}`;
        handleEl.dataset.handle = handle;
        overlay.appendChild(handleEl);
    });
    
    overlay.appendChild(textInput);
    overlay.appendChild(deleteBtn);
    
    // Make overlay draggable
    let isDraggingOverlay = false;
    let dragStartPos = { x: 0, y: 0 };
    
    overlay.addEventListener('mousedown', (e) => {
        if (e.target === textInput || e.target.classList.contains('resize-handle') || e.target === deleteBtn) {
            return;
        }
        isDraggingOverlay = true;
        dragStartPos.x = e.clientX - overlay.offsetLeft;
        dragStartPos.y = e.clientY - overlay.offsetTop;
        selectTextBox(textBox.id);
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingOverlay && selectedTextBoxId === textBox.id) {
            const overlayRect = textBoxesOverlay.getBoundingClientRect();
            let newX = e.clientX - overlayRect.left - dragStartPos.x;
            let newY = e.clientY - overlayRect.top - dragStartPos.y;
            
            // Constrain to overlay bounds
            newX = Math.max(0, Math.min(newX, overlayRect.width - overlay.offsetWidth));
            newY = Math.max(0, Math.min(newY, overlayRect.height - overlay.offsetHeight));
            
            overlay.style.left = newX + 'px';
            overlay.style.top = newY + 'px';
            
            // Update canvas coordinates
            const canvasPos = overlayToCanvas(newX, newY);
            textBox.x = canvasPos.x;
            textBox.y = canvasPos.y;
            drawCanvas();
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDraggingOverlay = false;
    });
    
    // Handle resize
    handles.forEach(handle => {
        const handleEl = overlay.querySelector(`.resize-handle-${handle}`);
        let isResizingOverlay = false;
        let resizeStart = { x: 0, y: 0 };
        let resizeStartSize = { width: 0, height: 0 };
        let resizeStartPos = { x: 0, y: 0 };
        let resizeStartFontSize = 40;
        
        handleEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizingOverlay = true;
            resizeStart.x = e.clientX;
            resizeStart.y = e.clientY;
            resizeStartSize.width = overlay.offsetWidth;
            resizeStartSize.height = overlay.offsetHeight;
            resizeStartPos.x = overlay.offsetLeft;
            resizeStartPos.y = overlay.offsetTop;
            resizeStartFontSize = textBox.fontSize || 40;
            selectTextBox(textBox.id);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isResizingOverlay && selectedTextBoxId === textBox.id) {
                let newWidth = resizeStartSize.width;
                let newHeight = resizeStartSize.height;
                let newX = resizeStartPos.x;
                let newY = resizeStartPos.y;
                
                if (handle.includes('e')) {
                    newWidth = Math.max(100, resizeStartSize.width + (e.clientX - resizeStart.x));
                }
                if (handle.includes('w')) {
                    newWidth = Math.max(100, resizeStartSize.width - (e.clientX - resizeStart.x));
                    newX = resizeStartPos.x + (e.clientX - resizeStart.x);
                }
                if (handle.includes('s')) {
                    newHeight = Math.max(40, resizeStartSize.height + (e.clientY - resizeStart.y));
                }
                if (handle.includes('n')) {
                    newHeight = Math.max(40, resizeStartSize.height - (e.clientY - resizeStart.y));
                    newY = resizeStartPos.y + (e.clientY - resizeStart.y);
                }
                
                // Constrain to overlay bounds
                const overlayRect = textBoxesOverlay.getBoundingClientRect();
                if (newX < 0) {
                    newWidth += newX;
                    newX = 0;
                }
                if (newY < 0) {
                    newHeight += newY;
                    newY = 0;
                }
                if (newX + newWidth > overlayRect.width) {
                    newWidth = overlayRect.width - newX;
                }
                if (newY + newHeight > overlayRect.height) {
                    newHeight = overlayRect.height - newY;
                }
                
                overlay.style.width = newWidth + 'px';
                overlay.style.height = newHeight + 'px';
                overlay.style.left = newX + 'px';
                overlay.style.top = newY + 'px';
                
                // Update text box size and position
                const canvasPos = overlayToCanvas(newX, newY);
                const canvasSize = overlayToCanvas(newWidth, newHeight);
                textBox.x = canvasPos.x;
                textBox.y = canvasPos.y;
                
                // Calculate font size based on height ratio
                const heightRatio = newHeight / resizeStartSize.height;
                const newFontSize = Math.max(20, Math.min(100, resizeStartFontSize * heightRatio));
                textBox.fontSize = newFontSize;
                textBox.width = canvasSize.x;
                textBox.height = canvasSize.y;
                
                // Update input font size
                const input = overlay.querySelector('.text-box-input');
                if (input) {
                    input.style.fontSize = newFontSize + 'px';
                }
                
                drawCanvas();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isResizingOverlay = false;
        });
    });
    
    textBoxesOverlay.appendChild(overlay);
    return overlay;
}

// Update text box size based on overlay
function updateTextBoxSize(id) {
    const textBox = textBoxes.find(tb => tb.id === id);
    if (!textBox) return;
    
    const overlay = textBoxesOverlay.querySelector(`[data-id="${id}"]`);
    if (!overlay) return;
    
    const canvasSize = overlayToCanvas(overlay.offsetWidth, overlay.offsetHeight);
    textBox.width = canvasSize.x;
    textBox.height = canvasSize.y;
    
        // Update font size based on height
        const textInput = overlay.querySelector('.text-box-input');
        if (textInput) {
            const baseHeight = 60; // Base overlay height for default font size
            const fontSizeRatio = overlay.offsetHeight / baseHeight;
            const newFontSize = Math.max(20, Math.min(100, 40 * fontSizeRatio));
            textBox.fontSize = newFontSize;
            
            // Update input font size for visual feedback
            textInput.style.fontSize = newFontSize + 'px';
        }
}

// Render all text box overlays
function renderTextBoxOverlays() {
    textBoxesOverlay.innerHTML = '';
    textBoxes.forEach(textBox => {
        createTextBoxOverlay(textBox);
    });
    updateSelection();
}

// Update selection visual state
function updateSelection() {
    textBoxesOverlay.querySelectorAll('.text-box-overlay').forEach(overlay => {
        if (parseInt(overlay.dataset.id) === selectedTextBoxId) {
            overlay.classList.add('selected');
        } else {
            overlay.classList.remove('selected');
        }
    });
}

// Add new text box at canvas coordinates
function addTextBoxAt(x, y) {
    const textBox = {
        id: nextTextBoxId++,
        text: 'New Text',
        x: x,
        y: y,
        fontSize: 40,
        color: '#FFFFFF',
        width: 200,
        height: 60
    };
    
    textBoxes.push(textBox);
    selectedTextBoxId = textBox.id;
    createTextBoxOverlay(textBox);
    updateSelection();
    renderDescriptionControls();
    drawCanvas();
}

// Add new description (for button)
function addDescription() {
    const x = canvas.width / 2 - 100;
    const y = canvas.height / 2;
    addTextBoxAt(x, y);
}

// Remove description
function removeDescription(id) {
    textBoxes = textBoxes.filter(tb => tb.id !== id);
    const overlay = textBoxesOverlay.querySelector(`[data-id="${id}"]`);
    if (overlay) {
        overlay.remove();
    }
    if (selectedTextBoxId === id) {
        selectedTextBoxId = textBoxes.length > 0 ? textBoxes[0].id : null;
    }
    renderDescriptionControls();
    updateSelection();
    drawCanvas();
}

// Render description controls in the UI
function renderDescriptionControls() {
    descriptionsContainer.innerHTML = '';
    
    textBoxes.forEach(description => {
        if (!description.color) {
            description.color = '#FFFFFF';
        }
        
        const descriptionItem = document.createElement('div');
        descriptionItem.className = 'text-box-item';
        if (description.id === selectedTextBoxId) {
            descriptionItem.classList.add('active');
        }
        
        // Header
        const header = document.createElement('div');
        header.className = 'text-box-header';
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = `Text ${description.id}`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeDescription(description.id);
        header.appendChild(headerTitle);
        header.appendChild(removeBtn);
        
        // Description input group
        const textGroup = document.createElement('div');
        textGroup.className = 'text-control-group';
        const textLabel = document.createElement('label');
        textLabel.textContent = 'Text:';
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = description.text;
        textInput.className = 'title-text-input';
        textInput.oninput = (e) => {
            updateTextBox(description.id, 'text', e.target.value);
            const overlay = textBoxesOverlay.querySelector(`[data-id="${description.id}"]`);
            if (overlay) {
                const input = overlay.querySelector('.text-box-input');
                if (input) input.value = e.target.value;
            }
            updateTextBoxSize(description.id);
        };
        textInput.onfocus = (e) => {
            e.stopPropagation();
            if (selectedTextBoxId !== description.id) {
                selectTextBox(description.id);
            }
        };
        textInput.onclick = (e) => {
            e.stopPropagation();
        };
        textInput.onmousedown = (e) => {
            e.stopPropagation();
        };
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);
        
        // Font size group
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'text-control-group';
        const sizeLabel = document.createElement('label');
        const sizeDisplay = document.createElement('span');
        sizeDisplay.className = 'size-display';
        sizeDisplay.textContent = `${Math.round(description.fontSize)}px`;
        sizeLabel.appendChild(document.createTextNode('Font Size: '));
        sizeLabel.appendChild(sizeDisplay);
        const sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.min = '20';
        sizeInput.max = '100';
        sizeInput.value = description.fontSize;
        sizeInput.oninput = (e) => {
            const value = parseInt(e.target.value);
            updateTextBox(description.id, 'fontSize', value);
            sizeDisplay.textContent = value + 'px';
            const overlay = textBoxesOverlay.querySelector(`[data-id="${description.id}"]`);
            if (overlay) {
                const input = overlay.querySelector('.text-box-input');
                if (input) input.style.fontSize = value + 'px';
            }
            drawCanvas();
        };
        sizeGroup.appendChild(sizeLabel);
        sizeGroup.appendChild(sizeInput);
        
        // Color group
        const colorGroup = document.createElement('div');
        colorGroup.className = 'text-control-group';
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Text Color:';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = description.color || '#FFFFFF';
        colorInput.style.width = '100%';
        colorInput.style.height = '48px';
        colorInput.style.cursor = 'pointer';
        colorInput.oninput = (e) => {
            updateTextBox(description.id, 'color', e.target.value);
        };
        colorGroup.appendChild(colorLabel);
        colorGroup.appendChild(colorInput);
        
        descriptionItem.appendChild(header);
        descriptionItem.appendChild(textGroup);
        descriptionItem.appendChild(sizeGroup);
        descriptionItem.appendChild(colorGroup);
        
        descriptionsContainer.appendChild(descriptionItem);
    });
}

// Update text box property
function updateTextBox(id, property, value) {
    const textBox = textBoxes.find(tb => tb.id === id);
    if (textBox) {
        textBox[property] = value;
        // Ensure color is set for existing text boxes
        if (property === 'color' && !textBox.color) {
            textBox.color = '#FFFFFF';
        }
        drawCanvas();
    }
}

// Select text box
function selectTextBox(id) {
    if (selectedTextBoxId === id) {
        return;
    }
    selectedTextBoxId = id;
    updateSelection();
    renderDescriptionControls();
    drawCanvas();
}

// Deselect all text boxes
function deselectAll() {
    selectedTextBoxId = null;
    updateSelection();
    renderDescriptionControls();
}

// Get canvas coordinates accounting for scaling
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Canvas click handler - create new text box
canvas.addEventListener('click', (e) => {
    // Check if clicking on an overlay element first
    const clickedElement = document.elementFromPoint(e.clientX, e.clientY);
    if (clickedElement && clickedElement.closest('.text-box-overlay')) {
        const overlay = clickedElement.closest('.text-box-overlay');
        // Only select if clicking directly on canvas area, not on overlay controls
        if (!clickedElement.closest('.text-box-delete') && 
            !clickedElement.closest('.resize-handle') &&
            clickedElement === overlay || clickedElement.closest('.text-box-input')) {
            selectTextBox(parseInt(overlay.dataset.id));
        }
        return;
    }
    
    // Create new text box at click position
    const coords = getCanvasCoordinates(e);
    addTextBoxAt(coords.x, coords.y);
});

// Click outside to deselect
document.addEventListener('click', (e) => {
    if (!e.target.closest('.text-box-overlay') && 
        !e.target.closest('.text-box-item') &&
        !e.target.closest('#memeCanvas') &&
        !e.target.closest('#textBoxesOverlay')) {
        deselectAll();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    updateOverlaySize();
    renderTextBoxOverlays();
});

// Drag and drop functionality
const canvasContainer = document.querySelector('.canvas-container');

// Update overlay position when canvas resizes or window resizes
const resizeObserver = new ResizeObserver(() => {
    updateOverlaySize();
    renderTextBoxOverlays();
});

if (canvas) {
    resizeObserver.observe(canvas);
}

canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasContainer.classList.add('drag-over');
});

canvasContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasContainer.classList.remove('drag-over');
});

canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasContainer.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        loadImage(files[0]);
    }
});

// Event listeners
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadImage(e.target.files[0]);
    }
});

imageInputControl.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadImage(e.target.files[0]);
    }
});

addDescriptionBtn.addEventListener('click', addDescription);

downloadBtn.addEventListener('click', () => {
    if (!backgroundImage) {
        alert('Please upload an image first!');
        return;
    }
    
    // Create download link
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = dataURL;
    link.click();
});

// Make functions available globally for inline event handlers
window.removeDescription = removeDescription;
window.updateTextBox = updateTextBox;
window.selectTextBox = selectTextBox;

// Initialize
initCanvas();
renderTemplates();
renderDescriptionControls();

// Initial overlay positioning
setTimeout(() => {
    updateOverlaySize();
}, 100);
