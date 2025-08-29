document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const homePage = document.getElementById('home-page');
    const visualizerPage = document.getElementById('visualizer-page');
    const visualizerTitle = document.getElementById('visualizer-title');
    const backBtn = document.getElementById('back-btn');
    const cards = document.querySelectorAll('.card');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Visualizer controls
    const inputDescription = document.getElementById('input-description');
    const treeInput = document.getElementById('tree-input');
    const inputHelper = document.getElementById('input-helper');
    const visualizeBtn = document.getElementById('visualize-btn');
    const balanceBstBtn = document.getElementById('balance-bst-btn');
    const generatePyBtn = document.getElementById('generate-py-btn');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('canvas');

    // Modal elements
    const codeModal = document.getElementById('code-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const pythonCodeDetailed = document.getElementById('python-code-detailed');
    const pythonCodeOneliner = document.getElementById('python-code-oneliner');
    const copyDetailedBtn = document.getElementById('copy-detailed-btn');
    const copyOnelinerBtn = document.getElementById('copy-oneliner-btn');
    const aboutModal = document.getElementById('about-modal');
    const homeAboutBtn = document.getElementById('home-about-btn');
    const mobileAboutBtn = document.getElementById('mobile-about-btn');
    const closeAboutModalBtn = document.getElementById('close-about-modal');
    const toastContainer = document.getElementById('toast-container');

    let currentTreeType = null;
    let currentRoot = null;

    // --- Pan and Zoom State ---
    let scale = 1, translateX = 0, translateY = 0, isPanning = false, startX, startY;
    let masterGroup = null;

    // --- Animated Background ---
    const bgCanvas = document.getElementById('background-canvas');
    const ctx = bgCanvas.getContext('2d');
    let rootBranches = [];
    const MAX_DEPTH = 4;
    const NUM_ROOTS = 8;

    function resizeBgCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    resizeBgCanvas();
    window.addEventListener('resize', () => {
        resizeBgCanvas();
        rootBranches = []; // Reset on resize
    });

    class VBranch {
        constructor(x, startY, endY, depth, slotWidth) {
            this.x = x;
            this.startY = startY;
            this.endY = endY;
            this.currentY = startY;
            this.depth = depth;
            this.slotWidth = slotWidth;
            this.speed = Math.random() * 0.5 + 0.5;
            this.state = 'descending'; // descending, branching, done
            this.h_progress = 0;
            this.h_len = this.slotWidth / 4;
            this.children = [];
        }
        update() {
            if (this.state === 'descending') {
                if (this.currentY < this.endY) {
                    this.currentY += this.speed;
                } else {
                    this.currentY = this.endY;
                    this.state = 'branching';
                    if (this.depth < MAX_DEPTH) {
                        this.createChildren();
                    }
                }
            } else if (this.state === 'branching') {
                if (this.h_progress < this.h_len) {
                    this.h_progress += this.speed;
                } else {
                    this.h_progress = this.h_len;
                    this.state = 'done';
                }
            }
            this.children.forEach(child => child.update());
        }
        createChildren() {
            const childSlotWidth = this.slotWidth / 2;
            const v_gap = 10;
            const childStartY = this.endY + v_gap;
            let nextLevelHeight = (bgCanvas.height / (MAX_DEPTH + 2));
            let childEndY = childStartY + nextLevelHeight * (Math.random() * 0.5 + 0.5);
            
            if (this.depth + 1 >= MAX_DEPTH) {
                childEndY = bgCanvas.height + 50; // Extend beyond the screen
            }

            const leftChildX = this.x - this.h_len;
            const rightChildX = this.x + this.h_len;
            this.children.push(new VBranch(leftChildX, childStartY, childEndY, this.depth + 1, childSlotWidth));
            this.children.push(new VBranch(rightChildX, childStartY, childEndY, this.depth + 1, childSlotWidth));
        }
        draw(context) {
            context.strokeStyle = `hsla(195, 100%, 50%, ${0.03 + (this.depth / MAX_DEPTH) * 0.15})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(this.x, this.startY);
            context.lineTo(this.x, this.currentY);
            context.stroke();
            if (this.state === 'branching' || this.state === 'done') {
                context.beginPath();
                context.moveTo(this.x, this.endY);
                context.lineTo(this.x - this.h_progress, this.endY);
                context.stroke();
                context.beginPath();
                context.moveTo(this.x, this.endY);
                context.lineTo(this.x + this.h_progress, this.endY);
                context.stroke();
                 if (this.state === 'done' && this.children.length > 0) {
                    context.beginPath();
                    context.moveTo(this.x - this.h_len, this.endY);
                    context.lineTo(this.x - this.h_len, this.children[0].startY);
                    context.stroke();
                    context.beginPath();
                    context.moveTo(this.x + this.h_len, this.endY);
                    context.lineTo(this.x + this.h_len, this.children[1].startY);
                    context.stroke();
                }
            }
            this.children.forEach(child => child.draw(context));
        }
    }

    function animateBackground() {
        ctx.fillStyle = 'rgba(9, 10, 15, 0.1)';
        ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        if (rootBranches.length < NUM_ROOTS && Math.random() < 0.05) {
            const slotWidth = bgCanvas.width / NUM_ROOTS;
            const slotIndex = Math.floor(Math.random() * NUM_ROOTS);
            const x = slotWidth * slotIndex + slotWidth / 2;
            const isSlotOccupied = rootBranches.some(b => Math.abs(b.x - x) < 1);
            if (!isSlotOccupied) {
                const startY = -20;
                const endY = Math.random() * (bgCanvas.height / (MAX_DEPTH + 1)) * 0.8 + 20;
                rootBranches.push(new VBranch(x, startY, endY, 0, slotWidth));
            }
        }
        rootBranches = rootBranches.filter(b => {
            let lowestY = b.startY;
            function findLowestY(branch) {
                lowestY = Math.max(lowestY, branch.currentY);
                branch.children.forEach(findLowestY);
            }
            findLowestY(b);
            return lowestY < bgCanvas.height + 50;
        });
        rootBranches.forEach(b => {
            b.update();
            b.draw(ctx);
        });
        requestAnimationFrame(animateBackground);
    }
    animateBackground();


    // --- Page Navigation ---
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            mobileMenu.classList.add('hidden');
        }
    });


    cards.forEach(card => {
        card.addEventListener('click', () => {
            currentTreeType = card.dataset.type;
            const cardTitleHTML = card.querySelector('h2').innerHTML;
            visualizerTitle.innerHTML = cardTitleHTML;
            
            // Reset UI states
            balanceBstBtn.classList.add('hidden');
            
            if (currentTreeType === 'BST') {
                inputDescription.textContent = 'Input an array to convert to a BST.';
                inputHelper.textContent = "Enter numbers separated by commas. e.g., 8, 3, 10, 1, 6, 14";
                treeInput.placeholder = "e.g., 8, 3, 10, 1, 6, 14";
                balanceBstBtn.classList.remove('hidden');
            } else if (currentTreeType === 'BT') {
                inputDescription.textContent = 'Input is level-by-level order.';
                inputHelper.textContent = "Enter numbers separated by commas. Use 'null' for empty nodes.";
                treeInput.placeholder = "e.g., 1, 2, 3, null, 5";
            } else if (currentTreeType === 'TRIE') {
                inputDescription.textContent = 'Input words to build the Trie.';
                inputHelper.textContent = "Enter words separated by commas.";
                treeInput.placeholder = "e.g., apple, app, apply";
            }

            homePage.classList.add('hidden');
            visualizerPage.classList.remove('hidden');
        });
    });

    backBtn.addEventListener('click', () => {
        visualizerPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        clearCanvas();
        treeInput.value = '';
        currentRoot = null;
        generatePyBtn.classList.add('hidden');
        balanceBstBtn.classList.add('hidden');
    });

    // --- Tree Logic ---

    class Node { // For BT and BST
        constructor(value) {
            this.value = value;
            this.left = null;
            this.right = null;
            this.parent = null;
            this.x = 0; this.y = 0;
        }
    }

    class TrieNode {
        constructor(value = '') {
            this.value = value;
            this.children = {};
            this.isEndOfWord = false;
            this.x = 0;
            this.y = 0;
            this.width = 0; // Width of the subtree rooted at this node
        }
    }


    function parseInput(input, type) {
        if (!input.trim()) return [];
        if (type === 'TRIE') {
            return input.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
        }
        return input.split(',').map(item => {
            const trimmed = item.trim();
            if (trimmed.toLowerCase() === 'null' || trimmed === '') return null;
            const num = Number(trimmed);
            return isNaN(num) ? 'error' : num;
        });
    }

    // --- Tree Construction ---
    function buildTrie(words) {
        const root = new TrieNode('root');
        words.forEach(word => {
            let currentNode = root;
            for (const char of word) {
                if (!currentNode.children[char]) {
                    currentNode.children[char] = new TrieNode(char);
                }
                currentNode = currentNode.children[char];
            }
            currentNode.isEndOfWord = true;
        });
        return root;
    }


    function buildTreeFromLevelOrder(arr) {
        if (!arr || arr.length === 0 || arr[0] === null) return null;
        const root = new Node(arr[0]);
        const queue = [root];
        let i = 1;
        while (queue.length > 0 && i < arr.length) {
            const currentNode = queue.shift();
            if (arr[i] !== null && arr[i] !== undefined) {
                currentNode.left = new Node(arr[i]);
                currentNode.left.parent = currentNode;
                queue.push(currentNode.left);
            }
            i++;
            if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
                currentNode.right = new Node(arr[i]);
                currentNode.right.parent = currentNode;
                queue.push(currentNode.right);
            }
            i++;
        }
        return root;
    }
    
    function buildBST(arr) {
        if (!arr || arr.length === 0 || arr[0] === null) return null;
        const root = new Node(arr[0]);
        function insertNode(node, value) {
            if (value < node.value) {
                if (node.left === null) {
                    node.left = new Node(value);
                    node.left.parent = node;
                } else insertNode(node.left, value);
            } else {
                if (node.right === null) {
                    node.right = new Node(value);
                    node.right.parent = node;
                } else insertNode(node.right, value);
            }
        }
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== null) {
               insertNode(root, arr[i]);
            }
        }
        return root;
    }

    function treeToLevelOrderArray(root) {
        if (!root) return [];
        const queue = [root];
        const result = [];
        let lastNonNullIndex = 0;
        while(queue.length > 0) {
            const node = queue.shift();
            if (node) {
                result.push(node.value);
                lastNonNullIndex = result.length -1;
                queue.push(node.left);
                queue.push(node.right);
            } else {
                result.push(null);
            }
        }
        return result.slice(0, lastNonNullIndex + 1);
    }

    // --- Visualization Logic ---

    function clearCanvas() {
        canvas.innerHTML = '';
        masterGroup = null;
        scale = 1;
        translateX = 0;
        translateY = 0;
    }
    
    function getTreeDepth(node) {
        if (!node) return 0;
        return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
    }

    function drawTrie(root) {
        clearCanvas();
        if (!root) {
            generatePyBtn.classList.add('hidden');
            return;
        }
        generatePyBtn.classList.add('hidden'); // No python code for trie yet

        const svgNS = "http://www.w3.org/2000/svg";
        masterGroup = document.createElementNS(svgNS, 'g');
        canvas.appendChild(masterGroup);

        const nodeRadius = 20;
        const horizontalSpacing = 50;
        const verticalSpacing = 80;
        
        const nodes = [];
        const edges = [];

        function calculateTrieLayout(node, depth = 0) {
            const children = Object.values(node.children);
            let subtreeWidth = 0;
            
            if (children.length === 0) {
                node.width = horizontalSpacing;
                return;
            }
            
            children.forEach(child => {
                calculateTrieLayout(child, depth + 1);
                subtreeWidth += child.width;
            });
            
            node.width = Math.max(subtreeWidth, horizontalSpacing);
        }

        function assignTrieCoordinates(node, x, y) {
            node.x = x;
            node.y = y;
            nodes.push(node);
            
            const children = Object.values(node.children);
            const totalChildrenWidth = children.reduce((acc, child) => acc + child.width, 0);
            
            let currentX = x - totalChildrenWidth / 2;
            
            children.forEach(child => {
                const childX = currentX + child.width / 2;
                assignTrieCoordinates(child, childX, y + verticalSpacing);
                edges.push({ from: node, to: child });
                currentX += child.width;
            });
        }
        
        calculateTrieLayout(root);
        assignTrieCoordinates(root, 0, 0);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;

        const canvasWidth = canvasContainer.clientWidth;
        const canvasHeight = canvasContainer.clientHeight;
        const scaleX = canvasWidth / (treeWidth + horizontalSpacing * 2);
        const scaleY = canvasHeight / (treeHeight + verticalSpacing * 2);
        scale = Math.min(1, scaleX, scaleY);

        translateX = (canvasWidth / 2) - ((minX + maxX) / 2) * scale;
        translateY = (canvasHeight - treeHeight * scale) / 2 - minY * scale;
        updateTransform();

        // Draw edges first
        edges.forEach(edge => {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', edge.from.x);
            line.setAttribute('y1', edge.from.y);
            line.setAttribute('x2', edge.to.x);
            line.setAttribute('y2', edge.to.y);
            line.setAttribute('class', 'edge');
            masterGroup.appendChild(line);
        });

        // Draw nodes on top of edges
        nodes.forEach(node => {
            const g = document.createElementNS(svgNS, 'g');
            g.setAttribute('class', 'node');
             if (node.isEndOfWord) {
                g.classList.add('is-end-of-word');
            }
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('r', nodeRadius);
            circle.setAttribute('fill', '#0f172a');

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('dy', '.3em');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = node.value === 'root' ? ' ' : node.value; // Don't show text for root

            g.appendChild(circle);
            g.appendChild(text);
            masterGroup.appendChild(g);
        });
    }

    function drawTree(root) {
        clearCanvas();
        if (!root) {
            generatePyBtn.classList.add('hidden');
            return;
        }
        generatePyBtn.classList.remove('hidden');

        const svgNS = "http://www.w3.org/2000/svg";
        masterGroup = document.createElementNS(svgNS, 'g');
        canvas.appendChild(masterGroup);

        const nodeRadius = 20;
        const horizontalSpacing = 50;
        const verticalSpacing = 80;

        const depth = getTreeDepth(root);
        const requiredWidth = Math.pow(2, depth - 1) * horizontalSpacing;

        const nodes = [];
        const edges = [];

        function assignCoordinates(node, level, index) {
            if (!node) return;
            node.y = level * verticalSpacing;
            const nodesAtLevel = Math.pow(2, level);
            const segmentWidth = requiredWidth / nodesAtLevel;
            node.x = segmentWidth * (index - (nodesAtLevel - 1) / 2);
            
            nodes.push(node);
            if (node.left) {
                edges.push({ from: node, to: node.left });
                assignCoordinates(node.left, level + 1, index * 2);
            }
            if (node.right) {
                edges.push({ from: node, to: node.right });
                assignCoordinates(node.right, level + 1, index * 2 + 1);
            }
        }

        assignCoordinates(root, 0, 0);

        let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });

        const treeWidth = maxX - minX;
        const treeHeight = maxY;

        const canvasWidth = canvasContainer.clientWidth;
        const canvasHeight = canvasContainer.clientHeight;
        const scaleX = canvasWidth / (treeWidth + horizontalSpacing * 2);
        const scaleY = canvasHeight / (treeHeight + verticalSpacing * 2);
        scale = Math.min(1, scaleX, scaleY);

        translateX = (canvasWidth / 2) - (minX * scale + treeWidth * scale / 2);
        translateY = (canvasHeight - treeHeight * scale) / 2;
        updateTransform();

        edges.forEach(edge => {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', edge.from.x);
            line.setAttribute('y1', edge.from.y);
            line.setAttribute('x2', edge.to.x);
            line.setAttribute('y2', edge.to.y);
            line.setAttribute('class', 'edge');
            masterGroup.appendChild(line);
        });

        nodes.forEach(node => {
            const g = document.createElementNS(svgNS, 'g');
            g.setAttribute('class', 'node');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('r', nodeRadius);
            circle.setAttribute('fill', '#0f172a'); // slate-900

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('dy', '.3em');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = node.value;

            g.appendChild(circle);
            g.appendChild(text);
            masterGroup.appendChild(g);

            // In-place editing
            g.addEventListener('click', (event) => {
                event.stopPropagation();
                if (g.querySelector('foreignObject')) return;
                const textElement = g.querySelector('text');
                textElement.style.visibility = 'hidden';
                const fo = document.createElementNS(svgNS, 'foreignObject');
                fo.setAttribute('x', -nodeRadius);
                fo.setAttribute('y', -15);
                fo.setAttribute('width', nodeRadius * 2);
                fo.setAttribute('height', 30);
                const input = document.createElement('input');
                input.setAttribute('type', 'number');
                input.value = node.value;
                input.style.cssText = `width: 100%; height: 100%; background-color: #1e293b; border: 1px solid #6366f1; border-radius: 4px; color: #f1f5f9; text-align: center; font-size: 1rem; font-weight: 600; font-family: 'Poppins', sans-serif; outline: none;`;
                fo.appendChild(input);
                g.appendChild(fo);
                input.focus();
                input.select();
                const finishEdit = () => {
                    const newValueRaw = input.value;
                    if (g.contains(fo)) g.removeChild(fo);
                    textElement.style.visibility = 'visible';
                    if (newValueRaw === null || newValueRaw.trim() === '') return;
                    const newValue = Number(newValueRaw);
                    if (isNaN(newValue) || node.value === newValue) return;
                    if (currentTreeType === 'BST') {
                        const bstValues = [];
                        function getValues(n) { if (!n) return; bstValues.push(n.value); getValues(n.left); getValues(n.right); }
                        getValues(currentRoot);
                        const index = bstValues.indexOf(node.value);
                        if (index > -1) bstValues[index] = newValue;
                        treeInput.value = bstValues.join(', ');
                    } else {
                        node.value = newValue;
                        const newArray = treeToLevelOrderArray(currentRoot);
                        treeInput.value = newArray.map(v => v === null ? 'null' : v).join(', ');
                    }
                    visualizeBtn.click();
                };
                input.addEventListener('blur', finishEdit, { once: true });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') input.blur();
                    if (e.key === 'Escape') { if (g.contains(fo)) g.removeChild(fo); textElement.style.visibility = 'visible'; }
                });
            });

            // Add Child Buttons
            if (currentTreeType !== 'BST') {
                const directions = [{ side: 'left', x: -25, y: 25 }, { side: 'right', x: 25, y: 25 }];
                directions.forEach(({ side, x, y }) => {
                    if (node[side] === null) {
                        const addBtn = document.createElementNS(svgNS, 'g');
                        addBtn.setAttribute('class', 'action-btn add-btn');
                        addBtn.setAttribute('transform', `translate(${x}, ${y})`);
                        const btnCircle = document.createElementNS(svgNS, 'circle');
                        btnCircle.setAttribute('r', '10');
                        const btnText = document.createElementNS(svgNS, 'text');
                        btnText.setAttribute('dy', '.35em');
                        btnText.setAttribute('text-anchor', 'middle');
                        btnText.textContent = '+';
                        addBtn.appendChild(btnCircle);
                        addBtn.appendChild(btnText);
                        g.appendChild(addBtn);
                        addBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            node[side] = new Node(0);
                            node[side].parent = node;
                            const newArray = treeToLevelOrderArray(currentRoot);
                            treeInput.value = newArray.map(v => v === null ? 'null' : v).join(', ');
                            visualizeBtn.click();
                        });
                    }
                });
            }
            
            // Delete Button
            const deleteBtn = document.createElementNS(svgNS, 'g');
            deleteBtn.setAttribute('class', 'action-btn delete-btn');
            deleteBtn.setAttribute('transform', 'translate(0, -35)');
            const btnCircle = document.createElementNS(svgNS, 'circle');
            btnCircle.setAttribute('r', '10');
            const btnText = document.createElementNS(svgNS, 'text');
            btnText.setAttribute('dy', '.35em');
            btnText.setAttribute('text-anchor', 'middle');
            btnText.textContent = '×';
            deleteBtn.appendChild(btnCircle);
            deleteBtn.appendChild(btnText);
            g.appendChild(deleteBtn);
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!node.parent) {
                    currentRoot = null;
                } else {
                    if (node.parent.left === node) {
                        node.parent.left = null;
                    } else {
                        node.parent.right = null;
                    }
                }
                const newArray = treeToLevelOrderArray(currentRoot);
                treeInput.value = newArray.map(v => v === null ? 'null' : v).join(', ');
                visualizeBtn.click();
            });
        });
    }
    
    // --- Pan and Zoom Handlers ---
    function updateTransform() {
        if (masterGroup) {
            masterGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
        }
    }
    canvasContainer.addEventListener('mousedown', (e) => { isPanning = true; startX = e.clientX - translateX; startY = e.clientY - translateY; canvasContainer.classList.add('panning'); });
    canvasContainer.addEventListener('mousemove', (e) => { if (!isPanning) return; e.preventDefault(); translateX = e.clientX - startX; translateY = e.clientY - startY; updateTransform(); });
    canvasContainer.addEventListener('mouseup', () => { isPanning = false; canvasContainer.classList.remove('panning'); });
    canvasContainer.addEventListener('mouseleave', () => { isPanning = false; canvasContainer.classList.remove('panning'); });
    canvasContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const { clientX, clientY } = e;
        const rect = canvasContainer.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        translateX = x - (x - translateX) * (newScale / scale);
        translateY = y - (y - translateY) * (newScale / scale);
        scale = newScale;
        updateTransform();
    });

    // --- Toast Notification Logic ---
    function showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-cyan-600'
        };
        const toast = document.createElement('div');
        toast.className = `glass-panel ${colors[type]} text-white px-4 py-2 rounded-lg shadow-xl transition-all duration-300 opacity-0 transform translate-y-5`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-5');
        });

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-5');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 2000);
    }

    // --- Event Listeners ---
    visualizeBtn.addEventListener('click', () => {
        const rawInput = treeInput.value;
        const parsedArr = parseInput(rawInput, currentTreeType);
        
        if (currentTreeType !== 'TRIE' && parsedArr.includes('error')) {
            showToast('Invalid input. Please use numbers and commas only.', 'error');
            currentRoot = null; clearCanvas(); generatePyBtn.classList.add('hidden'); return;
        }

        if (currentTreeType === 'BST' || currentTreeType === 'BT') {
            const cleanArr = parsedArr.filter(val => val !== null);
            if (currentTreeType === 'BST' && new Set(cleanArr).size !== cleanArr.length) {
                showToast('BST input cannot contain duplicate values.', 'error');
                currentRoot = null; clearCanvas(); generatePyBtn.classList.add('hidden'); return;
            }
            currentRoot = (currentTreeType === 'BST') ? buildBST(cleanArr) : buildTreeFromLevelOrder(parsedArr);
            drawTree(currentRoot);
        } else if (currentTreeType === 'TRIE') {
            currentRoot = buildTrie(parsedArr);
            drawTrie(currentRoot);
        }
        
        if(currentRoot) {
            showToast('Visualization complete!', 'success');
        }
    });

    window.addEventListener('resize', () => { 
        if(currentRoot) { 
            if (currentTreeType === 'TRIE') {
                drawTrie(currentRoot);
            } else {
                drawTree(currentRoot); 
            }
        } 
    });

    // Balance BST Logic
    function balanceBST(root) {
        const sortedValues = [];
        function inOrderTraversal(node) {
            if (!node) return;
            inOrderTraversal(node.left);
            sortedValues.push(node.value);
            inOrderTraversal(node.right);
        }
        inOrderTraversal(root);

        function buildBalancedTree(values) {
            if (!values.length) return null;
            const midIndex = Math.floor(values.length / 2);
            const node = new Node(values[midIndex]);
            node.left = buildBalancedTree(values.slice(0, midIndex));
            if (node.left) node.left.parent = node;
            node.right = buildBalancedTree(values.slice(midIndex + 1));
            if (node.right) node.right.parent = node;
            return node;
        }
        return buildBalancedTree(sortedValues);
    }

    balanceBstBtn.addEventListener('click', () => {
        if (!currentRoot || currentTreeType !== 'BST') {
            showToast('Can only balance a Binary Search Tree.', 'error');
            return;
        }
        currentRoot = balanceBST(currentRoot);
        const newArray = treeToLevelOrderArray(currentRoot);
        treeInput.value = newArray.map(v => v === null ? 'null' : v).join(', ');
        drawTree(currentRoot);
        showToast('BST has been balanced!', 'success');
    });


    // --- Python Code Generation ---
    function generatePythonCode(root) {
        if (!root) return { detailed: "# Tree is empty", oneliner: "# Tree is empty" };
        let detailedCode = 'class TreeNode:\n';
        detailedCode += '    def __init__(self, val=0, left=None, right=None):\n';
        detailedCode += '        self.val = val\n';
        detailedCode += '        self.left = left\n';
        detailedCode += '        self.right = right\n\n';
        const nodesToProcess = [root];
        const nodeMap = new Map();
        nodeMap.set(root, 'root');
        let nodeId = 0;
        const creationLines = [`root = TreeNode(${root.value})`];
        const connectionLines = [];
        while (nodesToProcess.length > 0) {
            const currentNode = nodesToProcess.shift();
            const parentName = nodeMap.get(currentNode);
            if (currentNode.left) {
                nodeId++; const leftChildName = `node_${nodeId}`;
                nodeMap.set(currentNode.left, leftChildName);
                creationLines.push(`${leftChildName} = TreeNode(${currentNode.left.value})`);
                connectionLines.push(`${parentName}.left = ${leftChildName}`);
                nodesToProcess.push(currentNode.left);
            }
            if (currentNode.right) {
                nodeId++; const rightChildName = `node_${nodeId}`;
                nodeMap.set(currentNode.right, rightChildName);
                creationLines.push(`${rightChildName} = TreeNode(${currentNode.right.value})`);
                connectionLines.push(`${parentName}.right = ${rightChildName}`);
                nodesToProcess.push(currentNode.right);
            }
        }
        detailedCode += '# Node definitions\n' + creationLines.join('\n') + '\n\n# Connections\n' + connectionLines.join('\n');
        function generateOneLiner(node) {
            if (!node) return 'None';
            if (!node.left && !node.right) return `TreeNode(${node.value})`;
            return `TreeNode(${node.value}, ${generateOneLiner(node.left)}, ${generateOneLiner(node.right)})`;
        }
        const oneLiner = `root = ${generateOneLiner(root)}`;
        return { detailed: detailedCode, oneliner: oneLiner };
    }

    generatePyBtn.addEventListener('click', () => {
        if (!currentRoot || currentTreeType === 'TRIE') { 
            showToast("Please visualize a tree first (Code gen not available for Tries).", "error"); 
            return; 
        }
        const { detailed, oneliner } = generatePythonCode(currentRoot);
        pythonCodeDetailed.textContent = detailed;
        pythonCodeOneliner.textContent = oneliner;
        codeModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => codeModal.classList.add('hidden'));
    codeModal.addEventListener('click', (e) => { if (e.target === codeModal) { codeModal.classList.add('hidden'); } });
    
    function showAboutModal() {
        aboutModal.classList.remove('opacity-0', 'pointer-events-none');
        requestAnimationFrame(() => {
            aboutModal.classList.add('show');
        });
    }
    function hideAboutModal() {
        aboutModal.classList.remove('show');
        setTimeout(() => {
            aboutModal.classList.add('opacity-0', 'pointer-events-none');
        }, 300);
    }

    homeAboutBtn.addEventListener('click', showAboutModal);
    mobileAboutBtn.addEventListener('click', showAboutModal);
    closeAboutModalBtn.addEventListener('click', hideAboutModal);
    aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) { hideAboutModal(); } });


    function copyToClipboard(text, button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            button.textContent = 'Copied!';
        } catch (err) {
            button.textContent = 'Failed!';
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
        setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    }
    copyDetailedBtn.addEventListener('click', () => copyToClipboard(pythonCodeDetailed.textContent, copyDetailedBtn));
    copyOnelinerBtn.addEventListener('click', () => copyToClipboard(pythonCodeOneliner.textContent, copyOnelinerBtn));
});

