const Game = {
    state: {
        level: 1,
        round: 1,
        maxRounds: 3,
        score: 0,
        hp: 100,
        maxHp: 100,
        startTime: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        bestScore: 0
    },

    init() {
        this.loadBestScore();
        this.showScreen('main-menu');
    },

    loadBestScore() {
        const best = localStorage.getItem('matrixEscapeBest');
        if (best) {
            this.state.bestScore = parseInt(best);
            document.getElementById('best-score').textContent = this.state.bestScore;
            document.getElementById('record-box').style.display = 'block';
        }
    },

    saveBestScore() {
        if (this.state.score > this.state.bestScore) {
            this.state.bestScore = this.state.score;
            localStorage.setItem('matrixEscapeBest', this.state.score);
            document.getElementById('new-record').style.display = 'block';
        } else {
            document.getElementById('new-record').style.display = 'none';
        }
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    start() {
        this.state = {
            level: 1,
            round: 1,
            maxRounds: 3,
            score: 0,
            hp: 100,
            maxHp: 100,
            startTime: Date.now(),
            correctAnswers: 0,
            totalAttempts: 0,
            bestScore: this.state.bestScore
        };

        document.getElementById('hud').style.display = 'grid';
        this.updateHUD();
        this.startLevel(1);
    },

    restart() {
        document.getElementById('hud').style.display = 'none';
        this.showScreen('main-menu');
        this.loadBestScore();
    },

    updateHUD() {
        document.getElementById('hud-level').textContent = `${this.state.level}/3`;
        document.getElementById('hud-score').textContent = this.state.score;
        document.getElementById('hud-hp').textContent = this.state.hp;
        document.getElementById('hud-round').textContent = `${this.state.round}/${this.state.maxRounds}`;
        
        const hpPercent = (this.state.hp / this.state.maxHp) * 100;
        document.getElementById('hp-fill').style.width = hpPercent + '%';
    },

    damage(amount) {
        this.state.hp = Math.max(0, this.state.hp - amount);
        this.updateHUD();
        if (this.state.hp <= 0) {
            this.gameOver();
        }
    },

    addScore(amount) {
        this.state.score += amount;
        this.updateHUD();
    },

    startLevel(level) {
        this.state.level = level;
        this.state.round = 1;
        this.updateHUD();

        if (level === 1) {
            this.showScreen('level-1');
            this.level1.init();
        } else if (level === 2) {
            this.showScreen('level-2');
            this.level2.init();
        } else if (level === 3) {
            this.showScreen('level-3');
            this.level3.init();
        } else {
            this.victory();
        }
    },

    nextRound() {
        this.state.round++;
        this.updateHUD();
        
        if (this.state.round > this.state.maxRounds) {
            setTimeout(() => this.startLevel(this.state.level + 1), 1500);
        } else {
            setTimeout(() => {
                if (this.state.level === 1) this.level1.generateRound();
                else if (this.state.level === 2) this.level2.generateRound();
                else if (this.state.level === 3) this.level3.generateRound();
            }, 1500);
        }
    },

    showFeedback(levelNum, isCorrect, message) {
        const fb = document.getElementById(`feedback-${levelNum}`);
        fb.textContent = message;
        fb.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
        
        setTimeout(() => {
            fb.className = 'feedback';
        }, 1500);
    },

    victory() {
        this.saveBestScore();
        
        const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
        const accuracy = this.state.totalAttempts > 0 
            ? Math.round((this.state.correctAnswers / this.state.totalAttempts) * 100)
            : 0;

        const hpBonus = this.state.hp * 5;
        const timeBonus = Math.max(0, 300 - elapsed) * 2;
        this.addScore(hpBonus + timeBonus);

        document.getElementById('hud').style.display = 'none';
        document.getElementById('final-score').textContent = this.state.score;
        document.getElementById('final-time').textContent = elapsed + 's';
        document.getElementById('final-hp').textContent = this.state.hp;
        document.getElementById('final-accuracy').textContent = accuracy + '%';
        
        this.showScreen('victory');
    },

    gameOver() {
        document.getElementById('hud').style.display = 'none';
        document.getElementById('go-score').textContent = this.state.score;
        this.showScreen('gameover');
    },

    level1: {
        canvas: null,
        ctx: null,
        pointA: null,
        pointB: null,
        scale: 25,
        answered: false,

        init() {
            this.canvas = document.getElementById('coord-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.onclick = (e) => this.handleClick(e);
            this.generateRound();
        },

        generateRound() {
            this.answered = false;
            
            this.pointA = {
                x: Math.floor(Math.random() * 17) - 8,
                y: Math.floor(Math.random() * 17) - 8,
                color: '#ff006e',
                label: 'A'
            };
            this.pointB = {
                x: Math.floor(Math.random() * 17) - 8,
                y: Math.floor(Math.random() * 17) - 8,
                color: '#00d4ff',
                label: 'B'
            };
            
            if (this.pointA.x === this.pointB.x && this.pointA.y === this.pointB.y) {
                this.pointB.x = (this.pointB.x + 3) % 9;
            }

            this.distA = Math.sqrt(this.pointA.x**2 + this.pointA.y**2);
            this.distB = Math.sqrt(this.pointB.x**2 + this.pointB.y**2);

            document.getElementById('info-x1').textContent = this.pointA.x;
            document.getElementById('info-y1').textContent = this.pointA.y;
            document.getElementById('info-x2').textContent = this.pointB.x;
            document.getElementById('info-y2').textContent = this.pointB.y;

            this.draw();
        },

        draw() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.fillStyle = '#050818';
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = '#1a1f3a';
            ctx.lineWidth = 1;
            for (let i = -10; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(cx + i * this.scale, 0);
                ctx.lineTo(cx + i * this.scale, h);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, cy + i * this.scale);
                ctx.lineTo(w, cy + i * this.scale);
                ctx.stroke();
            }

            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(w, cy);
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, h);
            ctx.stroke();

            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 14px Courier New';
            ctx.fillText('X', w - 20, cy - 5);
            ctx.fillText('Y', cx + 5, 15);
            ctx.fillText('0', cx + 5, cy + 15);

            ctx.fillStyle = '#888';
            ctx.font = '10px Courier New';
            for (let i = -8; i <= 8; i++) {
                if (i !== 0) {
                    ctx.fillText(i, cx + i * this.scale - 5, cy + 15);
                }
            }

            this.drawDashedLine(ctx, cx, cy, cx + this.pointA.x * this.scale, cy - this.pointA.y * this.scale, '#ff006e');
            this.drawDashedLine(ctx, cx, cy, cx + this.pointB.x * this.scale, cy - this.pointB.y * this.scale, '#00d4ff');

            this.drawPoint(ctx, this.pointA, cx, cy);
            this.drawPoint(ctx, this.pointB, cx, cy);
        },

        drawDashedLine(ctx, x1, y1, x2, y2, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        },

        drawPoint(ctx, point, cx, cy) {
            const x = cx + point.x * this.scale;
            const y = cy - point.y * this.scale;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
            gradient.addColorStop(0, point.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 25, y - 25, 50, 50);

            ctx.fillStyle = point.color;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Courier New';
            ctx.fillText(point.label, x + 15, y - 10);

            point.screenX = x;
            point.screenY = y;
        },

        handleClick(e) {
            if (this.answered) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const radius = 20;
            const hitA = Math.hypot(x - this.pointA.screenX, y - this.pointA.screenY) < radius;
            const hitB = Math.hypot(x - this.pointB.screenX, y - this.pointB.screenY) < radius;

            if (!hitA && !hitB) return;

            this.answered = true;
            Game.state.totalAttempts++;

            let correctAnswer;
            if (this.distA < this.distB) correctAnswer = 'A';
            else if (this.distB < this.distA) correctAnswer = 'B';
            else correctAnswer = 'EQUAL';

            const userAnswer = hitA ? 'A' : 'B';
            const isCorrect = userAnswer === correctAnswer;

            if (isCorrect) {
                Game.state.correctAnswers++;
                Game.addScore(50);
                Game.showFeedback(1, true, 'Верно!');
                Game.nextRound();
            } else {
                Game.damage(15);
                Game.showFeedback(1, false, 'Неверно!');
                setTimeout(() => this.generateRound(), 1500);
            }
        }
    },

    level2: {
        matrix: [],
        highlighted: [],
        correctSum: 0,
        rows: 4,
        cols: 4,

        init() {
            this.generateRound();
        },

        generateRound() {
            this.matrix = [];
            this.highlighted = [];
            this.correctSum = 0;

            for (let i = 0; i < this.rows; i++) {
                this.matrix[i] = [];
                this.highlighted[i] = [];
                for (let j = 0; j < this.cols; j++) {
                    this.matrix[i][j] = Math.floor(Math.random() * 20) - 5;
                    this.highlighted[i][j] = Math.random() > 0.5;
                    if (this.highlighted[i][j]) {
                        this.correctSum += this.matrix[i][j];
                    }
                }
            }

            let count = this.highlighted.flat().filter(v => v).length;
            while (count < 4) {
                const i = Math.floor(Math.random() * this.rows);
                const j = Math.floor(Math.random() * this.cols);
                if (!this.highlighted[i][j]) {
                    this.highlighted[i][j] = true;
                    this.correctSum += this.matrix[i][j];
                    count++;
                }
            }

            this.renderMatrix();
            document.getElementById('sum-input').value = '';
            document.getElementById('sum-input').focus();
        },

        renderMatrix() {
            const table = document.getElementById('matrix-table');
            table.innerHTML = '';

            for (let i = 0; i < this.rows; i++) {
                const row = table.insertRow();
                for (let j = 0; j < this.cols; j++) {
                    const cell = row.insertCell();
                    cell.textContent = this.matrix[i][j];
                    if (this.highlighted[i][j]) {
                        cell.classList.add('highlighted');
                    }
                }
            }
        },

        check() {
            const input = document.getElementById('sum-input');
            const userAnswer = parseInt(input.value);

            if (isNaN(userAnswer)) {
                Game.showFeedback(2, false, 'Введите число!');
                return;
            }

            Game.state.totalAttempts++;

            if (userAnswer === this.correctSum) {
                Game.state.correctAnswers++;
                Game.addScore(80);
                Game.showFeedback(2, true, 'Верно!');
                Game.nextRound();
            } else {
                Game.damage(10);
                Game.showFeedback(2, false, 'Неверно!');
            }
        },

        skip() {
            Game.damage(20);
            Game.showFeedback(2, false, 'Пропущено');
            if (Game.state.hp > 0) {
                Game.nextRound();
            }
        }
    },

    level3: {
        original: [],
        player: [],
        rows: 4,
        cols: 5,
        draggedRow: null,

        init() {
            this.generateRound();
        },

        generateRound() {
            this.original = [];
            for (let i = 0; i < this.rows; i++) {
                this.original[i] = [];
                for (let j = 0; j < this.cols; j++) {
                    this.original[i][j] = Math.floor(Math.random() * 50);
                }
            }
            this.player = JSON.parse(JSON.stringify(this.original));

            this.renderOriginal();
            this.renderPlayer();
            this.setupDragAndDrop();
        },

        renderOriginal() {
            const table = document.getElementById('matrix-original');
            table.innerHTML = '';
            for (let i = 0; i < this.rows; i++) {
                const row = table.insertRow();
                for (let j = 0; j < this.cols; j++) {
                    const cell = row.insertCell();
                    cell.textContent = this.original[i][j];
                    if (i === 0) cell.style.borderColor = '#ff006e';
                    if (i === this.rows - 1) cell.style.borderColor = '#00d4ff';
                }
            }
        },

        renderPlayer() {
            const table = document.getElementById('matrix-player');
            table.innerHTML = '';
            for (let i = 0; i < this.rows; i++) {
                const row = table.insertRow();
                row.dataset.rowIndex = i;
                row.draggable = true;

                for (let j = 0; j < this.cols; j++) {
                    const cell = row.insertCell();
                    cell.textContent = this.player[i][j];
                }
            }
        },

        setupDragAndDrop() {
            const table = document.getElementById('matrix-player');
            const rows = table.querySelectorAll('tr');

            rows.forEach(row => {
                row.addEventListener('dragstart', (e) => {
                    this.draggedRow = parseInt(row.dataset.rowIndex);
                    row.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });

                row.addEventListener('dragend', () => {
                    row.classList.remove('dragging');
                    rows.forEach(r => r.classList.remove('drag-over'));
                });

                row.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    row.classList.add('drag-over');
                });

                row.addEventListener('dragleave', () => {
                    row.classList.remove('drag-over');
                });

                row.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const targetRow = parseInt(row.dataset.rowIndex);
                    if (this.draggedRow !== null && this.draggedRow !== targetRow) {
                        const temp = this.player[this.draggedRow];
                        this.player[this.draggedRow] = this.player[targetRow];
                        this.player[targetRow] = temp;
                        
                        this.renderPlayer();
                        this.setupDragAndDrop();
                        
                        const newRows = table.querySelectorAll('tr');
                        newRows[this.draggedRow].classList.add('swapped');
                        newRows[targetRow].classList.add('swapped');
                        setTimeout(() => {
                            newRows.forEach(r => r.classList.remove('swapped'));
                        }, 500);
                    }
                    row.classList.remove('drag-over');
                });
            });
        },

        check() {
            let correct = true;

            for (let j = 0; j < this.cols; j++) {
                if (this.player[0][j] !== this.original[this.rows - 1][j]) {
                    correct = false;
                    break;
                }
            }
            
            if (correct) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.player[this.rows - 1][j] !== this.original[0][j]) {
                        correct = false;
                        break;
                    }
                }
            }

            if (correct) {
                for (let i = 1; i < this.rows - 1; i++) {
                    for (let j = 0; j < this.cols; j++) {
                        if (this.player[i][j] !== this.original[i][j]) {
                            correct = false;
                            break;
                        }
                    }
                    if (!correct) break;
                }
            }

            Game.state.totalAttempts++;

            if (correct) {
                Game.state.correctAnswers++;
                Game.addScore(100);
                Game.showFeedback(3, true, 'Верно!');
                Game.nextRound();
            } else {
                Game.damage(15);
                Game.showFeedback(3, false, 'Неверно!');
            }
        },

        reset() {
            this.player = JSON.parse(JSON.stringify(this.original));
            this.renderPlayer();
            this.setupDragAndDrop();
            Game.showFeedback(3, true, 'Сброшено');
        },

        skip() {
            Game.damage(20);
            Game.showFeedback(3, false, 'Пропущено');
            if (Game.state.hp > 0) {
                Game.nextRound();
            }
        }
    }
};

window.addEventListener('load', () => Game.init());

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const level2 = document.getElementById('level-2');
        if (level2.classList.contains('active')) {
            Game.level2.check();
        }
    }
});