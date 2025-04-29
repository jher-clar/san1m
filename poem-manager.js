// poem-manager.js

// Wrap in IIFE to avoid polluting global scope
const firebaseDatabaseURL = 'https://poetic-hana-default-rtdb.firebaseio.com/';

(function() {

    const initialPoems = [
        {
            // Added unique IDs to initial poems for potential future use,
            // though current deduplication doesn't use them.
            "id": "initial-whispers",
            "title": "Whispers of the Night",
            "poemId": "initial-whispers",
            "author": "Celestia Moon",
            "poem": "As the stars begin to gleam,\nAnd the world descends in a dream,\nA gentle hush, a whispered plea,\nFrom the moon, so bright and free.\n\nShadows dance in the pale moonlight,\nWhispering secrets to the quiet night,\nOf ancient tales and forgotten lore,\nAs the world outside begins to snore.\n\nIn this realm where silence thrives,\nA new sense of wonder truly survives,\nWith every heartbeat, soft and deep,\nAs the moonlit world does gently sleep.",
            "score": 72
        },
        {
            "id": "initial-dance",
            "title": "The Dance of Dawn",
            "poemId": "initial-dance",
            "author": "Aurora Light",
            "poem": "With hues of pink and gold so grand,\nDawn breaks across the sleeping land,\nA gentle breeze begins to sigh,\nAs darkness fades from the eastern sky.\n\nBirds awaken with songs so sweet,\nAs dewdrops kiss the flowers' feet,\nA symphony of life anew,\nAs nature wakes, refreshed and true.\n\nIn this dance of day's first light,\nAll shadows flee from the vibrant sight,\nWith every step, a new embrace,\nAs the world awakens with grace.",
            "score": 68
        },
        {
            "id": "initial-echoes",
            "title": "Echoes in the Heart",
            "poemId": "initial-echoes",
            "author": "Lyric Soul",
            "poem": "In chambers of the heart, memories reside,\nEchoes of laughter, where moments glide,\nOf love and loss, a bittersweet array,\nIn the silent theatre of yesterday.\n\nEach beat, a drum, to stories untold,\nIn the depths of feeling, both brave and bold,\nA tapestry woven with joy and pain,\nIn the heart's rhythm, a soft refrain.\n\nAs the echoes linger, clear and bright,\nThey paint the soul with day's warm light,\nIn this grand hall, where time is kept,\nWhere the heart's own secrets softly slept.",
            "score": 75
        }
    ];

    // Function to escape HTML characters
    function escapeHTML(str) {
        if (typeof str !== 'string') return ''; // Handle non-string input
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;', '<': '&lt;', '>': '&gt;',
                '"': '&quot;', "'": '&#039;'
            }[m];
        });
    }

    // Function to create a poem card DOM element
    function createPoemCard(poem, isTop = false) {
        const card = document.createElement('div');
        card.className = isTop ? "poem-card top-poem" : "poem-card";

        // Use innerHTML with escaped content
        const poemTitle = escapeHTML(poem.title || "Untitled");
        const poemContent = escapeHTML(poem.poem).replace(/\n/g, "<br>");
        const authorName = escapeHTML(poem.author);
        card.innerHTML = `
        <h3>${poemTitle}</h3>
        <p>${poemContent}</p>
        <p><em>— ${authorName}</em> (Score: ${poem.score || 0})</p>
        `;
        return card;
    }

    // Function to load and display poems (specifically targets #topPoems based on current code)
    window.loadPoems = async function() { // Expose to global scope if needed
        const topPoemsContainer = document.getElementById("topPoems");
         if (!topPoemsContainer) {
             console.error("#topPoems element not found.");
             return; // Exit if element is missing
         }

        // Clear current top poems list
        topPoemsContainer.innerHTML = '<h2>🏆 Top Poems</h2>'; // Keep the title
    
        try {
            // Fetch top 10 poems from Firebase ordered by score (descending)
            const response = await fetch(`${firebaseDatabaseURL}/poems.json?orderBy="score"&limitToLast=10`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
    
            if (data) {
                // Convert data from object to array of poems, sort, and take top 10
                const poems = Object.entries(data)
                    .map(([key, value]) => ({ ...value, poemId: key })) // Add poemId
                    .sort((a, b) => (b.score || 0) - (a.score || 0)); // Handle potential undefined scores

                // Loop through the snapshot and add poem cards
                poems.forEach((poem) => {
                    const card = createPoemCard(poem, true);
                    topPoemsContainer.appendChild(card);
                });
            } else {
                 // Optional: Display a message if no poems are available
                const message = document.createElement('p');
                message.textContent = "No poems submitted yet! Be the first to add one!";
                topPoemsContainer.appendChild(message);
            }
        } catch (error) {
            console.error("Error fetching or processing poems:", error);
        
            const message = document.createElement('p');
            message.textContent = "Unable to load poems. Please check your connection.";
            topPoemsContainer.appendChild(message);
        }
    }
    
    
    // Function to set up the poem submission form
    window.setupPoemForm = function() { // Expose to global scope if needed
        const poemForm = document.getElementById("poemForm");
        const resultMsg = document.getElementById("resultMsg");

          if (!poemForm) {
              console.error("#poemForm element not found.");
              return; // Exit if element is missing
          }

        poemForm.addEventListener("submit", async function (e) {
            e.preventDefault(); // Prevent default form submission

            const authorInput = document.getElementById("author");
            const titleInput = document.getElementById("title");
            const poemTextarea = document.getElementById("poem");

            const poem = poemTextarea.value.trim();
            const author = authorInput.value.trim();
            const title = titleInput.value.trim();

            if (poem && author) {
                 // Check if analyzePoem function exists before calling
                 if (typeof window.analyzePoem !== 'function') {
                     console.error("analyzePoem function not available. Is poem-scoring.js loaded correctly?");
                     // Display a user-friendly error message
                     if(resultMsg) {
                         resultMsg.textContent = "Error: Scoring function not loaded. Please refresh.";
                         resultMsg.style.color = 'red';
                     }
                     return;
                 }

                 let result = null; // Initialize result to null
                  if(resultMsg) {
                     resultMsg.textContent = "Hana is analyzing your poem..."; // Provide user feedback while analyzing
                     resultMsg.style.color = 'black'; // Optional styling
                  }

                 // FIX: Add try...catch block around the analyzePoem call
                 try {
                         result = await window.analyzePoem(poem); // Call analyzePoem from poem-scoring.js

                     // Check if analyzePoem returned a valid result object (not just an error object)
                     if (!result || !result.breakdown) {
                         throw new Error(result && result.error ? result.error : "Analysis returned invalid structure.");
                     }

                 } catch (error) {
                         console.error("Error during poem analysis:", error);
                         // Display a user-friendly error message
                         if(resultMsg) {
                          resultMsg.textContent = `Analysis failed: ${error.message || error}`;
                          resultMsg.style.color = 'red';
                      }
                         // We return here because we cannot proceed without a valid score
                         return;
                 }

                 // If we reached here, result is valid
                 const score = result.score;
                 const newPoem = { // Create a new object with the correct structure
                     // Ensure uuidv4 function exists before calling
                     author: author,
                     poem: poem,
                     score: score,
                     title: title || "Untitled" // Added title
                 };

         

                  // Update displayed poems (re-sort and show top N)
                  await loadPoems();


                  try {
                     const response = await fetch(`${firebaseDatabaseURL}/poems.json`, {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                         },
                         body: JSON.stringify(newPoem),
                     });

                     if (!response.ok) {
                         throw new Error(`Failed to submit poem: ${response.status}`);
                     }

                     const data = await response.json();
                 } catch (error) {
                     console.error("Error submitting poem:", error);
                     // Handle the error, e.g., display a message to the user
                 }

                 // Show the score dialog
                 // Ensure showPoemScore function exists before calling
                 if (typeof window.showPoemScore === 'function') {
                     window.showPoemScore(result.score, result.breakdown); // Pass breakdown directly
                 } else {
                     console.error("showPoemScore function not available. Is poem-scoring.js loaded correctly?");
                     // Fallback: maybe just log the score or display in resultMsg
                     if(resultMsg) {
                         resultMsg.textContent = `Poem submitted! Score: ${result.score}/100`;
                         resultMsg.style.color = 'black'; // Optional styling
                     }
                 }

                  // Clear the "Analyzing..." message or replace it
                  if(resultMsg) {
                      resultMsg.textContent = `Poem submitted! Score: ${result.score}/100`;
                      resultMsg.style.color = 'black'; // Optional styling
                  }


                 // Clear the form
                 poemForm.reset(); // Use reset

                 // Speak as Hana (optional, depends on hana-bot.js)
                 if (typeof window.speakAsHana === 'function') {
                     window.speakAsHana(`That was lovely, ${author}! You got ${score} out of 100!`);
                 } else {
                     console.warn("speakAsHana function not available.");
                 }

             } else {
                 // Handle case where poem or author is empty (though 'required' attribute helps)
                 // alert("Please write a poem and enter your name."); // Basic user feedback - alerts can be disruptive
                 if(resultMsg) {
                     resultMsg.textContent = "Please write a poem and enter your name.";
                     resultMsg.style.color = 'orange';
                 }
             }
         });
     }

     // No need to explicitly add to window here, the function definitions handle it

})(); // End of IIFE
