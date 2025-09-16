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

function getNextOccurrence(month, day) {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // get date
    const thisYearDate = new Date(currentYear, month - 1, day);
    
    // if date passed, use next year
    if (thisYearDate < today) {
        return new Date(currentYear + 1, month - 1, day);
    }
    
    return thisYearDate;
}

function getNextBirthday(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // get birthday
    let nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
    
    // if birthday passed, use next year
    if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    }
    
    return nextBirthday.toISOString().split('T')[0];
}

const knownHolidays = {
    'christmas': () => {
        const nextChristmas = getNextOccurrence(12, 25);
        return nextChristmas.toISOString().split('T')[0];
    },
    'valentine\'s day': () => {
        const nextValentines = getNextOccurrence(2, 14);
        return nextValentines.toISOString().split('T')[0];
    },
    'mother\'s day': () => {
        // Mother's Day is the second Sunday in May
        const today = new Date();
        const currentYear = today.getFullYear();
        const may = new Date(currentYear, 4, 1); // May 1st
        const firstSunday = may.getDay() === 0 ? 1 : 8 - may.getDay();
        const secondSunday = firstSunday + 7;
        const thisYearMotherDay = new Date(currentYear, 4, secondSunday);
        
        // if Mother's Day already passed, use next year
        if (thisYearMotherDay < today) {
            const nextYear = currentYear + 1;
            const nextMay = new Date(nextYear, 4, 1);
            const nextFirstSunday = nextMay.getDay() === 0 ? 1 : 8 - nextMay.getDay();
            const nextSecondSunday = nextFirstSunday + 7;
            return `${nextYear}-05-${nextSecondSunday.toString().padStart(2, '0')}`;
        }
        
        return `${currentYear}-05-${secondSunday.toString().padStart(2, '0')}`;
    },
    'father\'s day': () => {
        // Father's Day is the third Sunday in June
        const today = new Date();
        const currentYear = today.getFullYear();
        const june = new Date(currentYear, 5, 1); // June 1st
        const firstSunday = june.getDay() === 0 ? 1 : 8 - june.getDay();
        const thirdSunday = firstSunday + 14;
        const thisYearFatherDay = new Date(currentYear, 5, thirdSunday);
        
        // if Father's Day passed, use next year
        if (thisYearFatherDay < today) {
            const nextYear = currentYear + 1;
            const nextJune = new Date(nextYear, 5, 1);
            const nextFirstSunday = nextJune.getDay() === 0 ? 1 : 8 - nextJune.getDay();
            const nextThirdSunday = nextFirstSunday + 14;
            return `${nextYear}-06-${nextThirdSunday.toString().padStart(2, '0')}`;
        }
        
        return `${currentYear}-06-${thirdSunday.toString().padStart(2, '0')}`;
    }
};

// Handle occasion selection to show/hide date input
occasionSelect.addEventListener('change', function() {
    const selectedOccasion = this.value.toLowerCase();
    
    if (knownHolidays[selectedOccasion]) {
        // Auto-fill date for known holidays using smart calculation
        giftDateInput.value = knownHolidays[selectedOccasion]();
        dateGroup.style.display = 'none';
        giftDateInput.required = false;
    } else {
        // Show datepicker for custom occasions
        dateGroup.style.display = 'block';
        giftDateInput.required = true;
        giftDateInput.value = '';
    }
});

function validatePastDate(occasion, dateValue) {
    if (dateValue) {
        const enteredDateObj = new Date(dateValue);
        const today = new Date();
        const daysDiff = Math.ceil((enteredDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        // If the date is more than a year in the past, ask for confirmation
        if (daysDiff < -365) {
            const enteredDateFormatted = new Date(dateValue).toLocaleDateString();
            
            const userChoice = confirm(`You have entered a date that is in the past (${enteredDateFormatted}). Are you sure this is the date you wanted to enter?\n\nClick OK to keep this date, or Cancel to change it.`);
            
            if (!userChoice) {
                // User wants to change the date
                if (occasion === 'birthday') {
                    const nextBirthday = getNextBirthday(dateValue);
                    const nextBirthdayFormatted = new Date(nextBirthday).toLocaleDateString();
                    
                    if (confirm(`Would you like to use the upcoming birthday on ${nextBirthdayFormatted} instead?`)) {
                        giftDateInput.value = nextBirthday;
                        return nextBirthday;
                    }
                }
                return null;
            }
        }
    }
    return dateValue;
}

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
    const occasion = formData.get('occasion');
    let giftDate = formData.get('giftDate');
    
    giftDate = validatePastDate(occasion, giftDate);
    
    if (giftDate === null) {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Gift Ideas ✨';
        return;
    }
    
    const data = {
        name: formData.get('name'),
        age: parseInt(formData.get('age')),
        hobbies: formData.get('hobbies'),
        occasion: occasion,
        giftDate: giftDate
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