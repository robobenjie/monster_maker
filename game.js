// Add these helper functions at the top level
function isColorDark(color) {
    const rgb = pSBC.pSBCr(color);
    if (!rgb) return false;
    // Calculate relative luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.5;
}

function hexToHSL(hex) {
    const rgb = pSBC.pSBCr(hex);
    if (!rgb) return {h: 0, s: 0, l: 0};
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
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

    return {h: h * 360, s: s * 100, l: l * 100};
}

// Data structure for character
class Character {
    // Add hex grid constants
    static HEX_GRID = {
        ROWS: 5,
        COLS: 5,
        get TOTAL_CELLS() {
            return this.ROWS * this.COLS;
        },
        get CENTER_INDEX() {
            return Math.floor(this.TOTAL_CELLS / 2);
        },
        get DEFAULT_INDEX() {
            return Math.floor(this.TOTAL_CELLS / 2) - 2;
        }
    };

    constructor() {
        this.name = '';
        this.abilities = [];
        this.imageData = null;
        this.backgroundColor = '#f5f5f5';
        this.type = '';
        this.hp = '';
        this.armor = '3';
    }

    updateName(newName) {
        this.name = newName;
    }

    updateAbilities(newAbilities) {
        this.abilities = newAbilities;
    }

    updateImage(imageData) {
        this.imageData = imageData;
        const overlay = document.querySelector('.image-overlay');
        overlay.style.display = 'none';
    }

    updateBackground(color) {
        this.backgroundColor = color;
        
        // Get hue from background color and create dark version
        const hsl = hexToHSL(color);
        const darkColor = `hsl(${hsl.h}, ${hsl.s}%, 20%)`; // Fixed 20% lightness
        
        // Update text colors only (not borders)
        const nameInput = document.getElementById('characterName');
        const typeInput = document.getElementById('monsterType');
        const hpContainer = document.getElementById('hpContainer');
        
        nameInput.style.color = darkColor;
        typeInput.style.color = darkColor;
        hpContainer.style.color = darkColor;
        
        // Update all border colors based on background brightness
        const borderColor = isColorDark(color) ? '#ffffff' : '#666666';
        document.documentElement.style.setProperty('--border-style', `4px solid ${borderColor}`);
        
        // Update the mat background
        document.querySelector('.character-mat').style.backgroundColor = color;
        
        const armorContainer = document.getElementById('armorContainer');
        armorContainer.style.color = darkColor;
    }

    // Add method to load data from a saved character
    loadFromData(data) {
        this.name = data.name || '';
        this.abilities = data.abilities || [];
        this.imageData = data.imageData || null;
        this.backgroundColor = data.backgroundColor || '#f5f5f5';
        this.type = data.type || '';
        this.hp = data.hp || '';
        this.armor = data.armor || '3';
        this.updateDisplay();
        
        // Update overlay visibility based on imageData
        const overlay = document.querySelector('.image-overlay');
        overlay.style.display = this.imageData ? 'none' : 'flex';
        
        // Make sure to update border colors when loading
        const color = data.backgroundColor || '#f5f5f5';
        this.updateBackground(color);
    }

    // Add method to update display with current values
    updateDisplay() {
        document.getElementById('characterName').value = this.name;
        adjustNameSize();
        document.getElementById('monsterType').value = this.type;
        document.getElementById('monsterHP').value = this.hp;
        document.getElementById('monsterArmor').value = this.armor;
        const img = document.getElementById('characterImage');
        if (this.imageData) {
            img.src = this.imageData;
        }
        this.updateAbilitiesDisplay();
    }

    updateType(newType) {
        this.type = newType;
    }

    updateHP(newHP) {
        this.hp = newHP;
    }

    updateArmor(newArmor) {
        this.armor = newArmor;
    }

    addAbility(type = 'ability') {
        this.abilities.push({
            type,
            name: '',
            number: '',
            text: '',
            grid: type === 'attack' ? {
                mode: 'hex5',
                cells: Array(Character.HEX_GRID.TOTAL_CELLS).fill(false),
                activeIndex: Character.HEX_GRID.DEFAULT_INDEX
            } : null
        });
        this.updateAbilitiesDisplay();
    }

    updateAbility(index, number, text) {
        const ability = this.abilities[index];
        ability.number = number;
        ability.text = text;
    }

    deleteAbility(index) {
        this.abilities.splice(index, 1);
        this.updateAbilitiesDisplay();
    }

    updateAbilitiesDisplay() {
        // Sort abilities before displaying
        this.sortAbilities();
        
        const container = document.querySelector('.abilities-list');
        container.innerHTML = '';
        
        this.abilities.forEach((ability, index) => {
            const abilityDiv = document.createElement('div');
            abilityDiv.className = 'ability-item';
            
            let middleContent = '';
            if (ability.type === 'attack') {
                // Handle old save files
                if (!ability.grid || !ability.grid.mode) {
                    ability.grid = {
                        mode: 'hex5',
                        cells: Array(Character.HEX_GRID.TOTAL_CELLS).fill(false)
                    };
                }

                // Convert old grid formats to hex
                if (ability.grid.mode === '8x5' || ability.grid.mode === '7x7') {
                    ability.grid.mode = 'hex5';
                    ability.grid.cells = Array(Character.HEX_GRID.TOTAL_CELLS).fill(false);
                }

                const centerIndex = Character.HEX_GRID.CENTER_INDEX;
                const defaultIndex = Character.HEX_GRID.DEFAULT_INDEX;
                
                middleContent = `<div class="hex-grid">`;
                
                // Create rows of hexes
                for (let row = 0; row < Character.HEX_GRID.ROWS; row++) {
                    middleContent += `<div class="grid-row">`;
                    
                    // Each row has COLS cells
                    for (let col = 0; col < Character.HEX_GRID.COLS; col++) {
                        const index = row * Character.HEX_GRID.COLS + col;
                        const isPlayerSpot = index === defaultIndex || index === centerIndex;
                        const isActiveSpot = index === ability.grid.activeIndex;
                        
                        // Show arrow only on active spot, allow blast on inactive player spot
                        const cellContent = isActiveSpot ? '➡️' : ability.grid.cells[index] ? '💥' : '';
                        
                        middleContent += `
                            <div class="grid-cell${isActiveSpot ? ' arrow' : ''}" data-index="${index}">
                                <span>${cellContent}</span>
                            </div>`;
                    }
                    
                    // Add trailing invisible hex
                    middleContent += `<div class="grid-cell invisible"><span></span></div>`;
                    middleContent += `</div>`;
                }
                
                middleContent += `</div>`;
            }

            abilityDiv.innerHTML = `
                <div class="ability-content">
                    <input type="text" class="ability-name" value="${ability.name}" placeholder="Ability Name" data-index="${index}">
                    <div class="ability-row">
                        <div class="ability-number">
                            <input type="text" value="${ability.number}" data-index="${index}">
                        </div>
                        ${middleContent}
                        <div class="ability-text">
                            <textarea data-index="${index}" rows="1" 
                                oninput="this.style.height = '';this.style.height = this.scrollHeight + 'px'"
                            >${ability.text}</textarea>
                        </div>
                        <button class="delete-ability no-print" data-index="${index}">×</button>
                    </div>
                </div>
            `;
            container.appendChild(abilityDiv);
            
            // Add click handlers for grid cells and arrow
            if (ability.type === 'attack') {
                const gridCells = abilityDiv.querySelectorAll('.grid-cell');
                gridCells.forEach(cell => {
                    cell.addEventListener('click', () => {
                        const index = parseInt(cell.dataset.index);
                        const isActiveSpot = index === ability.grid.activeIndex;
                        
                        if (isActiveSpot) {
                            // Toggle arrow between positions
                            ability.grid.activeIndex = 
                                index === Character.HEX_GRID.DEFAULT_INDEX ? 
                                Character.HEX_GRID.CENTER_INDEX : 
                                Character.HEX_GRID.DEFAULT_INDEX;
                            this.updateAbilitiesDisplay();
                        } else {
                            // Toggle blast for non-active spots
                            ability.grid.cells[index] = !ability.grid.cells[index];
                            const span = cell.querySelector('span');
                            span.textContent = ability.grid.cells[index] ? '💥' : '';
                        }
                    });
                });
            }

            // Auto-adjust height of textarea
            const textarea = abilityDiv.querySelector('textarea');
            textarea.style.height = '';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }

    // Add new sorting method
    sortAbilities() {
        this.abilities.sort((a, b) => {
            // If both have numbers, sort numerically
            if (a.number && b.number) {
                return parseInt(a.number) - parseInt(b.number);
            }
            // If only one has a number, it goes first
            if (a.number) return -1;
            if (b.number) return 1;
            // If neither has a number, maintain original order
            return 0;
        });
    }
}

// Create a character instance
const character = new Character();

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('characterName');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const loadFile = document.getElementById('loadFile');
    const typeInput = document.getElementById('monsterType');
    const hpInput = document.getElementById('monsterHP');
    const armorInput = document.getElementById('monsterArmor');
    
    nameInput.addEventListener('input', (e) => {
        character.updateName(e.target.value);
        adjustNameSize();
    });

    // Add image handling
    const imageContainer = document.getElementById('imageContainer');
    const imageInput = document.getElementById('imageInput');

    imageContainer.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                character.updateImage(imageData);
                document.getElementById('characterImage').src = imageData;
            };
            reader.readAsDataURL(file);
        }
    });

    // Save functionality
    saveButton.addEventListener('click', () => {
        const data = JSON.stringify(character, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${character.name || 'character'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Load functionality
    loadButton.addEventListener('click', () => {
        loadFile.click();
    });

    loadFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {

                    const data = JSON.parse(e.target.result);
                    character.loadFromData(data);

            };
            reader.readAsText(file);
        }
    });

    // Add color picker functionality
    const colorButton = document.getElementById('colorButton');
    const colorPicker = document.getElementById('colorPicker');
    const characterMat = document.querySelector('.character-mat');

    colorButton.addEventListener('click', () => {
        colorPicker.click();
    });

    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        characterMat.style.backgroundColor = color;
        character.updateBackground(color);
    });

    typeInput.addEventListener('input', (e) => {
        character.updateType(e.target.value);
    });

    hpInput.addEventListener('input', (e) => {
        character.updateHP(e.target.value);
    });

    armorInput.addEventListener('input', (e) => {
        character.updateArmor(e.target.value);
    });

    const addAbilityButton = document.getElementById('addAbility');
    const addAttackButton = document.getElementById('addAttack');
    const modal = document.getElementById('deleteModal');
    let deleteIndex = null;

    addAbilityButton.addEventListener('click', () => {
        character.addAbility('ability');
    });

    addAttackButton.addEventListener('click', () => {
        character.addAbility('attack');
    });

    document.querySelector('.abilities-list').addEventListener('input', (e) => {
        const target = e.target;
        const index = parseInt(target.dataset.index);
        const ability = character.abilities[index];
        
        if (target.classList.contains('ability-name')) {
            ability.name = target.value;
        } else if (target.parentElement.className === 'ability-number') {
            ability.number = target.value;
        } else {
            ability.text = target.value;
        }
        character.updateAbility(index, ability.number, ability.text);
    });

    document.querySelector('.abilities-list').addEventListener('click', (e) => {
        if (e.target.className.includes('delete-ability')) {
            deleteIndex = parseInt(e.target.dataset.index);
            modal.style.display = 'flex';
        }
    });

    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (deleteIndex !== null) {
            character.deleteAbility(deleteIndex);
            deleteIndex = null;
        }
        modal.style.display = 'none';
    });

    document.getElementById('cancelDelete').addEventListener('click', () => {
        deleteIndex = null;
        modal.style.display = 'none';
    });

    // Add new blur event listener for number inputs
    document.querySelector('.abilities-list').addEventListener('blur', (e) => {
        const target = e.target;
        if (target.parentElement.className === 'ability-number') {
            character.updateAbilitiesDisplay(); // Only sort and update on blur of number inputs
        }
    }, true);  // Use capture phase to ensure we catch the blur event

    // Function to check and adjust text size
    function adjustNameSize() {
        // Create a temporary span to measure text width
        const span = document.createElement('span');
        span.style.font = '1.2rem Audiowide'; // Use original font size
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.textContent = nameInput.value;
        document.body.appendChild(span);
        
        // Get the width of the text
        const textWidth = span.offsetWidth;
        document.body.removeChild(span);
        
        // Get the width of the input minus padding
        const inputWidth = nameInput.offsetWidth - 16;
        
        // Reset classes
        nameInput.classList.remove('small-text', 'smaller-text', 'smallest-text');
        
        // Calculate ratio of text width to input width
        const ratio = textWidth / inputWidth;
        
        // Lower all thresholds to start shrinking sooner
        if (ratio > 1.4) {
            nameInput.classList.add('smallest-text');
        } else if (ratio > 1.0) {
            nameInput.classList.add('smaller-text');
        } else if (ratio > 0.78) {
            nameInput.classList.add('small-text');
        }
    }

    // Call adjustNameSize on load and when loading character data
    character.updateDisplay = function() {
        document.getElementById('characterName').value = this.name;
        adjustNameSize();
        document.getElementById('monsterType').value = this.type;
        document.getElementById('monsterHP').value = this.hp;
        document.getElementById('monsterArmor').value = this.armor;
        const img = document.getElementById('characterImage');
        if (this.imageData) {
            img.src = this.imageData;
        }
        this.updateAbilitiesDisplay();
    };

    // Also call it once DOM is loaded
    adjustNameSize();
}); 

// Version 4.1 - pSBC - Shade Blend Convert
const pSBC = (p,c0,c1,l) => {
    let r,g,b,P,f,t,h,m=Math.round,a=typeof(c1)=="string";
    let i=parseInt,z=Math.min,d=Math.max;
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBC.pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBC.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2);
};

pSBC.pSBCr=(d)=>{
    const i=parseInt;
    let n=d.length,x={};
    if(n>9){
        const [r, g, b, a] = d.split(",");
        n=d.length;
        if(n<3||n>4)return null;
        x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1;
    }else{
        if(n==8||n==6||n<4)return null;
        if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
        d=i(d.slice(1),16);
        if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=Math.round((d&255)/0.255)/1000;
        else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1;
    }
    return x;
}; 