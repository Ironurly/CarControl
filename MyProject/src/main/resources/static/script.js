const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
document.addEventListener('contextmenu', function (event) {
    event.preventDefault(); // Предотвращаем отображение контекстного меню
});
canvas.width = 800;
canvas.height = 600;
let k;
let isDrawing = false;
let startX, startY;
let walls = [];
const rect = canvas.getBoundingClientRect();
let tempLine = null;
let numberOfChildren;
let i;
let currentGeneration;
const deltaTime = 1000 / 60;
let bestChild;
let Points = {
    xc: canvas.width / 2 - 150, // Начальная точка по умолчанию в центре canvas
    yc: canvas.height / 2 + 150,
    xe: canvas.width / 2 + 150,
    ye: canvas.height / 2 - 150
};

class Parent {
    constructor(rules) {
        this.score = Infinity;
        this.rules = rules.slice(); // Клонируем массив правил, чтобы сохранить его порядок
        this.car = { // Машинка для каждого родителя
            x: Points.xc,
            y: Points.yc,
            width: 28,
            height: 16,
            color: 'red',
            maxSpeed: 2,
            acceleration: 0.07,
            deceleration: 0.03,
            currentSpeed: 0,
            angle: 0,
            turnSpeed: 2,
            driftFactor: 0.02,
            velocityX: 0,
            velocityY: 0
        };
        this.isAlive = true;
        this.currentRuleIndex = 0; // Текущий индекс правила
        this.timeElapsed = 0; // Время, прошедшее с начала выполнения правила
        this.children = [];
    }

    createChildren() {
        this.children = []; // Очищаем предыдущие дети
        const array = ['w', 'a', 's', 'd', 'sd', 'as', 'wd', 'wa'];

        let lastChild = new Parent([...this.rules]);
        lastChild.currentRuleIndex = 0;
        this.children.push(lastChild);

        let prevModifiedRules = [...this.rules];
        prevModifiedRules.splice(-2);
        let prevChild = new Parent(prevModifiedRules);
        prevChild.currentRuleIndex = 0;
        this.children.push(prevChild);

        // новая ветвь создания поколений
        // создаем детей с пропорциональным шансом удаления правил
        for (let i = 0; i < numberOfChildren - 2; i++) {
            let modifiedRules = [...this.rules];
            
            // Пропорционально выбираем количество правил для удаления
            let rulesToDelete;
            let rand = Math.random().toFixed(2);

            if (rand < 0.4) {
                rulesToDelete = 0;

            } else if (rand < 0.7) {
                rulesToDelete = 1;

            } else if (rand < 0.85) {
                rulesToDelete = 2;

            } else if (rand < 0.92) {
                rulesToDelete = 3;

            } else if (rand < 0.96) {
                rulesToDelete = 4;

            } else if (rand < 0.99) {
                rulesToDelete = 5;

            } else {
                rulesToDelete = 6;

            }
            let rulesToAdd;
            rand = Math.random().toFixed(2);
            if (rand < 0.3) {
                rulesToAdd = 0;

            } else if (rand < 0.6) {
                rulesToAdd = 1;

            } else if (rand < 0.8) {
                rulesToAdd = 2;

            } else if (rand < 0.9) {
                rulesToAdd = 3;

            } else if (rand < 0.95) {
                rulesToAdd = 4;

            } else {
                rulesToAdd = 5;

            }
            if (modifiedRules.length >= rulesToDelete) {
                modifiedRules.splice(-rulesToDelete * 2); // Удаляем нужное количество правил
            }

            for (let i = 0; i < rulesToAdd; i++) {
                // Добавляем новое случайное правило
                modifiedRules.push(array[Math.floor(Math.random() * array.length)]);
                modifiedRules.push((Math.random()).toFixed(4));
            }
            let child = new Parent(modifiedRules);
            child.currentRuleIndex = 0;
            this.children.push(child);
        }


    }
    display() {
        return `Value1: ${this.rules} Score: ${this.score}`;
    }

    updateCarPosition(deltaTime) {

        if (this.currentRuleIndex >= this.rules.length) {

            let minDistanceToWall = Infinity;
            if (walls.length === 0) {
                minDistanceToWall = k;
            } else {
                walls.forEach(wall => {
                    const distance = distanceToSegment(this.car.x, this.car.y, wall.x1, wall.y1, wall.x2, wall.y2);
                    if (distance < minDistanceToWall) {
                        minDistanceToWall = distance;
                    }
                });
                if (k / minDistanceToWall <= 0.25) {
                    minDistanceToWall = k * 0.25;
                }
            }
            this.score = Math.sqrt((Points.xe - this.car.x) * (Points.xe - this.car.x) + (Points.ye - this.car.y) * (Points.ye - this.car.y)) * (k / minDistanceToWall);
            this.isAlive = false;

            return;
        } else if (!this.isAlive) {
            this.score += 10000;
            return;
        }

        const key = this.rules[this.currentRuleIndex];
        const duration = this.rules[this.currentRuleIndex + 1] * 1000;
        this.timeElapsed += deltaTime;
        
        if (this.timeElapsed >= duration) {
            // Переходим к следующему правилу
            this.currentRuleIndex += 2;
            this.timeElapsed = 0;
        } else {
            // Выполняем текущее правило
            this.applyKey(key);
        }
        // Обновление положения машины

        this.updatePhysics();
        ctx.save();
        ctx.translate(this.car.x, this.car.y);
        ctx.rotate(degToRad(this.car.angle));
        ctx.fillStyle = this.car.color;
        ctx.fillRect(-this.car.width / 2, -this.car.height / 2, this.car.width, this.car.height);
        ctx.restore();
    }

    applyKey(key) {
        if (key === 'w') {
            this.car.currentSpeed = Math.min(this.car.currentSpeed + this.car.acceleration, this.car.maxSpeed);
        } else if (key === 's') {
            this.car.currentSpeed = Math.max(this.car.currentSpeed - this.car.acceleration, -this.car.maxSpeed);
        } else if (key === 'a') {
            this.car.angle -= this.car.turnSpeed;
        } else if (key === 'd') {
            this.car.angle += this.car.turnSpeed;
        } else if (key === 'wa') {
            this.car.currentSpeed = Math.min(this.car.currentSpeed + this.car.acceleration, this.car.maxSpeed);
            this.car.angle -= this.car.turnSpeed;
        } else if (key === 'wd') {
            this.car.currentSpeed = Math.min(this.car.currentSpeed + this.car.acceleration, this.car.maxSpeed);
            this.car.angle += this.car.turnSpeed;
        } else if (key === 'as') {
            this.car.currentSpeed = Math.max(this.car.currentSpeed - this.car.acceleration, -this.car.maxSpeed);
            this.car.angle -= this.car.turnSpeed;
        } else if (key === 'sd') {
            this.car.currentSpeed = Math.max(this.car.currentSpeed - this.car.acceleration, -this.car.maxSpeed);
            this.car.angle += this.car.turnSpeed;
        } 
    }

    updatePhysics() {
        const directionX = Math.cos(degToRad(this.car.angle));
        const directionY = Math.sin(degToRad(this.car.angle));
        this.car.velocityX += (directionX * this.car.currentSpeed - this.car.velocityX) * this.car.driftFactor;
        this.car.velocityY += (directionY * this.car.currentSpeed - this.car.velocityY) * this.car.driftFactor;
        this.car.x += this.car.velocityX;
        this.car.y += this.car.velocityY;
        if (checkCollision(this.car)) {
            this.isAlive = false;
        } 
    }

    getBestChild() {
        return this.children.reduce((best, child) => child.score < best.score ? child : best, this.children[0]);
    }

    displayChildren() {
        return this.children.map(child => child.display());
    }
    areAllChildrenDead() {
        return this.children.every(child => !child.isAlive);
    }
}

// Отрисовка трассы
function drawTrack() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    walls.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    });
}

function drawSpawn(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
}

function checkCollision(car) {
    const corners = [
        {
            x: car.x + Math.cos(degToRad(car.angle)) * car.width / 2 - Math.sin(degToRad(car.angle)) * car.height / 2,
            y: car.y + Math.sin(degToRad(car.angle)) * car.width / 2 + Math.cos(degToRad(car.angle)) * car.height / 2
        },
        {
            x: car.x - Math.cos(degToRad(car.angle)) * car.width / 2 - Math.sin(degToRad(car.angle)) * car.height / 2,
            y: car.y - Math.sin(degToRad(car.angle)) * car.width / 2 + Math.cos(degToRad(car.angle)) * car.height / 2
        },
        {
            x: car.x + Math.cos(degToRad(car.angle)) * car.width / 2 + Math.sin(degToRad(car.angle)) * car.height / 2,
            y: car.y + Math.sin(degToRad(car.angle)) * car.width / 2 - Math.cos(degToRad(car.angle)) * car.height / 2
        },
        {
            x: car.x - Math.cos(degToRad(car.angle)) * car.width / 2 + Math.sin(degToRad(car.angle)) * car.height / 2,
            y: car.y - Math.sin(degToRad(car.angle)) * car.width / 2 - Math.cos(degToRad(car.angle)) * car.height / 2
        }
    ];

    for (let i = 0; i < walls.length; i++) {
        const line = walls[i];
        for (let j = 0; j < 4; j++) {
            const next = (j + 1) % 4;
            if (linesIntersect(corners[j].x, corners[j].y, corners[next].x, corners[next].y, line.x1, line.y1, line.x2, line.y2)) {
                return true; // Столкновение произошло
            }
        }
    }
    return false;
}
function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSquared = dx * dx + dy * dy;

    // Если длина отрезка равна нулю, вернуть расстояние до одной из точек
    if (lenSquared === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

    // Найти параметр t для проекции точки на отрезок
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSquared;
    t = Math.max(0, Math.min(1, t)); // Ограничить t в пределах [0, 1]

    // Вычислить проекцию
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    // Найти расстояние от точки до проекции
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}


function drawHeatMap(canvas, walls, finishX, finishY, resolution) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const cellWidth = width / resolution;
    const cellHeight = height / resolution;

    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            // Центр ячейки
            const posX = x * cellWidth + cellWidth / 2;
            const posY = y * cellHeight + cellHeight / 2;

            // Расстояние до финиша
            const distanceToFinish = Math.sqrt((finishX - posX) ** 2 + (finishY - posY) ** 2);

            // Минимальное расстояние до стен
            let minDistanceToWall = Infinity;
            walls.forEach(wall => {
                const distance = distanceToSegment(posX, posY, wall.x1, wall.y1, wall.x2, wall.y2);
                if (distance < minDistanceToWall) {
                    minDistanceToWall = distance;
                }
            });
            // Итоговый "балл"
            const score = distanceToFinish * (k/minDistanceToWall);

            // Нормализация для цветов
            const normalizedScore = Math.min(1, Math.max(0, score / (width + height)));

            // Рисуем ячейку
            ctx.fillStyle = `rgba(${255/2 - normalizedScore * 255}, ${normalizedScore * 255}, 0, 0.6)`;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }
}

function gameLoop() {
    clearCanvas();
    drawTrack(); // Рисуем трассу
    drawSpawn(Points.xc, Points.yc, `green`);
    drawSpawn(Points.xe, Points.ye, `red`);

    // Логика обучения
        if (!currentGeneration.areAllChildrenDead()) {
            // Рисуем и обновляем машинки текущего поколения
            currentGeneration.children.forEach(child => {
                child.updateCarPosition(deltaTime); // Обновляет и рисует
            });
        }

        // Проверяем завершение поколения
        if (currentGeneration.areAllChildrenDead()) {

            console.log("This Generation:", currentGeneration.displayChildren());
            console.log("Generation ended.");

            bestChild = currentGeneration.getBestChild();
            if (bestChild.score <= 10) {
                console.log(
                    `Generation ended. Solution found for child`,
                    bestChild.display(),
                    `****** Needed amount of generations:`,
                    i
                );
                return;
            }

            console.log(`Best Child of Generation ${i}:`, bestChild.display());
            let nextGeneration = new Parent(bestChild.rules);
            nextGeneration.createChildren();
            currentGeneration = nextGeneration;
            i += 1;
            document.getElementById("generationCount").textContent = i;

        }
    if (document.getElementById("tempInput").checked) {
        // Тепловая карта
        drawHeatMap(canvas, walls, Points.xe, Points.ye, 50);
    }
    // Следующий кадр
    requestAnimationFrame(gameLoop);
}

function drawBest() {
    clearCanvas();
    drawTrack(); // Рисуем трассу
    drawSpawn(Points.xc, Points.yc, `green`);
    drawSpawn(Points.xe, Points.ye, `red`);

    
    if (bestChild.isAlive) {
        bestChild.updateCarPosition(deltaTime); // Обновляет и рисует лучшую машинку
    } else {
        console.log(`end/////`);
        return;
    }
    if (document.getElementById("tempInput").checked) {
        // Тепловая карта
        drawHeatMap(canvas, walls, Points.xe, Points.ye, 50);
    }
    requestAnimationFrame(drawBest);
}
function degToRad(deg) {
    return deg * (Math.PI / 180);
}
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return false;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
// Начало рисования только при нажатии левой кнопки мыши
canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Левая кнопка мыши
        isDrawing = true;
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;
        tempLine = null; // Сбрасываем временную линию
    }
    if (event.button === 2) { // Правая кнопка мыши
        Points.xc = event.clientX - rect.left;
        Points.yc = event.clientY - rect.top;
        clearCanvas();
        drawTrack();
        drawSpawn(Points.xc, Points.yc, `green`);
        drawSpawn(Points.xe, Points.ye, `red`);
    }
    if (event.button === 1) {
        event.preventDefault(); // Отключаем стандартное поведение
        Points.xe = event.clientX - rect.left;
        Points.ye = event.clientY - rect.top;
        clearCanvas();
        drawTrack();
        drawSpawn(Points.xe, Points.ye, `red`);
        drawSpawn(Points.xc, Points.yc, `green`);
    }
});

// Рисование временной линии при нажатой левой кнопке
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && event.button === 0) { // Проверяем, что рисуем только при зажатой левой кнопке
        // обновляем временную линию
        tempLine = { x1: startX, y1: startY, x2: event.clientX - rect.left, y2: event.clientY - rect.top };
        clearCanvas();
        drawTrack();
        drawSpawn(Points.xc, Points.yc, `green`);
        drawSpawn(Points.xe, Points.ye, `red`);
        ctx.beginPath();
        ctx.moveTo(tempLine.x1, tempLine.y1);
        ctx.lineTo(tempLine.x2, tempLine.y2);
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});

// Завершение рисования по отпусканию левой кнопки
canvas.addEventListener('mouseup', (event) => {
    if (isDrawing && event.button === 0) { // Завершаем рисование только при отпускании левой кнопки
        const endX = event.clientX - rect.left;
        const endY = event.clientY - rect.top;

        // Добавляем финальную линию в массив стен
        walls.push({ x1: startX, y1: startY, x2: endX, y2: endY });
    }
    isDrawing = false;
    tempLine = null; // Убираем временную линию после завершения
    clearCanvas();
    drawTrack();
    drawSpawn(Points.xc, Points.yc, `green`);
    drawSpawn(Points.xe, Points.ye, `red`);
});

drawSpawn(Points.xc, Points.yc, `green`);
drawSpawn(Points.xe, Points.ye, `red`);

document.getElementById('showBestCar').addEventListener('click', () => {
   // bestChild = currentGeneration.getBestChild();
    //сбрасываем для показа
    if (!bestChild) {
        alert("Вы еще не запустили симуляцию!!!!!");
        return;
    }
    bestChild.car = { // Машинка для каждого родителя
        x: Points.xc,
        y: Points.yc,
        width: 28,
        height: 16,
        color: 'red',
        maxSpeed: 2,
        acceleration: 0.07,
        deceleration: 0.03,
        currentSpeed: 0,
        angle: 0,
        turnSpeed: 2,
        driftFactor: 0.02,
        velocityX: 0,
        velocityY: 0
    };
    bestChild.lastPosition = { x: bestChild.car.x, y: bestChild.car.y };
    bestChild.isAlive = true;
    bestChild.currentRuleIndex = 0;
    bestChild.timeElapsed = 0;
    bestChild.children = [];
    drawBest();
});

document.getElementById('startButton').addEventListener('click', () => {
    numberOfChildren = document.getElementById("numOfGen").value;
    k = document.getElementById("kInput").value;
    if (k > 100000 || k < 0) {
        alert("k не подходит под диапазон 0 < k < 100000");
        return;
    }
    if (numberOfChildren > 100000 || numberOfChildren < 3){
        alert("Кол-во особей (N) не подходит под диапазон 3 < N < 100000");
        return;
    }

    currentGeneration = new Parent([]);
    currentGeneration.createChildren();
    i = 0;
    document.getElementById("generationCount").textContent = i;
    requestAnimationFrame(gameLoop);
});
