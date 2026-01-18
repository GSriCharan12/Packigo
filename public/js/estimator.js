document.getElementById('estimatorForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Inputs
    const houseSize = parseInt(document.getElementById('houseSize').value);
    const distance = parseFloat(document.getElementById('distance').value);
    const floor = parseInt(document.getElementById('floor').value);
    const lift = document.getElementById('lift').value;
    const vehicle = document.getElementById('vehicle').value;

    // Pricing Logic
    // 1. Packing Charges (Based on House Size)
    // 1RK: 2500, 1BHK: 4500, 2BHK: 7000, 3BHK: 10000, Villa: 15000
    const sizeMap = {
        1: 2500,
        2: 4500,
        3: 7000,
        4: 10000,
        5: 15000
    };
    let packingCost = sizeMap[houseSize] || 3000;

    // 2. Transportation Charges
    // Base 1500 + 40 per km
    let transportCost = 1500 + (distance * 40);

    // Vehicle Surcharge
    if (vehicle === 'medium') transportCost += 2000;
    if (vehicle === 'large') transportCost += 5000;

    // 3. Floor/Lift Charges
    let floorCost = 0;
    if (lift === 'no' && floor > 0) {
        floorCost = floor * 500; // 500 per floor if no lift
    }

    // 4. Labor Charges (Approx 30% of packing + transport for handling)
    let laborCost = Math.round((packingCost + transportCost) * 0.25);

    // Total
    const total = packingCost + transportCost + laborCost + floorCost;

    // Display Result
    document.getElementById('packingCost').textContent = `₹${packingCost.toLocaleString()}`;
    document.getElementById('transportCost').textContent = `₹${transportCost.toLocaleString()}`;
    document.getElementById('laborCost').textContent = `₹${laborCost.toLocaleString()}`;
    document.getElementById('floorCost').textContent = `₹${floorCost.toLocaleString()}`;

    document.getElementById('totalPrice').textContent = `₹${total.toLocaleString()}`;
    document.getElementById('totalCostDisplay').textContent = `₹${total.toLocaleString()}`;

    // Show box with animation
    const resultBox = document.getElementById('resultBox');
    resultBox.style.display = 'block';

    // Smooth scroll to result
    resultBox.scrollIntoView({ behavior: 'smooth' });
});

// Update standard defaults based on selection logic if needed in future
