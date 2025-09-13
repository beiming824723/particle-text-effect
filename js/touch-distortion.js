class TouchDistortion {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;

        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;

        this.points = [];
        this.distortionRadius = 150;
        this.distortionStrength = 50;

        this.init();
    }

    init() {
        this.resize();
        this.createTextPoints();
        this.setupEvents();
        this.animate();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width * window.devicePixelRatio;
        this.height = rect.height * window.devicePixelRatio;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    createTextPoints() {
        const canvasWidth = this.canvas.offsetWidth;
        const canvasHeight = this.canvas.offsetHeight;

        // 动态计算字体大小：背景高度减去上下20px间隔
        const margin = 20;
        this.fontSize = canvasHeight - (margin * 2); // 上下各留20px

        const text = '超古冠今';
        const chars = text.split('');

        // 每个字符宽度为300px + 缩小间隔
        const charWidth = 300 + 200;
        const totalWidth = charWidth * chars.length;
        const startX = (canvasWidth - totalWidth) / 2 + charWidth / 2;
        const y = canvasHeight / 2;

        // 提取字符的真实像素点
        this.points = [];

        chars.forEach((char, i) => {
            const charX = startX + i * charWidth;
            const charPoints = this.extractCharacterPixels(char, charX, y, i);
            this.points.push(...charPoints);
        });
    }

    extractCharacterPixels(char, centerX, centerY, charIndex) {
        // 创建临时画布来获取字符的真实像素
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const size = this.fontSize * 1.5;
        tempCanvas.width = size;
        tempCanvas.height = size;

        // 绘制字符到临时画布
        tempCtx.fillStyle = '#000000';
        tempCtx.font = `900 ${this.fontSize}px Arial Black, sans-serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(char, size/2, size/2);

        // 获取像素数据
        const imageData = tempCtx.getImageData(0, 0, size, size);
        const data = imageData.data;

        const points = [];
        const step = 8; // 每8像素取一个点，减少计算量

        for (let y = 0; y < size; y += step) {
            for (let x = 0; x < size; x += step) {
                const index = (y * size + x) * 4;
                const alpha = data[index + 3];

                // 只保留字符的实际像素点
                if (alpha > 128) {
                    const worldX = centerX + (x - size/2);
                    const worldY = centerY + (y - size/2);

                    points.push({
                        originalX: worldX,
                        originalY: worldY,
                        x: worldX,
                        y: worldY,
                        char: char,
                        charIndex: charIndex,
                        pixelX: x,
                        pixelY: y,
                        // 每个点的分解状态
                        decomposed: false,
                        decomposeTime: 0,
                        particles: []
                    });
                }
            }
        }

        console.log(`字符 '${char}' 提取到 ${points.length} 个像素点`);
        return points;
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.targetMouseX = e.clientX - rect.left;
            this.targetMouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.targetMouseX = this.canvas.offsetWidth / 2;
            this.targetMouseY = this.canvas.offsetHeight / 2;
        });

        this.canvas.addEventListener('click', () => {
            this.resetDistortion();
        });

        window.addEventListener('resize', () => {
            this.resize();
            this.createTextPoints();
        });
    }

    resetDistortion() {
        this.points.forEach(point => {
            point.x = point.originalX;
            point.y = point.originalY;
        });
    }

    updateDistortion() {
        // 移除平滑移动，直接使用目标位置避免偏移
        this.mouseX = this.targetMouseX;
        this.mouseY = this.targetMouseY;

        this.points.forEach(point => {
            const dx = this.mouseX - point.originalX;
            const dy = this.mouseY - point.originalY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 添加磁吸效果：鼠标靠近时像素点轻微移动
            if (distance < 30 && !point.decomposed) {
                const force = Math.max(0, (30 - distance) / 30) * 0.3;
                const attractX = Math.cos(Math.atan2(dy, dx)) * force * 8;
                const attractY = Math.sin(Math.atan2(dy, dx)) * force * 8;
                point.x = point.originalX + attractX;
                point.y = point.originalY + attractY;

                // 添加呼吸效果
                point.pulse = Math.sin(Date.now() * 0.01 + distance) * force * 2;
            } else if (!point.decomposed) {
                // 回到原位置
                point.x += (point.originalX - point.x) * 0.1;
                point.y += (point.originalY - point.y) * 0.1;
                point.pulse = 0;
            }

            // 检查鼠标是否触碰到这个具体的像素点
            if (distance < 15) { // 缩小触碰范围到15像素，提高精度
                // 触发这个点的分解动画
                if (!point.decomposed) {
                    point.decomposed = true;
                    point.decomposeTime = Date.now();
                    point.explosionForce = 1.0; // 爆炸力度

                    // 创建简化的分解粒子
                    for (let i = 0; i < 4; i++) {
                        const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
                        const speed = 2 + Math.random() * 2;
                        point.particles.push({
                            x: point.originalX,
                            y: point.originalY,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 1.0,
                            size: 2 + Math.random() * 2
                        });
                    }
                }
            } else if (distance > 40) { // 缩小恢复距离，更精确控制
                // 距离远时恢复点
                if (point.decomposed) {
                    const timeSinceDecompose = Date.now() - point.decomposeTime;
                    if (timeSinceDecompose > 1200) { // 稍微延长恢复时间
                        point.decomposed = false;
                        point.particles = [];
                        point.explosionForce = 0;

                        // 添加重组动画
                        point.reforming = true;
                        point.reformTime = Date.now();
                    }
                }
            }

            // 重组动画
            if (point.reforming) {
                const reformProgress = (Date.now() - point.reformTime) / 500; // 0.5秒重组
                if (reformProgress >= 1) {
                    point.reforming = false;
                } else {
                    // 弹性重组效果
                    const bounce = Math.sin(reformProgress * Math.PI * 3) * (1 - reformProgress) * 10;
                    point.x = point.originalX + bounce;
                    point.y = point.originalY + bounce;
                }
            }

            // 更新分解粒子
            if (point.particles.length > 0) {
                point.particles.forEach(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.vx *= 0.95; // 增加阻力
                    particle.vy *= 0.95;
                    particle.life -= 0.03; // 更快消失
                });

                // 移除消失的粒子
                point.particles = point.particles.filter(p => p.life > 0);
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);

        // 绘制所有像素点
        this.points.forEach(point => {
            if (!point.decomposed && !point.reforming) {
                // 绘制简化的像素点（移除发光效果提升性能）
                this.ctx.save();

                // 呼吸效果
                const pulseSize = 8 + (point.pulse || 0);

                // 磁吸时的简单高亮效果
                const dx = this.mouseX - point.x;
                const dy = this.mouseY - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 30) {
                    const glowIntensity = Math.max(0, (30 - distance) / 30);
                    this.ctx.globalAlpha = 0.8 + glowIntensity * 0.2;
                }

                this.ctx.fillStyle = '#0a0b0d';
                this.ctx.fillRect(
                    point.x - pulseSize/2,
                    point.y - pulseSize/2,
                    pulseSize,
                    pulseSize
                );

                this.ctx.restore();

            } else if (point.reforming) {
                // 绘制重组中的点（闪烁效果）
                this.ctx.save();
                const flickerAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
                this.ctx.globalAlpha = flickerAlpha;
                this.ctx.fillStyle = '#0a0b0d';
                this.ctx.fillRect(point.x - 6, point.y - 6, 12, 12);
                this.ctx.restore();

            } else {
                // 绘制简化的分解粒子
                point.particles.forEach(particle => {
                    this.ctx.save();
                    this.ctx.globalAlpha = particle.life;
                    this.ctx.fillStyle = '#0a0b0d';
                    this.ctx.fillRect(
                        particle.x - particle.size/2,
                        particle.y - particle.size/2,
                        particle.size,
                        particle.size
                    );
                    this.ctx.restore();
                });
            }
        });
    }

    animate() {
        this.updateDistortion();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化函数
function initTouchDistortion() {
    const canvas = document.getElementById('distortionCanvas');
    if (canvas) {
        new TouchDistortion(canvas);
    }
}

// 额外的交互效果
function setupKeyboardInteraction() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            const canvas = document.getElementById('distortionCanvas');
            if (canvas) {
                canvas.click();
            }
        }
    });
}

// 当页面加载完成时初始化
window.addEventListener('load', () => {
    initTouchDistortion();
    setupKeyboardInteraction();
});