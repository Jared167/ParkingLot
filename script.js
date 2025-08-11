const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Car properties
let car = { x: 50, y: 300, width: 40, height: 20, speed: 2 };

// Keys pressed
let keys = {};

// Parking spot
const parkingSpot = { x: 500, y: 100, width: 60, height: 30 };

// Handle key presses
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    if (keys["ArrowUp"]) car.y -= car.speed;
    if (keys["ArrowDown"]) car.y += car.speed;
    if (keys["ArrowLeft"]) car.x -= car.speed;
    if (keys["ArrowRight"]) car.x += car.speed;

    // Boundaries
    if (car.x < 0) car.x = 0;
    if (car.y < 0) car.y = 0;
    if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;
    if (car.y + car.height > canvas.height) car.y = canvas.height - car.height;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw parking spot
    ctx.fillStyle = "green";
    ctx.fillRect(parkingSpot.x, parkingSpot.y, parkingSpot.width, parkingSpot.height);

    // Draw car
    ctx.fillStyle = "red";
    ctx.fillRect(car.x, car.y, car.width, car.height);

    // Check win condition
    if (
        car.x > parkingSpot.x &&
        car.x + car.width < parkingSpot.x + parkingSpot.width &&
        car.y > parkingSpot.y &&
        car.y + car.height < parkingSpot.y + parkingSpot.height
    ) {
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText("Parked! 🎉", 240, 200);
    }
}

// Start game
update();
