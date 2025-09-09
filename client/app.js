console.log('connected ');

// DOM elements
const form = document.getElementById('giftForm');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const occasionSelect = document.getElementById('occasion');
const dateGroup = document.getElementById('dateGroup');
const giftDateInput = document.getElementById('giftDate');

const knownHolidays = {
    'christmas': () => `${new Date().getFullYear()}-12-25`,
    'valentine\'s day': () => `${new Date().getFullYear()}-02-14`,
    'mother\'s day': () => {
        // Mother's Day is the second Sunday in May
        const year = new Date().getFullYear();
        const may = new Date(year, 4, 1);
        const firstSunday = may.getDay() === 0 ? 1 : 8 - may.getDay();
        const secondSunday = firstSunday + 7;
        return `${year}-05-${secondSunday.toString().padStart(2, '0')}`;
    },
    'father\'s day': () => {
        // Father's Day is the third Sunday in June
        const year = new Date().getFullYear();
        const june = new Date(year, 5, 1);
        const firstSunday = june.getDay() === 0 ? 1 : 8 - june.getDay();
        const thirdSunday = firstSunday + 14;
        return `${year}-06-${thirdSunday.toString().padStart(2, '0')}`;
    }
};

// Handle occasion selection to show/hide date input
occasionSelect.addEventListener('change', function() {
    const selectedOccasion = this.value.toLowerCase();
    
    if (knownHolidays[selectedOccasion]) {
        // Auto-fill date for known holidays using dynamic calculation
        giftDateInput.value = knownHolidays[selectedOccasion]();
        dateGroup.style.display = 'none';
        giftDateInput.required = false;
    } else {
        // Show datepicker for custom occasions
        dateGroup.style.display = 'block';
        giftDateInput.required = true;
        giftDateInput.value = ''; // Clear previous 
    }
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Hide previous results/errors
    resultsDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating...';

    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        age: parseInt(formData.get('age')),
        hobbies: formData.get('hobbies'),
        occasion: formData.get('occasion'),
        giftDate: formData.get('giftDate')
    };

    try {
        const response = await fetch('http://localhost:3000/generate-gifts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            displayResults(result);
        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Gift Ideas ✨';
    }
});

// Component functions using pure DOM API
function createResultsHeader(name) {
    const header = document.createElement('div');
    header.className = 'results-header';
    
    const title = document.createElement('h2');
    title.textContent = `🎁 Perfect Gifts for ${name}`;
    
    header.appendChild(title);
    return header;
}

function createPersonInfo(input) {
    const info = document.createElement('div');
    info.className = 'person-info';
    
    // Gift recipient line
    const recipientLabel = document.createElement('strong');
    recipientLabel.textContent = 'Gift recipient: ';
    const recipientText = document.createTextNode(`${input.name}, age ${input.age}`);
    const recipientLine = document.createElement('div');
    recipientLine.appendChild(recipientLabel);
    recipientLine.appendChild(recipientText);
    info.appendChild(recipientLine);
    
    // Occasion line
    const occasionLabel = document.createElement('strong');
    occasionLabel.textContent = 'Occasion: ';
    const occasionText = document.createTextNode(input.occasion);
    const occasionLine = document.createElement('div');
    occasionLine.appendChild(occasionLabel);
    occasionLine.appendChild(occasionText);
    info.appendChild(occasionLine);
    
    // Hobbies line (if exists)
    if (input.hobbies) {
        const hobbiesLabel = document.createElement('strong');
        hobbiesLabel.textContent = 'Interests: ';
        const hobbiesText = document.createTextNode(input.hobbies);
        const hobbiesLine = document.createElement('div');
        hobbiesLine.appendChild(hobbiesLabel);
        hobbiesLine.appendChild(hobbiesText);
        info.appendChild(hobbiesLine);
    }
    
    // Gift date line (if exists)
    if (input.giftDate) {
        const dateLabel = document.createElement('strong');
        dateLabel.textContent = 'Gift Date: ';
        const dateText = document.createTextNode(new Date(input.giftDate).toLocaleDateString());
        const dateLine = document.createElement('div');
        dateLine.appendChild(dateLabel);
        dateLine.appendChild(dateText);
        info.appendChild(dateLine);
    }
    
    return info;
}

function createSeasonalContext(dateAnalysis) {
    const container = document.createElement('div');
    container.className = 'seasonal-context';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = '🌤️ Seasonal Context';
    container.appendChild(title);
    
    // Context info container
    const contextInfo = document.createElement('div');
    contextInfo.className = 'context-info';
    
    // Season line
    const seasonLabel = document.createElement('strong');
    seasonLabel.textContent = 'Season: ';
    const seasonText = document.createTextNode(dateAnalysis.season.charAt(0).toUpperCase() + dateAnalysis.season.slice(1));
    const seasonLine = document.createElement('div');
    seasonLine.appendChild(seasonLabel);
    seasonLine.appendChild(seasonText);
    contextInfo.appendChild(seasonLine);
    
    // Weather line
    const weatherLabel = document.createElement('strong');
    weatherLabel.textContent = 'Weather: ';
    const weatherText = document.createTextNode(dateAnalysis.weatherPatterns);
    const weatherLine = document.createElement('div');
    weatherLine.appendChild(weatherLabel);
    weatherLine.appendChild(weatherText);
    contextInfo.appendChild(weatherLine);
    
    // Timing line
    const timingLabel = document.createElement('strong');
    timingLabel.textContent = 'Timing: ';
    const timingText = document.createTextNode(dateAnalysis.timingContext);
    const timingLine = document.createElement('div');
    timingLine.appendChild(timingLabel);
    timingLine.appendChild(timingText);
    contextInfo.appendChild(timingLine);
    
    // Days until line (if available)
    if (dateAnalysis.daysUntil !== null) {
        const daysLabel = document.createElement('strong');
        daysLabel.textContent = 'Days until gift: ';
        const daysText = document.createTextNode(dateAnalysis.daysUntil.toString());
        const daysLine = document.createElement('div');
        daysLine.appendChild(daysLabel);
        daysLine.appendChild(daysText);
        contextInfo.appendChild(daysLine);
    }
    
    container.appendChild(contextInfo);
    return container;
}

function createGiftItem(gift, index) {
    const item = document.createElement('div');
    item.className = 'gift-item';
    
    // Gift header
    const giftHeader = document.createElement('div');
    giftHeader.className = 'gift-header';
    
    // Gift name
    const giftName = document.createElement('div');
    giftName.className = 'gift-name';
    giftName.textContent = `${index + 1}. ${gift.name}`;
    giftHeader.appendChild(giftName);
    
    // Fit score
    const fitScore = document.createElement('div');
    fitScore.className = 'fit-score';
    fitScore.textContent = `${gift.fit_score}% match`;
    
    // Set score color
    const scoreColor = gift.fit_score >= 90 ? '#28a745' : 
                      gift.fit_score >= 80 ? '#ffc107' : 
                      gift.fit_score >= 70 ? '#fd7e14' : '#dc3545';
    fitScore.style.backgroundColor = scoreColor;
    
    giftHeader.appendChild(fitScore);
    item.appendChild(giftHeader);
    
    // Gift description
    const giftDescription = document.createElement('div');
    giftDescription.className = 'gift-description';
    giftDescription.textContent = gift.description;
    item.appendChild(giftDescription);
    
    // Gift reasoning
    const giftReasoning = document.createElement('div');
    giftReasoning.className = 'gift-reasoning';
    
    const reasoningLabel = document.createElement('strong');
    reasoningLabel.textContent = 'Why this works: ';
    const reasoningText = document.createTextNode(gift.reasoning);
    
    giftReasoning.appendChild(reasoningLabel);
    giftReasoning.appendChild(reasoningText);
    item.appendChild(giftReasoning);
    
    return item;
}

function displayResults(result) {
    const { input, gifts, toolResults } = result;
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    
    // Create and append components
    resultsDiv.appendChild(createResultsHeader(input.name));
    resultsDiv.appendChild(createPersonInfo(input));
    
    // Add seasonal context if available
    if (toolResults && toolResults.length > 0) {
        resultsDiv.appendChild(createSeasonalContext(toolResults[0]));
    }
    
    // Add gift items
    gifts.forEach((gift, index) => {
        resultsDiv.appendChild(createGiftItem(gift, index));
    });
    
    resultsDiv.style.display = 'block';
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    errorDiv.innerHTML = `
        <strong>Oops! Something went wrong:</strong><br>
        ${message}
    `;
    errorDiv.style.display = 'block';
}