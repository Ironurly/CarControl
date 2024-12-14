
const coordinatesDisplay = document.getElementById('coordinatesDisplay');


function updateCoordinates(event) {

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    coordinatesDisplay.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
}


if (canvas) {
    canvas.addEventListener('mousemove', updateCoordinates);
} else {
    console.error('Canvas element not found');
}
