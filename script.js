let knowledgeBase = null;
let currentGoalIndex = 0;
let currentRuleIndex = 0;
let facts = {}; // Memori jawaban user

// 1. Ambil data JSON saat halaman dimuat
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Gagal memuat data.json");
        knowledgeBase = await response.json();
        console.log("Data loaded:", knowledgeBase);
        
        // Aktifkan tombol mulai setelah data siap
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').innerText = "Mulai Diagnosa";
    } catch (error) {
        alert("Error: " + error.message + "\nPastikan Anda menggunakan Local Server (Live Server)!");
        console.error(error);
    }
}

// 2. Fungsi Memulai Diagnosa
function startDiagnosis() {
    // Reset variabel
    currentGoalIndex = 0;
    currentRuleIndex = 0;
    facts = {};

    // Atur tampilan UI
    document.getElementById('intro-view').classList.add('hidden');
    document.getElementById('question-view').classList.remove('hidden');
    document.getElementById('result-view').classList.add('hidden');

    processNextStep();
}

// 3. Logika Utama Backward Chaining
function processNextStep() {
    // Cek apakah Goal habis?
    if (currentGoalIndex >= knowledgeBase.goals.length) {
        showResult(false, "Sistem tidak dapat menemukan diagnosa yang cocok.");
        return;
    }

    const currentGoal = knowledgeBase.goals[currentGoalIndex];
    const currentRuleKey = currentGoal.rules[currentRuleIndex];

    // Cek di memori (facts), apakah pertanyaan ini sudah pernah dijawab?
    if (facts.hasOwnProperty(currentRuleKey)) {
        if (facts[currentRuleKey] === true) {
            // Jika YA, lanjut ke rule berikutnya di goal yang sama
            nextRule();
        } else {
            // Jika TIDAK, goal ini gugur. Pindah ke goal berikutnya
            nextGoal();
        }
    } else {
        // Jika belum ada di memori, tampilkan pertanyaan
        displayQuestion(currentRuleKey);
    }
}

// 4. Menampilkan Pertanyaan ke HTML
function displayQuestion(ruleKey) {
    const questionText = knowledgeBase.questions[ruleKey] || "Apakah " + ruleKey + "?";
    document.getElementById('question-text').innerText = questionText;
}

// 5. Menangani Klik Tombol Ya/Tidak
function handleAnswer(answer) {
    const currentGoal = knowledgeBase.goals[currentGoalIndex];
    const currentRuleKey = currentGoal.rules[currentRuleIndex];

    // Simpan ke memori
    facts[currentRuleKey] = answer;

    if (answer === true) {
        nextRule();
    } else {
        // Backward chaining: 1 syarat salah = Goal salah.
        nextGoal();
    }
}

function nextRule() {
    const currentGoal = knowledgeBase.goals[currentGoalIndex];
    currentRuleIndex++;

    // Jika semua rule dalam goal ini terpenuhi
    if (currentRuleIndex >= currentGoal.rules.length) {
        showResult(true, currentGoal.diagnosis);
    } else {
        processNextStep();
    }
}

function nextGoal() {
    currentGoalIndex++;
    currentRuleIndex = 0; // Reset rule untuk goal baru
    processNextStep();
}

// 6. Menampilkan Hasil
// GANTI FUNGSI showResult LAMA DENGAN YANG INI:

function showResult(success, diagnosisOrMessage) {
    document.getElementById('question-view').classList.add('hidden');
    document.getElementById('result-view').classList.remove('hidden');

    const resultText = document.getElementById('result-text');
    const resultBox = document.getElementById('final-result-box');

    if (success) {
        // KASUS 1: Diagnosa Ditemukan
        resultText.innerText = "Diagnosa Ditemukan:";
        resultBox.className = "result-box success";
        resultBox.innerHTML = `
            <h3>${diagnosisOrMessage}</h3>
            <p>Sistem memiliki tingkat keyakinan tinggi berdasarkan jawaban Anda.</p>
        `;
    } else {
        // KASUS 2: Diagnosa Gagal (Smart Failure)
        resultText.innerText = "Diagnosa Tidak Spesifik:";
        resultBox.className = "result-box failure";
        
        // Kumpulkan fakta yang bernilai TRUE
        let gejalaTerdeteksi = [];
        for (let key in facts) {
            if (facts[key] === true) {
                // Ambil teks pertanyaan aslinya dari knowledgeBase untuk ditampilkan
                let label = knowledgeBase.questions[key] || key;
                gejalaTerdeteksi.push(`<li>${label} (YA)</li>`);
            }
        }

        if (gejalaTerdeteksi.length > 0) {
            resultBox.innerHTML = `
                <p>Maaf, sistem tidak menemukan diagnosa pasti yang 100% cocok dengan database kami.</p>
                <p><strong>Namun, Anda mengonfirmasi gejala berikut:</strong></p>
                <ul style="text-align:left; margin-bottom:15px;">
                    ${gejalaTerdeteksi.join('')}
                </ul>
                <p>Saran: Kemungkinan kerusakan gabungan atau ada gejala yang terlewat. Disarankan membawa unit ke teknisi.</p>
            `;
        } else {
            resultBox.innerText = "Anda menjawab TIDAK untuk semua gejala. Komputer Anda mungkin dalam keadaan sehat, atau gejala belum terdaftar.";
        }
    }
    
    resultBox.style.display = 'block';
}

function restart() {
    document.getElementById('result-view').classList.add('hidden');
    document.getElementById('intro-view').classList.remove('hidden');
}

// Jalankan loadData saat script diload
loadData();