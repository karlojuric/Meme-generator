// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');

// State
let backgroundImage = null;
let textBoxes = [];
let nextTextBoxId = 1;
let selectedTextBoxId = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// DOM elements
const imageInput = document.getElementById('imageInput');
const imageInputControl = document.getElementById('imageInputControl');
const uploadOverlay = document.getElementById('uploadOverlay');
const addTitleBtn = document.getElementById('addTitleBtn');
const titleBoxesContainer = document.getElementById('titleBoxesContainer');
const downloadBtn = document.getElementById('downloadBtn');
const templatesGrid = document.getElementById('templatesGrid');

// Initialize canvas
function initCanvas() {
    canvas.width = 800;
    canvas.height = 600;
    drawCanvas();
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

// Add new title box
function addTitleBox() {
    const titleBox = {
        id: nextTextBoxId++,
        text: 'Your title here',
        x: canvas.width / 2 - 100,
        y: canvas.height / 2,
        fontSize: 40,
        color: '#FFFFFF'
    };
    
    textBoxes.push(titleBox);
    selectedTextBoxId = titleBox.id;
    renderTitleBoxControls();
    drawCanvas();
}

// Remove title box
function removeTitleBox(id) {
    textBoxes = textBoxes.filter(tb => tb.id !== id);
    if (selectedTextBoxId === id) {
        selectedTextBoxId = textBoxes.length > 0 ? textBoxes[0].id : null;
    }
    renderTitleBoxControls();
    drawCanvas();
}

// Render title box controls in the UI
function renderTitleBoxControls() {
    titleBoxesContainer.innerHTML = '';
    
    textBoxes.forEach(titleBox => {
        if (!titleBox.color) {
            titleBox.color = '#FFFFFF';
        }
        
        const titleItem = document.createElement('div');
        titleItem.className = 'text-box-item';
        if (titleBox.id === selectedTextBoxId) {
            titleItem.classList.add('active');
        }
        
        // Header
        const header = document.createElement('div');
        header.className = 'text-box-header';
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = `Title Box ${titleBox.id}`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeTitleBox(titleBox.id);
        header.appendChild(headerTitle);
        header.appendChild(removeBtn);
        
        // Text input group
        const textGroup = document.createElement('div');
        textGroup.className = 'text-control-group';
        const textLabel = document.createElement('label');
        textLabel.textContent = 'Text:';
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = titleBox.text;
        textInput.className = 'title-text-input';
        textInput.oninput = (e) => {
            updateTextBox(titleBox.id, 'text', e.target.value);
        };
        textInput.onfocus = () => {
            selectTextBox(titleBox.id);
        };
        textLabel.appendChild(textInput);
        textGroup.appendChild(textLabel);
        textGroup.appendChild(textInput);
        
        // Font size group
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'text-control-group';
        const sizeLabel = document.createElement('label');
        const sizeDisplay = document.createElement('span');
        sizeDisplay.className = 'size-display';
        sizeDisplay.textContent = `${titleBox.fontSize}px`;
        sizeLabel.appendChild(document.createTextNode('Font Size: '));
        sizeLabel.appendChild(sizeDisplay);
        const sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.min = '20';
        sizeInput.max = '100';
        sizeInput.value = titleBox.fontSize;
        sizeInput.oninput = (e) => {
            const value = parseInt(e.target.value);
            updateTextBox(titleBox.id, 'fontSize', value);
            sizeDisplay.textContent = value + 'px';
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
        colorInput.value = titleBox.color || '#FFFFFF';
        colorInput.style.width = '100%';
        colorInput.style.height = '40px';
        colorInput.style.cursor = 'pointer';
        colorInput.oninput = (e) => {
            updateTextBox(titleBox.id, 'color', e.target.value);
        };
        colorGroup.appendChild(colorLabel);
        colorGroup.appendChild(colorInput);
        
        titleItem.appendChild(header);
        titleItem.appendChild(textGroup);
        titleItem.appendChild(sizeGroup);
        titleItem.appendChild(colorGroup);
        
        titleBoxesContainer.appendChild(titleItem);
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
    selectedTextBoxId = id;
    renderTextBoxControls();
    drawCanvas();
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

// Get text box at coordinates
function getTextBoxAt(x, y) {
    // Check in reverse order to get topmost text box
    for (let i = textBoxes.length - 1; i >= 0; i--) {
        const textBox = textBoxes[i];
        if (!textBox.text) continue;
        
        ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const metrics = ctx.measureText(textBox.text);
        const textWidth = metrics.width;
        const textHeight = textBox.fontSize * 1.2; // Add some padding for easier clicking
        
        // Expand hit area slightly for easier clicking
        const padding = 10;
        if (x >= textBox.x - padding && x <= textBox.x + textWidth + padding &&
            y >= textBox.y - padding && y <= textBox.y + textHeight + padding) {
            return textBox;
        }
    }
    return null;
}

// Mouse events for dragging
canvas.addEventListener('mousedown', (e) => {
    const coords = getCanvasCoordinates(e);
    const textBox = getTextBoxAt(coords.x, coords.y);
    
    if (textBox) {
        e.preventDefault();
        isDragging = true;
        selectedTextBoxId = textBox.id;
        dragOffset.x = coords.x - textBox.x;
        dragOffset.y = coords.y - textBox.y;
        renderTextBoxControls();
        drawCanvas();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedTextBoxId !== null) {
        e.preventDefault();
        const coords = getCanvasCoordinates(e);
        const textBox = textBoxes.find(tb => tb.id === selectedTextBoxId);
        
        if (textBox) {
            // Calculate new position
            let newX = coords.x - dragOffset.x;
            let newY = coords.y - dragOffset.y;
            
            // Get text width to constrain within canvas bounds
            ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
            ctx.textAlign = 'left';
            const metrics = ctx.measureText(textBox.text);
            const textWidth = metrics.width;
            const textHeight = textBox.fontSize;
            
            // Constrain to canvas bounds
            newX = Math.max(0, Math.min(newX, canvas.width - textWidth));
            newY = Math.max(0, Math.min(newY, canvas.height - textHeight));
            
            textBox.x = newX;
            textBox.y = newY;
            drawCanvas();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Drag and drop functionality
const canvasContainer = document.querySelector('.canvas-container');

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

addTitleBtn.addEventListener('click', addTitleBox);

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
window.removeTitleBox = removeTitleBox;
window.updateTextBox = updateTextBox;
window.selectTextBox = selectTextBox;

// Initialize
initCanvas();
renderTemplates();
renderTitleBoxControls();

