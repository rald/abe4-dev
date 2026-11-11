const fs = require('fs');

function rnd(max) {
    return Math.floor(Math.random() * max);
}

function cleanStr(str) {
    return str.replace(/[\r\n]+/g, "").trim().toLowerCase();
}

// Generate character frequency histogram
function getHistogram(str) {
    const cleaned = cleanStr(str);
    const hist = {};
    for (let char of cleaned) {
        if (char >= 'a' && char <= 'z') {
            hist[char] = (hist[char] || 0) + 1;
        }
    }
    return hist;
}

// Check if subHist can be formed using letters from targetHist
function isSubAnagram(subHist, targetHist) {
    for (let char in subHist) {
        if ((targetHist[char] || 0) < subHist[char]) {
            return false;
        }
    }
    return true;
}

// Function to find all sub-anagrams of length >= minLength
function getSubAnagrams(word, wordlist, minLength = 3) {
    const targetHist = getHistogram(word);
    const matches = wordlist.filter(w => {
        const cleaned = cleanStr(w);
        if (cleaned.length < minLength) return false;
        return isSubAnagram(getHistogram(cleaned), targetHist);
    });

    // Remove duplicates
    const uniqueMatches = [...new Set(matches)];

    // Sort by length descending, with randomized positions for words of the same length
    return uniqueMatches.sort((a, b) => {
        if (b.length !== a.length) {
            return b.length - a.length; // Longer words come first
        }
        return Math.random() - 0.5; // Randomize order if lengths are identical
    });
}

// --- Main Execution Block ---
try {
    const wordlist = fs.readFileSync('wordlist.txt', 'utf8')
                       .split(/\r?\n/)
                       .map(w => cleanStr(w))
                       .filter(w => w.length >= 3);
                       
    const randword = fs.readFileSync('randword.txt', 'utf8')
                       .split(/\r?\n/)
                       .map(w => cleanStr(w))
                       .filter(w => w.length >= 3);

    if (randword.length === 0 || wordlist.length === 0) {
        console.error("Error: Word lists are empty.");
        process.exit(1);
    }

    // Pick a random word and find its sub-anagrams (3+ letters)
    const word = randword[rnd(randword.length)];
    const subAnagrams = getSubAnagrams(word, wordlist, 3);

    console.log("Chosen word:", word);
//    console.log("Character Histogram:", getHistogram(word));
    console.log(`Sub-anagrams found (${subAnagrams.length}):`);
    console.log(subAnagrams);

} catch (err) {
    console.error("Error reading text files:", err.message);
}

