// app.js
document.addEventListener("DOMContentLoaded", () => {
  const platformSelect = document.getElementById("platform");
  const socketSelect = document.getElementById("socket");
  const cpuSelect = document.getElementById("cpu");
  const buildDisplay = document.getElementById("buildDisplay");
  const buildParts = document.getElementById("buildParts");
  const totalPrice = document.getElementById("totalPrice");

  const exportBtn = document.createElement("button");
  let budgetMinSlider, budgetMaxSlider, minValueDisplay, maxValueDisplay;

  function parsePHP(str) {
    return parseFloat(str.replace(/[^\d.]/g, '')) || 0;
  }

  function setupEnhancedUI() {
    const selectionPanel = document.querySelector('.selection-panel');

    // Budget sliders
    const budgetGroup = document.createElement('div');
    budgetGroup.className = 'filter-group';
    budgetGroup.innerHTML = `
      <label>Budget Range:</label>
      <div>
        <input type="range" id="budgetMin" min="20000" max="600000" value="30000">
        <span id="minValue">₱30,000</span> -
        <input type="range" id="budgetMax" min="25000" max="800000" value="100000">
        <span id="maxValue">₱100,000</span>
      </div>
    `;
    selectionPanel.appendChild(budgetGroup);

    budgetMinSlider = budgetGroup.querySelector("#budgetMin");
    budgetMaxSlider = budgetGroup.querySelector("#budgetMax");
    minValueDisplay = budgetGroup.querySelector("#minValue");
    maxValueDisplay = budgetGroup.querySelector("#maxValue");

    budgetMinSlider.addEventListener("input", updateBudgetDisplay);
    budgetMaxSlider.addEventListener("input", updateBudgetDisplay);

    function updateBudgetDisplay() {
      minValueDisplay.textContent = `₱${parseInt(budgetMinSlider.value).toLocaleString()}`;
      maxValueDisplay.textContent = `₱${parseInt(budgetMaxSlider.value).toLocaleString()}`;
      populateCPUs(socketSelect.value);
    }

    // RGB toggle (optional for future use)
    const rgbGroup = document.createElement('div');
    rgbGroup.className = 'toggle-group';
    rgbGroup.innerHTML = `
      <label class="switch">
        <input type="checkbox" id="rgbToggle">
        <span class="slider round"></span>
      </label>
      <span>RGB Lighting</span>
    `;
    selectionPanel.appendChild(rgbGroup);

    // Export button
    exportBtn.textContent = "💾 Export Build";
    exportBtn.id = "exportBtn";
    selectionPanel.appendChild(exportBtn);
  }

  function populateSockets(platform) {
    socketSelect.innerHTML = '<option value="">Select Socket</option>';
    Object.keys(cpuDatabase[platform]).forEach(socket => {
      let opt = document.createElement("option");
      opt.value = socket;
      opt.textContent = socket.toUpperCase();
      socketSelect.appendChild(opt);
    });
  }

  function populateCPUs(socket) {
    cpuSelect.innerHTML = '<option value="">Select CPU</option>';
    const platform = platformSelect.value;
    if (!cpuDatabase[platform][socket]) return;

    const min = parseInt(budgetMinSlider?.value || "0");
    const max = parseInt(budgetMaxSlider?.value || "999999");

    cpuDatabase[platform][socket].forEach((cpu, i) => {
      let total = parsePHP(cpu.price);
      Object.values(cpu.compatibleParts).forEach(part => {
        total += parsePHP(part.price);
      });

      if (total >= min && total <= max) {
        let opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `${cpu.name} (${cpu.generation}) - ₱${total.toLocaleString()}`;
        cpuSelect.appendChild(opt);
      }
    });
  }

  function displayBuild(cpu) {
    buildParts.innerHTML = "";
    let total = parsePHP(cpu.price);

    Object.entries(cpu.compatibleParts).forEach(([type, part], idx) => {
      let card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${type.toUpperCase()}</h3>
        <p class="part-name">${part.name}</p>
        <p class="part-price">${part.price}</p>
      `;
      buildParts.appendChild(card);
      setTimeout(() => card.style.opacity = 1, idx * 150);
      total += parsePHP(part.price);
    });

    totalPrice.textContent = `Total Estimated Price: ₱${total.toLocaleString()}`;
    buildDisplay.classList.remove("hidden");

    // Export to TXT
    exportBtn.onclick = () => {
      let exportContent = `Build Summary:\n\nCPU: ${cpu.name} - ${cpu.price}\n`;
      for (const [type, part] of Object.entries(cpu.compatibleParts)) {
        exportContent += `${type.toUpperCase()}: ${part.name} - ${part.price}\n`;
      }
      exportContent += `\nTotal: ₱${total.toLocaleString()}`;

      const blob = new Blob([exportContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${cpu.name.replace(/\s+/g, '_')}_build.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }

  platformSelect.addEventListener("change", () => {
    populateSockets(platformSelect.value);
    buildDisplay.classList.add("hidden");
  });

  socketSelect.addEventListener("change", () => {
    if (socketSelect.value) {
      populateCPUs(socketSelect.value);
    }
    buildDisplay.classList.add("hidden");
  });

  cpuSelect.addEventListener("change", () => {
    if (cpuSelect.value) {
      const platform = platformSelect.value;
      const socket = socketSelect.value;
      const cpu = cpuDatabase[platform][socket][cpuSelect.value];
      displayBuild(cpu);
    } else {
      buildDisplay.classList.add("hidden");
    }
  });

  setupEnhancedUI();
  populateSockets("intel");
});
