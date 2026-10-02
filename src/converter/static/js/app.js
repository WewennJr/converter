const categoriesData = window.CATEGORIES_DATA || {};
const translations = window.TRANSLATIONS || {};

let activeCategory = Object.keys(categoriesData)[0] || "length";

const categoryNames = {
    length: {
        fr: "Longueur",
        en: "Length"
    },
    weight: {
        fr: "Poids",
        en: "Weight"
    },
    temperature: {
        fr: "Température",
        en: "Temperature"
    },
    volume: {
        fr: "Volume",
        en: "Volume"
    },
    area: {
        fr: "Surface",
        en: "Area"
    },
    speed: {
        fr: "Vitesse",
        en: "Speed"
    },
    time: {
        fr: "Temps",
        en: "Time"
    },
    data: {
        fr: "Données",
        en: "Data"
    },
    energy: {
        fr: "Énergie",
        en: "Energy"
    },
    power: {
        fr: "Puissance",
        en: "Power"
    },
    pressure: {
        fr: "Pression",
        en: "Pressure"
    },
    force: {
        fr: "Force",
        en: "Force"
    },
    frequency: {
        fr: "Fréquence",
        en: "Frequency"
    },
    angle: {
        fr: "Angle",
        en: "Angle"
    },
    electricity: {
        fr: "Électricité",
        en: "Electricity"
    },
    illuminance: {
        fr: "Éclairage",
        en: "Illuminance"
    },
    fuel: {
        fr: "Carburant",
        en: "Fuel"
    },
    cooking: {
        fr: "Cuisine",
        en: "Cooking"
    },
    number_base: {
        fr: "Bases",
        en: "Number bases"
    },
    currency: {
        fr: "Monnaie",
        en: "Currency"
    }
};

const electricityCalculations = {
    voltage: {
        label: {
            fr: "Tension",
            en: "Voltage"
        },
        fields: [
            {
                name: "current",
                label: {
                    fr: "Courant",
                    en: "Current"
                },
                unit: "A"
            },
            {
                name: "resistance",
                label: {
                    fr: "Résistance",
                    en: "Resistance"
                },
                unit: "Ω"
            }
        ],
        resultUnit: "V"
    },
    current: {
        label: {
            fr: "Courant",
            en: "Current"
        },
        fields: [
            {
                name: "voltage",
                label: {
                    fr: "Tension",
                    en: "Voltage"
                },
                unit: "V"
            },
            {
                name: "resistance",
                label: {
                    fr: "Résistance",
                    en: "Resistance"
                },
                unit: "Ω"
            }
        ],
        resultUnit: "A"
    },
    resistance: {
        label: {
            fr: "Résistance",
            en: "Resistance"
        },
        fields: [
            {
                name: "voltage",
                label: {
                    fr: "Tension",
                    en: "Voltage"
                },
                unit: "V"
            },
            {
                name: "current",
                label: {
                    fr: "Courant",
                    en: "Current"
                },
                unit: "A"
            }
        ],
        resultUnit: "Ω"
    },
    power: {
        label: {
            fr: "Puissance",
            en: "Power"
        },
        fields: [
            {
                name: "voltage",
                label: {
                    fr: "Tension",
                    en: "Voltage"
                },
                unit: "V"
            },
            {
                name: "current",
                label: {
                    fr: "Courant",
                    en: "Current"
                },
                unit: "A"
            }
        ],
        resultUnit: "W"
    }
};

function getLanguage() {
    return document.documentElement.lang || "en";
}

function getCategoryName(category) {
    const language = getLanguage();

    return categoryNames[category]?.[language]
        || categoryNames[category]?.en
        || category;
}

function createTabs() {
    const tabsContainer = document.getElementById("categoryTabs");

    if (!tabsContainer) {
        return;
    }

    tabsContainer.innerHTML = "";

    Object.keys(categoriesData).forEach((category) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "tab";
        button.dataset.category = category;
        button.setAttribute("role", "tab");
        button.textContent = getCategoryName(category);

        button.addEventListener("click", () => {
            switchCategory(category);
        });

        tabsContainer.appendChild(button);
    });
}

function createPanelHTML(category) {
    if (category === "electricity") {
        return createElectricityPanelHTML();
    }

    const units = categoriesData[category] || [];
    const isCurrency = category === "currency";
    const inputType = category === "number_base" ? "text" : "number";

    const options = units
        .map((unit) => `<option value="${escapeHTML(unit)}">${escapeHTML(unit)}</option>`)
        .join("");

    return `
        <div class="category-panel" data-category="${category}">
            <form class="converter-form" data-category="${category}">
                <div class="input-group">
                    <label for="${category}-from">${translations.from || "From"}</label>
                    <div class="select-wrapper">
                        <select id="${category}-from" name="from_unit">
                            ${options}
                        </select>
                    </div>
                </div>

                <button
                    class="swap-btn"
                    type="button"
                    aria-label="${translations.swap || "Swap units"}"
                >
                    ⇄
                </button>

                <div class="input-group">
                    <label for="${category}-to">${translations.to || "To"}</label>
                    <div class="select-wrapper">
                        <select id="${category}-to" name="to_unit">
                            ${options}
                        </select>
                    </div>
                </div>

                <div class="input-group value-group">
                    <label for="${category}-value">
                        ${translations.value || "Value to convert"}
                    </label>

                    <input
                        class="value-input"
                        id="${category}-value"
                        name="value"
                        type="${inputType}"
                        placeholder="${translations.value_placeholder || "Enter a value"}"
                        autocomplete="off"
                    >
                </div>
            </form>

            <div class="result-card">
                <div class="result-label">
                    ${translations.result || "Result"}
                </div>

                <div
                    class="result-value"
                    id="result-${category}"
                >
                    —
                </div>

                ${isCurrency ? `
                    <div class="info-bar">
                        <span class="currency-notice">
                            ${translations.currency_updated || ""}
                        </span>
                        <span>
                            ${translations.currency_cache || ""}
                        </span>
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}

function createElectricityPanelHTML() {
    const language = getLanguage();

    const calculationOptions = Object.entries(electricityCalculations)
        .map(([key, calculation]) => {
            return `
                <option value="${key}">
                    ${calculation.label[language] || calculation.label.en}
                </option>
            `;
        })
        .join("");

    const calculation = electricityCalculations.voltage;

    return `
        <div class="category-panel" data-category="electricity">
            <form class="converter-form electricity-form" data-category="electricity">
                <div class="input-group value-group">
                    <label for="electricity-calculation">
                        ${language === "fr" ? "Calculer" : "Calculate"}
                    </label>

                    <div class="select-wrapper">
                        <select
                            id="electricity-calculation"
                            name="calculation"
                        >
                            ${calculationOptions}
                        </select>
                    </div>
                </div>

                <div class="input-group">
                    <label for="electricity-value1" id="electricity-label1">
                        ${calculation.fields[0].label[language] || calculation.fields[0].label.en}
                    </label>

                    <input
                        class="value-input"
                        id="electricity-value1"
                        name="value1"
                        type="number"
                        step="any"
                        placeholder="${translations.value_placeholder || "Enter a value"}"
                        autocomplete="off"
                    >
                </div>

                <div class="input-group">
                    <label for="electricity-value2" id="electricity-label2">
                        ${calculation.fields[1].label[language] || calculation.fields[1].label.en}
                    </label>

                    <input
                        class="value-input"
                        id="electricity-value2"
                        name="value2"
                        type="number"
                        step="any"
                        placeholder="${translations.value_placeholder || "Enter a value"}"
                        autocomplete="off"
                    >
                </div>
            </form>

            <div class="result-card">
                <div class="result-label">
                    ${translations.result || "Result"}
                </div>

                <div
                    class="result-value"
                    id="result-electricity"
                >
                    —
                </div>
            </div>
        </div>
    `;
}

function setupPanelListeners(category) {
    const panel = document.querySelector(
        `.category-panel[data-category="${category}"]`
    );

    if (!panel) {
        return;
    }

    if (category === "electricity") {
        setupElectricityListeners(panel);
        return;
    }

    const form = panel.querySelector(".converter-form");
    const swapButton = panel.querySelector(".swap-btn");
    const fromSelect = form.querySelector('[name="from_unit"]');
    const toSelect = form.querySelector('[name="to_unit"]');
    const valueInput = form.querySelector('[name="value"]');
    const resultElement = panel.querySelector(".result-value");

    async function convert() {
        const value = valueInput.value.trim();

        if (!value) {
            resultElement.textContent = "—";
            resultElement.className = "result-value";
            return;
        }

        resultElement.textContent = translations.converting || "Converting...";
        resultElement.className = "result-value loading";

        try {
            const response = await fetch("/api/convert", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category,
                    value,
                    from_unit: fromSelect.value,
                    to_unit: toSelect.value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Conversion error");
            }

            resultElement.textContent = formatResult(data.result, data.to);
            resultElement.className = "result-value";
        } catch (error) {
            resultElement.textContent =
                translations.error || "Error";

            resultElement.className = "result-value error";
        }
    }

    valueInput.addEventListener("input", convert);
    fromSelect.addEventListener("change", convert);
    toSelect.addEventListener("change", convert);

    swapButton.addEventListener("click", () => {
        const temporaryValue = fromSelect.value;

        fromSelect.value = toSelect.value;
        toSelect.value = temporaryValue;

        convert();
    });
}

function setupElectricityListeners(panel) {
    const form = panel.querySelector(".electricity-form");
    const calculationSelect = form.querySelector('[name="calculation"]');
    const value1Input = form.querySelector('[name="value1"]');
    const value2Input = form.querySelector('[name="value2"]');

    const label1 = form.querySelector("#electricity-label1");
    const label2 = form.querySelector("#electricity-label2");

    const resultElement = panel.querySelector("#result-electricity");

    function updateFields() {
        const calculation = electricityCalculations[
            calculationSelect.value
        ];

        if (!calculation) {
            return;
        }

        const language = getLanguage();

        label1.textContent =
            `${calculation.fields[0].label[language] || calculation.fields[0].label.en} (${calculation.fields[0].unit})`;

        label2.textContent =
            `${calculation.fields[1].label[language] || calculation.fields[1].label.en} (${calculation.fields[1].unit})`;

        value1Input.value = "";
        value2Input.value = "";

        resultElement.textContent = "—";
        resultElement.className = "result-value";
    }

    async function calculate() {
        const value1 = value1Input.value.trim();
        const value2 = value2Input.value.trim();

        if (!value1 || !value2) {
            resultElement.textContent = "—";
            resultElement.className = "result-value";
            return;
        }

        resultElement.textContent =
            translations.converting || "Calculating...";

        resultElement.className = "result-value loading";

        try {
            const response = await fetch("/api/convert", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category: "electricity",
                    calculation: calculationSelect.value,
                    value1,
                    value2
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Calculation error");
            }

            resultElement.textContent =
                `${formatNumber(data.result)} ${data.unit}`;

            resultElement.className = "result-value";
        } catch (error) {
            resultElement.textContent =
                translations.error || "Error";

            resultElement.className = "result-value error";
        }
    }

    calculationSelect.addEventListener("change", updateFields);
    value1Input.addEventListener("input", calculate);
    value2Input.addEventListener("input", calculate);

    updateFields();
}

function formatNumber(value) {
    if (typeof value !== "number") {
        return value;
    }

    if (Number.isInteger(value)) {
        return value.toLocaleString();
    }

    return value.toLocaleString(undefined, {
        maximumFractionDigits: 10
    });
}

function formatResult(value, fullResult) {
    if (typeof fullResult === "string") {
        const match = fullResult.match(/^(.+?)\s+(.+)$/);

        if (match) {
            const numberPart = Number(match[1]);

            if (!Number.isNaN(numberPart)) {
                return `${formatNumber(numberPart)} ${match[2]}`;
            }
        }

        return fullResult;
    }

    return formatNumber(value);
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createPanels() {
    const panelsContainer = document.getElementById("panelsContainer");

    if (!panelsContainer) {
        return;
    }

    panelsContainer.innerHTML = "";

    Object.keys(categoriesData).forEach((category) => {
        panelsContainer.insertAdjacentHTML(
            "beforeend",
            createPanelHTML(category)
        );
    });

    Object.keys(categoriesData).forEach((category) => {
        setupPanelListeners(category);
    });
}

function switchCategory(category) {
    if (!categoriesData[category]) {
        return;
    }

    activeCategory = category;

    document.querySelectorAll(".tab").forEach((tab) => {
        const isActive = tab.dataset.category === category;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.querySelectorAll(".category-panel").forEach((panel) => {
        panel.classList.toggle(
            "active",
            panel.dataset.category === category
        );
    });

    const activeTab = document.querySelector(
        `.tab[data-category="${category}"]`
    );

    if (activeTab) {
        activeTab.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });
    }

    updateCategoryArrows();
}

function setupCategoryNavigation() {
    const tabs = document.getElementById("categoryTabs");
    const previousButton = document.getElementById("categoryPrev");
    const nextButton = document.getElementById("categoryNext");

    if (!tabs || !previousButton || !nextButton) {
        return;
    }

    previousButton.addEventListener("click", () => {
        tabs.scrollBy({
            left: -250,
            behavior: "smooth"
        });
    });

    nextButton.addEventListener("click", () => {
        tabs.scrollBy({
            left: 250,
            behavior: "smooth"
        });
    });

    tabs.addEventListener("scroll", updateCategoryArrows);
    window.addEventListener("resize", updateCategoryArrows);

    updateCategoryArrows();
}

function updateCategoryArrows() {
    const tabs = document.getElementById("categoryTabs");
    const previousButton = document.getElementById("categoryPrev");
    const nextButton = document.getElementById("categoryNext");

    if (!tabs || !previousButton || !nextButton) {
        return;
    }

    const maxScroll = tabs.scrollWidth - tabs.clientWidth;

    previousButton.disabled = tabs.scrollLeft <= 1;
    nextButton.disabled = tabs.scrollLeft >= maxScroll - 1;

    previousButton.classList.toggle(
        "hidden",
        tabs.scrollWidth <= tabs.clientWidth
    );

    nextButton.classList.toggle(
        "hidden",
        tabs.scrollWidth <= tabs.clientWidth
    );
}

function init() {
    createTabs();
    createPanels();
    setupCategoryNavigation();
    switchCategory(activeCategory);
}

document.addEventListener("DOMContentLoaded", init);