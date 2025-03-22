/**
 * Represents a color in the CMYK color space
 * CMYK (Cyan, Magenta, Yellow, Key/Black) is used in printing and represents subtractive color mixing
 * Values are stored as percentages (0-100)
 */
class CMYKColor {
    /**
     * Creates a new CMYK color instance
     * @param {number} c - Cyan percentage (0-100)
     * @param {number} m - Magenta percentage (0-100)
     * @param {number} y - Yellow percentage (0-100)
     * @param {number} k - Key (Black) percentage (0-100)
     */
    constructor(c = 0, m = 0, y = 0, k = 0) {
        this.c = c;  // Cyan percentage
        this.m = m;  // Magenta percentage
        this.y = y;  // Yellow percentage
        this.k = k;  // Key (Black) percentage
    }

    /**
     * Converts CMYK values to RGB color space
     * Formula: RGB = 255 * (1 - C/100) * (1 - K/100)
     * This represents how much light is NOT absorbed by each ink
     * @returns {Object} RGB values from 0-255
     */
    toRGB() {
        const r = 255 * (1 - this.c / 100) * (1 - this.k / 100);
        const g = 255 * (1 - this.m / 100) * (1 - this.k / 100);
        const b = 255 * (1 - this.y / 100) * (1 - this.k / 100);
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }

    /**
     * Converts the color to hexadecimal format for web display
     * @returns {string} Hex color code (e.g., #FF0000 for red)
     */
    toHex() {
        const rgb = this.toRGB();
        return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Creates a CMYK color from RGB values
     * This is the inverse of the CMYK to RGB conversion
     * K is determined first, then C,M,Y are calculated relative to K
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {CMYKColor} New CMYK color instance
     */
    static fromRGB(r, g, b) {
        const k = Math.min(1 - r / 255, 1 - g / 255, 1 - b / 255);
        const c = k === 1 ? 0 : (1 - r / 255 - k) / (1 - k);
        const m = k === 1 ? 0 : (1 - g / 255 - k) / (1 - k);
        const y = k === 1 ? 0 : (1 - b / 255 - k) / (1 - k);
        
        return new CMYKColor(
            Math.round(c * 100),
            Math.round(m * 100),
            Math.round(y * 100),
            Math.round(k * 100)
        );
    }
}

/**
 * Manages the color palette interface and functionality
 * Handles color selection, combinations, and mixing operations
 */
class ColorPalette {
    /**
     * Initializes the color palette
     * Sets up the base color, initializes elements, sets up event listeners, and updates the UI
     */
    constructor() {
        this.baseColor = new CMYKColor();  // Starting with no color (0,0,0,0)
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * Initializes references to DOM elements
     * This includes sliders, value displays, and various UI components
     * for color selection and manipulation
     */
    initializeElements() {
        // CMYK sliders for direct color manipulation
        this.sliders = {
            cyan: document.getElementById('cyan'),
            magenta: document.getElementById('magenta'),
            yellow: document.getElementById('yellow'),
            key: document.getElementById('key')
        };

        // Display elements for showing current CMYK values
        this.valueDisplays = {
            cyan: document.getElementById('cyanValue'),
            magenta: document.getElementById('magentaValue'),
            yellow: document.getElementById('yellowValue'),
            key: document.getElementById('keyValue')
        };

        // UI elements for color display and manipulation
        this.selectedColorDisplay = document.getElementById('selectedColor');  // Shows current color
        this.combinationMethod = document.getElementById('combinationMethod'); // Color scheme selector
        this.colorPalette = document.getElementById('colorPalette');          // Container for color combinations
        this.mixColor1Select = document.getElementById('mixColor1');          // First color for mixing
        this.mixColor2Select = document.getElementById('mixColor2');          // Second color for mixing

        // Saved palettes elements
        this.paletteName = document.getElementById('paletteName');
        this.savePaletteBtn = document.getElementById('savePalette');
        this.savedPalettesContainer = document.getElementById('savedPalettes');

        // Load saved palettes on initialization
        this.loadSavedPalettes();
    }

    /**
     * Sets up event listeners for user interactions
     * This includes slider changes, combination method changes,
     * and color mixing operations
     */
    setupEventListeners() {
        // Set up slider event listeners
        Object.keys(this.sliders).forEach(key => {
            this.sliders[key].addEventListener('input', () => {
                this.baseColor[key[0]] = parseInt(this.sliders[key].value);
                this.updateUI();
            });
        });

        // Set up combination method change listener
        this.combinationMethod.addEventListener('change', () => this.updateUI());

        // Set up mixing color selectors
        this.mixColor1Select.addEventListener('change', () => this.updateMixingPreview());
        this.mixColor2Select.addEventListener('change', () => this.updateMixingPreview());

        // Set up palette saving
        this.savePaletteBtn.addEventListener('click', () => this.savePalette());
    }

    /**
     * Updates the UI to reflect the current color and combination method
     * This includes updating the color display, value displays, and color palette
     */
    updateUI() {
        // Update value displays
        Object.keys(this.valueDisplays).forEach(key => {
            this.valueDisplays[key].textContent = this.sliders[key].value;
        });

        // Update selected color display
        const color = new CMYKColor(
            parseInt(this.sliders.cyan.value),
            parseInt(this.sliders.magenta.value),
            parseInt(this.sliders.yellow.value),
            parseInt(this.sliders.key.value)
        );
        this.baseColor = color;
        this.selectedColorDisplay.style.backgroundColor = color.toHex();

        // Generate and display color combinations
        this.updateColorPalette();

        // Update mixing color options
        this.updateMixingOptions();
    }

    /**
     * Updates the color palette to reflect the current combination method
     * This includes generating new color combinations and updating the UI
     */
    updateColorPalette() {
        const combinations = this.generateColorCombination();
        this.colorPalette.innerHTML = '';
        
        combinations.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'palette-color';
            colorDiv.style.backgroundColor = color.toHex();
            this.colorPalette.appendChild(colorDiv);
        });
    }

    /**
     * Generates a list of color combinations based on the current combination method
     * This includes complementary, monochromatic, analogous, triadic, and tetradic color schemes
     * @returns {Array<CMYKColor>} List of color combinations
     */
    generateColorCombination() {
        const combinations = [this.baseColor];
        const method = this.combinationMethod.value;

        switch (method) {
            case 'complementary':
                combinations.push(this.getComplementary());
                break;
            case 'monochromatic':
                combinations.push(...this.getMonochromatic());
                break;
            case 'analogous':
                combinations.push(...this.getAnalogous());
                break;
            case 'triadic':
                combinations.push(...this.getTriadic());
                break;
            case 'tetradic':
                combinations.push(...this.getTetradic());
                break;
        }

        return combinations;
    }

    /**
     * Returns the complementary color of the base color
     * This is the color that is directly across from the base color on the color wheel
     * @returns {CMYKColor} Complementary color
     */
    getComplementary() {
        return new CMYKColor(
            100 - this.baseColor.c,
            100 - this.baseColor.m,
            100 - this.baseColor.y,
            this.baseColor.k
        );
    }

    /**
     * Returns a list of monochromatic colors based on the base color
     * This includes different shades of the base color
     * @returns {Array<CMYKColor>} List of monochromatic colors
     */
    getMonochromatic() {
        const colors = [];
        for (let i = 1; i <= 4; i++) {
            const factor = 0.25 * i;
            colors.push(new CMYKColor(
                this.baseColor.c * factor,
                this.baseColor.m * factor,
                this.baseColor.y * factor,
                this.baseColor.k
            ));
        }
        return colors;
    }

    /**
     * Returns a list of analogous colors based on the base color
     * This includes colors that are next to the base color on the color wheel
     * @returns {Array<CMYKColor>} List of analogous colors
     */
    getAnalogous() {
        const rgb = this.baseColor.toRGB();
        const colors = [];
        [-30, 30].forEach(angle => {
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsl.h = (hsl.h + angle) % 360;
            const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            colors.push(CMYKColor.fromRGB(newRgb.r, newRgb.g, newRgb.b));
        });
        return colors;
    }

    /**
     * Returns a list of triadic colors based on the base color
     * This includes colors that are equally spaced from the base color on the color wheel
     * @returns {Array<CMYKColor>} List of triadic colors
     */
    getTriadic() {
        const rgb = this.baseColor.toRGB();
        const colors = [];
        [120, 240].forEach(angle => {
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsl.h = (hsl.h + angle) % 360;
            const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            colors.push(CMYKColor.fromRGB(newRgb.r, newRgb.g, newRgb.b));
        });
        return colors;
    }

    /**
     * Returns a list of tetradic colors based on the base color
     * This includes colors that are two spaces away from the base color on the color wheel
     * @returns {Array<CMYKColor>} List of tetradic colors
     */
    getTetradic() {
        const rgb = this.baseColor.toRGB();
        const colors = [];
        [90, 180, 270].forEach(angle => {
            const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsl.h = (hsl.h + angle) % 360;
            const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            colors.push(CMYKColor.fromRGB(newRgb.r, newRgb.g, newRgb.b));
        });
        return colors;
    }

    /**
     * Updates the mixing color options based on the current color combinations
     * This includes updating the select elements and preview colors
     */
    updateMixingOptions() {
        const combinations = this.generateColorCombination();
        this.mixColor1Select.innerHTML = '';
        this.mixColor2Select.innerHTML = '';

        combinations.forEach((color, index) => {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            option1.value = option2.value = index;
            option1.textContent = option2.textContent = `Color ${index + 1}`;
            option1.style.backgroundColor = option2.style.backgroundColor = color.toHex();
            this.mixColor1Select.appendChild(option1);
            this.mixColor2Select.appendChild(option2);
        });

        this.updateMixingPreview();
    }

    /**
     * Updates the mixing color preview based on the current selection
     * This includes updating the preview colors and mixed color result
     */
    updateMixingPreview() {
        const combinations = this.generateColorCombination();
        const color1 = combinations[this.mixColor1Select.value];
        const color2 = combinations[this.mixColor2Select.value];

        document.querySelector('.mix-color-1').style.backgroundColor = color1.toHex();
        document.querySelector('.mix-color-2').style.backgroundColor = color2.toHex();

        // CMYK color mixing following subtractive color model rules
        // When mixing two colors, we take the maximum value for each channel
        const mixedColor = new CMYKColor(
            Math.max(color1.c, color2.c), // Maximum cyan (absorbs red)
            Math.max(color1.m, color2.m), // Maximum magenta (absorbs green)
            Math.max(color1.y, color2.y), // Maximum yellow (absorbs blue)
            Math.max(color1.k, color2.k)  // Maximum black
        );

        document.querySelector('.mixed-result').style.backgroundColor = mixedColor.toHex();
    }

    /**
     * Saves the current palette to local storage
     */
    savePalette() {
        const name = this.paletteName.value.trim();
        if (!name) {
            alert('Please enter a name for the palette');
            return;
        }

        // Get current palette colors
        const colors = this.generateColorCombination().map(color => ({
            c: color.c,
            m: color.m,
            y: color.y,
            k: color.k
        }));

        // Get existing palettes
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '{}');

        // Add new palette
        savedPalettes[name] = {
            colors,
            method: this.combinationMethod.value,
            timestamp: Date.now()
        };

        // Save to local storage
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));

        // Clear input and refresh display
        this.paletteName.value = '';
        this.loadSavedPalettes();
    }

    /**
     * Loads and displays saved palettes from local storage
     */
    loadSavedPalettes() {
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '{}');
        this.savedPalettesContainer.innerHTML = '';

        Object.entries(savedPalettes)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)
            .forEach(([name, palette]) => {
                const paletteElement = document.createElement('div');
                paletteElement.className = 'saved-palette';

                const header = document.createElement('div');
                header.className = 'saved-palette-header';

                const nameElement = document.createElement('span');
                nameElement.className = 'saved-palette-name';
                nameElement.textContent = name;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-palette';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => this.deletePalette(name);

                header.appendChild(nameElement);
                header.appendChild(deleteBtn);

                const colorsContainer = document.createElement('div');
                colorsContainer.className = 'saved-palette-colors';

                palette.colors.forEach(colorData => {
                    const color = new CMYKColor(colorData.c, colorData.m, colorData.y, colorData.k);
                    const colorElement = document.createElement('div');
                    colorElement.className = 'saved-palette-color';
                    colorElement.style.backgroundColor = color.toHex();
                    // Add click handler to set this as the primary color
                    colorElement.onclick = () => this.setAsPrimaryColor(color);
                    // Add title attribute to show CMYK values on hover
                    colorElement.title = `C:${color.c}% M:${color.m}% Y:${color.y}% K:${color.k}%`;
                    colorsContainer.appendChild(colorElement);
                });

                paletteElement.appendChild(header);
                paletteElement.appendChild(colorsContainer);
                this.savedPalettesContainer.appendChild(paletteElement);
            });
    }

    /**
     * Deletes a palette from local storage
     * @param {string} name - Name of the palette to delete
     */
    deletePalette(name) {
        const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '{}');
        delete savedPalettes[name];
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
        this.loadSavedPalettes();
    }

    /**
     * Sets the given color as the primary color
     * Updates the sliders and UI to reflect the new color
     * @param {CMYKColor} color - The color to set as primary
     */
    setAsPrimaryColor(color) {
        // Update the base color
        this.baseColor = new CMYKColor(color.c, color.m, color.y, color.k);
        
        // Update sliders
        this.sliders.cyan.value = color.c;
        this.sliders.magenta.value = color.m;
        this.sliders.yellow.value = color.y;
        this.sliders.key.value = color.k;

        // Update the UI
        this.updateUI();
    }

    /**
     * Converts RGB values to HSL (Hue, Saturation, Lightness) color space
     * This is used for color manipulation and calculation
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {Object} HSL values (hue: 0-360, saturation: 0-1, lightness: 0-1)
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h * 360, s: s, l: l };
    }

    /**
     * Converts HSL values to RGB color space
     * This is used for color manipulation and calculation
     * @param {number} h - Hue value (0-360)
     * @param {number} s - Saturation value (0-1)
     * @param {number} l - Lightness value (0-1)
     * @returns {Object} RGB values (r: 0-255, g: 0-255, b: 0-255)
     */
    hslToRgb(h, s, l) {
        h /= 360;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
}

// Initialize the color palette when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ColorPalette();
});
