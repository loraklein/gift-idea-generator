console.log('connected ');

// DOM elements
const form = document.getElementById('giftForm');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

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
        occasion: formData.get('occasion')
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

function displayResults(result) {
    const { input, gifts } = result;
    
    let html = `
        <div class="results-header">
            <h2>🎁 Perfect Gifts for ${input.name}</h2>
        </div>
        
        <div class="person-info">
            <strong>Gift recipient:</strong> ${input.name}, age ${input.age}<br>
            <strong>Occasion:</strong> ${input.occasion}<br>
            ${input.hobbies ? `<strong>Interests:</strong> ${input.hobbies}` : ''}
        </div>
    `;

    gifts.forEach((gift, index) => {
        const scoreColor = gift.fit_score >= 90 ? '#28a745' : 
                          gift.fit_score >= 80 ? '#ffc107' : 
                          gift.fit_score >= 70 ? '#fd7e14' : '#dc3545';

        html += `
            <div class="gift-item">
                <div class="gift-header">
                    <div class="gift-name">${index + 1}. ${gift.name}</div>
                    <div class="fit-score" style="background-color: ${scoreColor}">
                        ${gift.fit_score}% match
                    </div>
                </div>
                <div class="gift-description">${gift.description}</div>
                <div class="gift-reasoning">
                    <strong>Why this works:</strong> ${gift.reasoning}
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
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