// src/app/page.js
"use client";
import { useState, useEffect } from 'react';

export default function Home() {
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  
  // State Engine Backward Chaining
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [facts, setFacts] = useState({});
  const [result, setResult] = useState(null);

  // 1. Ambil Data dari Database saat web dibuka
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setKnowledgeBase(data);
        setLoading(false);
      })
      .catch(err => alert("Gagal koneksi database"));
  }, []);

  // 2. Logika Backward Chaining (Mirip sebelumnya)
  const processNextStep = (goalIdx, ruleIdx, currentFacts) => {
    if (!knowledgeBase) return;

    // Jika Goal habis
    if (goalIdx >= knowledgeBase.goals.length) {
      setResult({ success: false, message: "Penyakit tidak teridentifikasi dalam database kami." });
      return;
    }

    const currentGoal = knowledgeBase.goals[goalIdx];
    const currentRuleKey = currentGoal.rules[ruleIdx];

    // Cek Memori
    if (currentFacts.hasOwnProperty(currentRuleKey)) {
      if (currentFacts[currentRuleKey] === true) {
        nextRule(goalIdx, ruleIdx, currentFacts);
      } else {
        nextGoal(goalIdx, currentFacts);
      }
    } else {
      // Update state untuk menampilkan pertanyaan
      setCurrentGoalIndex(goalIdx);
      setCurrentRuleIndex(ruleIdx);
    }
  };

  const nextRule = (goalIdx, ruleIdx, currentFacts) => {
    const currentGoal = knowledgeBase.goals[goalIdx];
    const nextRIdx = ruleIdx + 1;

    if (nextRIdx >= currentGoal.rules.length) {
      // SUKSES
      setResult({ 
        success: true, 
        diagnosis: currentGoal.diagnosis, 
        solution: currentGoal.solution 
      });
    } else {
      processNextStep(goalIdx, nextRIdx, currentFacts);
    }
  };

  const nextGoal = (goalIdx, currentFacts) => {
    processNextStep(goalIdx + 1, 0, currentFacts);
  };

  const handleAnswer = (answer) => {
    const currentGoal = knowledgeBase.goals[currentGoalIndex];
    const currentRuleKey = currentGoal.rules[currentRuleIndex];
    
    const newFacts = { ...facts, [currentRuleKey]: answer };
    setFacts(newFacts);

    if (answer) {
      nextRule(currentGoalIndex, currentRuleIndex, newFacts);
    } else {
      nextGoal(currentGoalIndex, newFacts);
    }
  };

  // UI RENDER
  if (loading) return <div className="flex h-screen items-center justify-center">Loading Database...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-green-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-green-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Dokter Cabai 🌶️</h1>
          <p className="text-green-100 text-sm">Sistem Pakar Diagnosa Penyakit</p>
        </div>

        <div className="p-6">
          {!started ? (
            <div className="text-center">
              <p className="mb-6 text-gray-600">Jawab pertanyaan Ya/Tidak untuk mengetahui penyakit tanaman cabai Anda.</p>
              <button 
                onClick={() => { setStarted(true); processNextStep(0, 0, {}); }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                Mulai Diagnosa
              </button>
            </div>
          ) : result ? (
            <div className={`text-center p-4 rounded-lg ${result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                {result.success ? "Diagnosa Ditemukan!" : "Maaf"}
              </h2>
              <p className="text-lg font-semibold text-green-800 mb-2">
                {result.diagnosis || result.message}
              </p>
              {result.success && (
                <div className="text-sm text-gray-700 bg-white p-3 rounded mt-4 text-left">
                  <strong>Solusi:</strong><br/>
                  {result.solution}
                </div>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 text-green-600 font-semibold underline"
              >
                Diagnosa Ulang
              </button>
            </div>
          ) : (
            <div>
               <div className="mb-8 min-h-[100px] flex items-center justify-center">
                <h3 className="text-xl font-medium text-center text-gray-800">
                  {knowledgeBase.goals[currentGoalIndex] && 
                   knowledgeBase.questions[knowledgeBase.goals[currentGoalIndex].rules[currentRuleIndex]]}
                </h3>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAnswer(true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold">
                  YA
                </button>
                <button onClick={() => handleAnswer(false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold">
                  TIDAK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}