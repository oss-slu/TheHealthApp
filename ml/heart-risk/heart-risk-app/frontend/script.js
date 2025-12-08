// Wait for the page to load
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. CONFIGURATION ---
    const apiUrl = "/predict"; // Relative path to our backend (NO CORS needed)
    const questionsContainer = document.getElementById("dynamic-questions");
    const form = document.getElementById("risk-form");
    const submitBtn = document.getElementById("submit-btn");

    // Result elements
    const resultWrapper = document.getElementById("result-wrapper");
    const resultMainBox = document.getElementById("result-main-box");
    const resultLevel = document.getElementById("result-level");
    const resultAdvice = document.getElementById("result-advice");
    const resultUrgent = document.getElementById("result-urgent");
    const resultTipsBox = document.getElementById("result-tips-box");
    const resultTips = document.getElementById("result-tips");
    const resultGeneralTips = document.getElementById("result-general-tips");

    // Define the 8 binary questions
    const binaryQuestions = [
        { id: "High_BP", label: "3. Have you been diagnosed with High Blood Pressure?" },
        { id: "High_Cholesterol", label: "4. Have you been diagnosed with High Cholesterol?" },
        { id: "Smoking", label: "5. Are you currently a Smoker?" },
        { id: "Family_History", label: "6. Do you have a Family History of heart disease?" },
        { id: "Chronic_Stress", label: "7. Do you regularly experience Chronic Stress?" },
        { id: "Shortness_of_Breath", label: "8. Do you experience Shortness of Breath?" },
        { id: "Pain_Arms_Jaw_Back", label: "9. Do you feel pain in your Arms, Jaw, or Back?" },
        { id: "Cold_Sweats_Nausea", label: "10. Do you experience Cold Sweats or Nausea?" }
    ];

    // --- 2. DYNAMICALLY CREATE QUESTIONS (Using Radio Buttons) ---
    binaryQuestions.forEach(q => {
        const group = document.createElement("div");
        group.className = "form-group";
        
        group.innerHTML = `
            <label>${q.label}</label>
            <div class="radio-group">
                <input type="radio" id="${q.id}-no" name="${q.id}" value="0" checked>
                <label for="${q.id}-no">No</label>
                
                <input type="radio" id="${q.id}-yes" name="${q.id}" value="1">
                <label for="${q.id}-yes">Yes</label>
                
                <input type="radio" id="${q.id}-dk" name="${q.id}" value="0">
                <label for="${q.id}-dk">Don't Know</label>
            </div>
        `;
        questionsContainer.appendChild(group);
    });

    // --- 3. FORM SUBMISSION HANDLER ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        submitBtn.textContent = "Checking...";
        submitBtn.disabled = true;
        resultWrapper.classList.add("hidden"); 

        const formData = {
            Age: parseFloat(document.getElementById("Age").value),
            Gender: parseInt(document.getElementById("Gender").value),
            High_BP: parseInt(document.querySelector('input[name="High_BP"]:checked').value),
            High_Cholesterol: parseInt(document.querySelector('input[name="High_Cholesterol"]:checked').value),
            Smoking: parseInt(document.querySelector('input[name="Smoking"]:checked').value),
            Family_History: parseInt(document.querySelector('input[name="Family_History"]:checked').value),
            Chronic_Stress: parseInt(document.querySelector('input[name="Chronic_Stress"]:checked').value),
            Shortness_of_Breath: parseInt(document.querySelector('input[name="Shortness_of_Breath"]:checked').value),
            Pain_Arms_Jaw_Back: parseInt(document.querySelector('input[name="Pain_Arms_Jaw_Back"]:checked').value),
            Cold_Sweats_Nausea: parseInt(document.querySelector('input[name="Cold_Sweats_Nausea"]:checked').value),
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`API error! Status: ${response.status}`);
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) { // <-- BUG FIX IS HERE (Added {)
            console.error("Error during prediction:", error);
            displayError("Could not connect to the prediction service. Please ensure the backend is running.");
        } finally {
            submitBtn.textContent = "Check"; 
            submitBtn.disabled = false;
        }
    });

    // --- 4. DISPLAY HELPER FUNCTIONS (FULLY CORRECTED) ---
    function displayResults(data) {
        // Clear previous results
        resultUrgent.innerHTML = "";
        resultTips.innerHTML = "";
        resultGeneralTips.innerHTML = "";
        
        // --- Point 5b: Populate Main Result Box ---
        resultLevel.textContent = data.risk_level;
        resultAdvice.textContent = data.advice;
        
        // Set color based on risk
        const riskClass = data.risk_level.toLowerCase().split(' ')[0];
        resultMainBox.className = "result-box " + riskClass; // "result-box low", "result-box medium", etc.

        // --- BUG FIX 1: Handle Urgent Warning ---
        if (data.urgent_warning && data.urgent_warning.length > 0) {
            resultUrgent.textContent = data.urgent_warning;
        }

        // --- Point 5c: Populate Tips Box ---
        
        // --- BUG FIX 2: Define has PersonalizedTips ---
        let hasPersonalizedTips = data.personalized_tips && data.personalized_tips.length > 0;
        let hasGeneralTips = data.general_tips && data.general_tips.length > 0;

        if (hasPersonalizedTips) {
            let tipsHtml = "<h4>Your Personalized Tips</h4>";
            data.personalized_tips.forEach(category => {
                tipsHtml += `<div class="tip-category"><h4>${category.title}</h4><ul>`;
                category.points.forEach(point => {
                    tipsHtml += `<li>${point}</li>`;
                });
                tipsHtml += `</ul></div>`;
            });
            resultTips.innerHTML = tipsHtml;
        }

        if (hasGeneralTips) {
            let generalTipsHtml = "<h4>General Recommendations</h4><ul>";
            data.general_tips.forEach(point => {
                generalTipsHtml += `<li>${point}</li>`;
            });
            generalTipsHtml += `</ul>`;
            resultGeneralTips.innerHTML = generalTipsHtml;
        }
        
        // Only show the tips box if there is something to show
        if (hasPersonalizedTips || hasGeneralTips) {
            resultTipsBox.classList.remove("hidden");
        } else {
            resultTipsBox.classList.add("hidden");
        }
        
        // Show the entire result wrapper
        resultWrapper.classList.remove("hidden");
    }

    function displayError(message) {
        resultMainBox.className = "result-box high"; 
        resultLevel.textContent = "Error";
        resultAdvice.textContent = message;
        resultUrgent.innerHTML = "";
        resultTips.innerHTML = "";
        resultGeneralTips.innerHTML = "";
        
        resultTipsBox.classList.add("hidden");
        resultWrapper.classList.remove("hidden");
    }
});