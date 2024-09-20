const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Inputs
const wavelengthInput = document.getElementById('wavelength');
const materialInput = document.getElementById('material');
const intensityInput = document.getElementById('intensity');
const currentMeter = document.getElementById('currentMeter');

// Materials with work functions (in eV) and corresponding plate colors
const materials = {
    sodium: { workFunction: 2.28, color: 'gold' },
    zinc: { workFunction: 4.3, color: 'silver' },
    copper: { workFunction: 4.7, color: 'brown' },
    platinum: { workFunction: 6.35, color: 'lightgray' }
};

// Dynamically resize the canvas to fill the parent container
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawSimulation(); // Redraw the simulation when resized
}

// Calculate photon energy based on wavelength (nm)
function calculateEnergy(wavelength) {
    const h = 6.626e-34; // Planck's constant in J·s
    const c = 3e8; // Speed of light in m/s
    return (h * c) / (wavelength * 1e-9); // Energy in Joules
}

// Class to represent a single photon or electron particle
class Particle {
    constructor(x, y, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.radius = 5;
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Arrays to store the photon and electron particles
const photons = [];
const electrons = [];

// Function to generate particles (either photons or electrons)
function generateParticle(x, y, speedX, speedY, color) {
    return new Particle(x, y, speedX, speedY, color);
}

// Function to draw electrons as slowly moving particles
function drawElectrons() {
    electrons.forEach((electron, index) => {
        electron.move();
        electron.draw();

        // Remove electron if it reaches the collector plate
        if (electron.x > canvas.width * 0.7) {
            electrons.splice(index, 1);
        }
    });
}

// Function to draw the photon stream as a translucent box
function drawPhotons() {
    const wavelength = parseFloat(wavelengthInput.value);
    const energy = calculateEnergy(wavelength); // Photon energy in Joules
    const material = materialInput.value;
    const workFunction = materials[material].workFunction * 1.60218e-19; // Work function in Joules

    // Check if photon stream should be emitted
    if (photons.length < intensity / 2) {
        const photonX = canvas.width / 2 + (Math.random() - 0.5) * 100; // Randomize x starting position around the center
        const photonY = canvas.height * 0.2 + (Math.random() - 0.5) * 100; // Randomize y position for wider beam
        const photon = generateParticle(photonX, photonY, -0.5, 0.3, 'yellow');
        photons.push(photon);
    }

    // Draw the photon beam as a translucent rectangle
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow with transparency
    ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, 50); // Adjust width and height as needed

    // Update the position of the photons to simulate movement
    photons.forEach((photon, index) => {
        photon.move();
        photon.draw();

        // Check if photon hits the emitter plate
        if (photon.x > canvas.width * 0.1 && photon.x < canvas.width * 0.15) {
            // Emit electron if the photon energy is greater than the work function
            if (energy > workFunction) {
                emitElectron();
            }

            // Remove the photon after it hits the emitter plate
            photons.splice(index, 1);
        }
    });
}

// Function to emit an electron when a photon hits the emitter plate
function emitElectron() {
    // Emit an electron from the emitter plate
    const electron = generateParticle(canvas.width * 0.15, canvas.height * 0.35 + (Math.random() - 0.5) * 100, 0.2, 0, 'blue'); // Slower electron speed
    electrons.push(electron);
}

function drawSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const wavelength = parseFloat(wavelengthInput.value);
    const material = materialInput.value;
    const intensity = parseFloat(intensityInput.value);

    // Photon energy in Joules
    const energy = calculateEnergy(wavelength);
    const workFunction = materials[material].workFunction * 1.60218e-19; // Convert work function from eV to Joules

    // Determine if electron emission is possible
    const canEmitElectrons = energy > workFunction;
    const current = canEmitElectrons ? (energy - workFunction) * intensity * 1e16 : 0;

    // Draw the circuit
    drawCircuit(material, canEmitElectrons, intensity);

    // Update the current meter
    currentMeter.textContent = `Current: ${current.toExponential(2)} A`;

    // Draw the photon stream
    drawPhotons();

    // Draw the moving electrons
    drawElectrons();

    // Request the next frame to animate the particles
    requestAnimationFrame(drawSimulation);
}

// Function to draw the circuit, emitter, and collector plates
function drawCircuit(material, canEmitElectrons, intensity) {
    // Set relative dimensions
    const emitterWidth = canvas.width * 0.1;
    const collectorWidth = canvas.width * 0.1;
    const plateHeight = canvas.height * 0.5;

    // Move the wire closer to the bottom of the plates
    const wireY = canvas.height * 0.75;

    // Center the light source (lamp) in the middle of the canvas
    const lampX = canvas.width / 2;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(lampX, canvas.height * 0.2, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw the emitter plate (left)
    ctx.fillStyle = materials[material].color; // Color based on material
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.25, emitterWidth, plateHeight);

    // Draw the collector plate (right)
    ctx.fillStyle = 'gray';
    ctx.fillRect(canvas.width * 0.7, canvas.height * 0.25, collectorWidth, plateHeight);

    // Draw the wire connecting the two plates, positioned lower
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.15 + emitterWidth, wireY); // Start wire at emitter plate
    ctx.lineTo(canvas.width * 0.4, wireY); // Wire to the current meter
    ctx.stroke();

    // Draw the current meter symbol
    const meterX = canvas.width * 0.4; // Position of current meter on the wire
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(meterX, wireY, 20, 0, Math.PI * 2); // Draw a circle for the meter
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.fillText('A', meterX - 6, wireY + 6); // Label the meter with "A" for amperes

    // Continue drawing the wire from the meter to the collector plate
    ctx.beginPath();
    ctx.moveTo(meterX + 20, wireY); // Resume wire after current meter
    ctx.lineTo(canvas.width * 0.7, wireY); // Wire to the collector plate
}

// Update photon generation in drawSimulation
function drawSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const wavelength = parseFloat(wavelengthInput.value);
    const material = materialInput.value;
    const intensity = parseFloat(intensityInput.value);

    // Photon energy in Joules
    const energy = calculateEnergy(wavelength);
    const workFunction = materials[material].workFunction * 1.60218e-19; // Convert work function from eV to Joules

    // Determine if electron emission is possible
    const canEmitElectrons = energy > workFunction;
    const current = canEmitElectrons ? (energy - workFunction) * intensity * 1e16 : 0;

    // Draw the circuit
    drawCircuit(material, canEmitElectrons, intensity);

    // Update the current meter
    currentMeter.textContent = `Current: ${current.toExponential(2)} A`;

    // Generate photon particles with adjusted starting position based on the new lamp location
    if (photons.length < intensity / 2) {
        const photonX = canvas.width / 2 + (Math.random() - 0.5) * 100; // Randomize x starting position around the center
        const photonY = canvas.height * 0.2 + (Math.random() - 0.5) * 100; // Randomize y position for wider beam
        const photon = generateParticle(photonX, photonY, -0.5, 0.3, 'yellow');
        photons.push(photon);
    }

    // Draw the moving photons and electrons
    drawPhotons();
    drawElectrons();

    // Request the next frame to animate the particles
    requestAnimationFrame(drawSimulation);
}



// Event listeners to redraw the simulation when inputs change
wavelengthInput.addEventListener('input', drawSimulation);
materialInput.addEventListener('input', drawSimulation);
intensityInput.addEventListener('input', drawSimulation);

// Resize canvas dynamically
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial setup
