<template>
    <div class="whiteboard-container">
        <div class="user-list">
            <h3>Live Users</h3>
            <ul>
                <li v-for="user in users" :key="user.id">{{ user.username }} is live</li>
            </ul>
        </div>
        <div class="toolbar-container">
            <button @click="selectTool('pen')">
                <img src="@/assets/pencil.png" alt="Pen" class="icon" />
            </button>
            <button @click="selectTool('rectangle')">
                <img src="@/assets/rectangle.png" alt="Rectangle" class="icon" />
            </button>
            <button @click="selectTool('circle')">
                <img src="@/assets/circle.png" alt="Circle" class="icon" />
            </button>
            <input type="color" v-model="currentColor" />
            <button @click="clearCanvas">
                <img src="@/assets/Clear.png" alt="Clear" class="icon" />
            </button>
            <button @click="saveDrawing">Save</button>

        </div>
        <canvas id="canvas" @mousedown="startDrawing" @mouseup="stopDrawing" @mousemove="draw"
            @touchstart="startDrawing" @touchmove="draw" @touchend="stopDrawing"></canvas>
    </div>
</template>

<script>
import { saveDrawing, getDrawings } from '@/services/api';
import { saveDrawingOffline, getOfflineDrawings } from '@/services/indexedDB';

export default {
    props: ['username', 'roomId', 'users'],
    data() {
        return {
            canvas: null,
            context: null,
            isDrawing: false,
            currentTool: 'pen',
            currentColor: '#000000',
            startX: 0,
            startY: 0,
            shapes: [],
        };
    },
    mounted() {
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);
        this.setupWebSocket();
        this.loadDrawing();
    },
    watch: {
        users: {
            handler(newUsers) {
                this.loadDrawing();
            },
            immediate: true,
        },
    },
    methods: {
        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.redrawCanvas();
        },
        getEventCoordinates(event) {
            if (event.touches) {
                const touch = event.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                return {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                };
            } else {
                return { x: event.offsetX, y: event.offsetY };
            }
        },
        selectTool(tool) {
            this.currentTool = tool;
        },
        startDrawing(e) {
            e.preventDefault();
            this.isDrawing = true;
            const { x, y } = this.getEventCoordinates(e);
            this.startX = x;
            this.startY = y;

            if (this.currentTool === 'pen') {
                this.context.beginPath();
                this.context.moveTo(x, y);
            }
        },
        stopDrawing(e) {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            const { x, y } = this.getEventCoordinates(e);

            if (this.currentTool !== 'pen') {

                const shape = {
                    tool: this.currentTool,
                    startX: this.startX,
                    startY: this.startY,
                    endX: x,
                    endY: y,
                    color: this.currentColor,
                };
                this.shapes.push(shape);
                this.$socket.emit('draw', { roomId: this.roomId, type: 'shape', data: shape });
            }

            this.redrawCanvas();
        },
        draw(e) {
            if (!this.isDrawing) return;
            e.preventDefault();
            const { x, y } = this.getEventCoordinates(e);

            if (this.currentTool === 'pen') {
                this.context.lineTo(x, y);
                this.context.strokeStyle = this.currentColor;
                this.context.lineWidth = 2;
                this.context.stroke();

                const stroke = {
                    tool: 'pen',
                    fromX: this.startX,
                    fromY: this.startY,
                    toX: x,
                    toY: y,
                    color: this.currentColor,
                };
                this.shapes.push(stroke);
                this.$socket.emit('draw', { roomId: this.roomId, type: 'pen', data: stroke });
                this.startX = x;
                this.startY = y;
            } else {
               
                this.redrawCanvas();

                this.context.strokeStyle = this.currentColor;
                this.context.lineWidth = 2;

                if (this.currentTool === 'rectangle') {
                    const width = x - this.startX;
                    const height = y - this.startY;
                    this.context.strokeRect(this.startX, this.startY, width, height);
                } else if (this.currentTool === 'circle') {
                    const radius = Math.sqrt(
                        (this.startX - x) ** 2 + (this.startY - y) ** 2
                    );
                    this.context.beginPath();
                    this.context.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
                    this.context.stroke();
                }
            }
        },
        drawShape(shape) {
            this.context.strokeStyle = shape.color;
            this.context.lineWidth = 2;
            if (shape.tool === 'rectangle') {
                const width = shape.endX - shape.startX;
                const height = shape.endY - shape.startY;
                this.context.strokeRect(shape.startX, shape.startY, width, height);
            } else if (shape.tool === 'circle') {
                const radius = Math.sqrt(
                    (shape.startX - shape.endX) ** 2 + (shape.startY - shape.endY) ** 2
                );
                this.context.beginPath();
                this.context.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
                this.context.stroke();
            }
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.shapes = [];
            this.$socket.emit('clear-canvas', { roomId: this.roomId });
        },
        setupWebSocket() {
            const socket = this.$socket;
            socket.on('draw', (data) => {
                if (data.roomId !== this.roomId) return;
                const { type, data: drawData } = data;
                this.shapes.push(drawData);
                if (type === 'pen') {
                    this.context.strokeStyle = drawData.color;
                    this.context.lineWidth = 2;
                    this.context.beginPath();
                    this.context.moveTo(drawData.fromX, drawData.fromY);
                    this.context.lineTo(drawData.toX, drawData.toY);
                    this.context.stroke();
                } else if (type === 'shape') {
                    this.drawShape(drawData);
                }
            });
            socket.on('clear-canvas', () => {
                this.clearCanvas();
            });
        },
        async saveDrawing() {
            const drawingData = this.shapes;
            try {
                await saveDrawing(this.roomId, drawingData);
                alert('Drawing saved to server!');
            } catch (error) {
                console.error('Error saving drawing:', error);
                await saveDrawingOffline({ roomId: this.roomId, drawingData });
                alert('Server unreachable. Drawing saved locally.');
            }
        },
        async loadDrawing() {
            try {
                const response = await getDrawings(this.roomId);
                const drawings = response.data;
                if (drawings.length > 0) {
                    this.shapes = drawings[0].drawingData;
                    this.redrawCanvas();
                    console.log('Drawings loaded from server!');
                }
            } catch (error) {
                console.error('Error loading drawings:', error);
                const offlineDrawings = await getOfflineDrawings();
                if (offlineDrawings.length > 0) {
                    this.shapes = offlineDrawings[0].drawingData;
                    this.redrawCanvas();
                    console.log('Loaded drawings from local storage.');
                }
            }
        },
        redrawCanvas() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.shapes.forEach((shape) => {
                if (shape.tool === 'pen') {
                    this.context.strokeStyle = shape.color;
                    this.context.lineWidth = 2;
                    this.context.beginPath();
                    this.context.moveTo(shape.fromX, shape.fromY);
                    this.context.lineTo(shape.toX, shape.toY);
                    this.context.stroke();
                } else {
                    this.drawShape(shape);
                }
            });
        },
    },
};
</script>

<style scoped>
.whiteboard-container {
    position: relative;
    width: 100%;
    height: 100vh;
}

canvas {
    border: 1px solid #ccc;
    width: 100%;
    height: auto;
    margin-top: 0%;
}

.user-list {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 10px;
}

.user-list h3 {
    margin: 0 0 10px;
    font-size: 18px;
    color: #333;
}

.user-list ul {
    list-style-type: none;
    padding: 0;
}

.user-list li {
    padding: 5px 0;
    color: #555;
    font-size: 15px;
    transition: background-color 0.2s;
}

.user-list li:hover {
    background-color: #f9f9f9;
}

.toolbar-container {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 50px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;

}

.icon {
    width: 30px;
    height: 30px;
    cursor: pointer;
}

.user-list {
    align-items: center;
}
</style>