'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // === STATE DATA (Dari Database) ===
  const [symptomsList, setSymptomsList] = useState([]); // Daftar Gejala
  const [rulesBase, setRulesBase] = useState([]);       // Daftar Aturan
  
  // === STATE USER INTERACTION ===
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); 
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  
  // === STATE UI ===
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetch Data saat web dibuka (Gejala & Rules)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        
        // Simpan ke state (pastikan backend mengirim object {gejala: [], rules: []})
        setSymptomsList(data.gejala || []);
        setRulesBase(data.rules || []);
        
      } catch (error) {
        console.error("Gagal ambil data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. Handle Checkbox (Centang Gejala)
  const handleToggleSymptom = (code) => {
    if (selectedSymptoms.includes(code)) {
      setSelectedSymptoms(selectedSymptoms.filter(id => id !== code));
    } else {
      setSelectedSymptoms([...selectedSymptoms, code]);
    }
  };

  // 3. LOGIKA DIAGNOSA (Forward Chaining dengan Data Database)
  const calculateDiagnosis = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      // a. Siapkan papan skor untuk setiap penyakit
      const scores = {}; 

      rulesBase.forEach(rule => {
        const pCode = rule.penyakit_code;
        
        // Inisialisasi jika penyakit belum ada di skor
        if (!scores[pCode]) {
          scores[pCode] = {
            ...rule, // Ambil info nama, solusi, severity
            matched: 0,
            total_symptoms: 0
          };
        }
        
        // Tambah total gejala wajib untuk penyakit ini
        scores[pCode].total_symptoms += 1; 
        
        // Jika user memilih gejala yang sesuai rule, tambah skor matched
        if (selectedSymptoms.includes(rule.gejala_code)) {
          scores[pCode].matched += 1; 
        }
      });

      // b. Cari penyakit dengan persentase kecocokan tertinggi
      let bestMatch = null;
      let highestScore = 0;

      Object.values(scores).forEach(disease => {
        // Rumus: (Gejala Cocok / Total Gejala Penyakit Itu) * 100
        const confidence = (disease.matched / disease.total_symptoms) * 100;
        
        // Kita anggap valid jika kecocokan di atas 0% (bisa dinaikkan jadi 50% jika mau lebih ketat)
        if (confidence > highestScore && confidence > 0) {
          highestScore = confidence;
          bestMatch = {
            name: disease.penyakit_name,
            solution: disease.solution,
            severity: disease.severity,
            confidence: Math.round(confidence)
          };
        }
      });

      // c. Tentukan Hasil Akhir
      if (bestMatch) {
        setDiagnosisResult(bestMatch);
      } else {
        setDiagnosisResult({
          name: "Penyakit Tidak Teridentifikasi",
          solution: "Gejala yang Anda masukkan tidak cocok dengan pola penyakit manapun di database kami. Kemungkinan ini adalah gangguan fisiologis atau penyakit baru.",
          severity: "low",
          confidence: 0
        });
      }

      setIsProcessing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500); // Delay buatan biar terasa "mikir"
  };

  const resetDiagnosis = () => {
    setDiagnosisResult(null);
    setSelectedSymptoms([]);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-20 selection:bg-red-500 selection:text-white">
      
      {/* Background Decor (Nuansa Merah Cabai & Hijau) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        
        {/* Header */}
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            Sistem Pakar <span className="text-red-500">Cabai</span> 🌶️
          </h1>
          <p className="text-slate-400 text-lg">
            Diagnosa penyakit tanaman cabai Anda berdasarkan gejala fisik.
          </p>
        </header>

        {/* === HASIL DIAGNOSA (Muncul jika sudah ada hasil) === */}
        {diagnosisResult && (
          <div className="mb-10 animate-fade-in-up">
            <div className={`
              p-1 rounded-2xl bg-gradient-to-r shadow-2xl
              ${diagnosisResult.severity === 'high' ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'}
            `}>
              <div className="bg-[#1e293b] p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-white">Hasil Diagnosa</h2>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono text-white">
                    Akurasi {diagnosisResult.confidence}%
                  </span>
                </div>
                
                <h3 className={`text-3xl font-bold mb-4 ${diagnosisResult.severity === 'high' ? 'text-red-400' : 'text-green-400'}`}>
                  {diagnosisResult.name}
                </h3>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Solusi & Penanganan</h4>
                  <p className="text-slate-200 leading-relaxed">
                    {diagnosisResult.solution}
                  </p>
                </div>

                <button 
                  onClick={resetDiagnosis}
                  className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
                >
                  Diagnosa Ulang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === FORM GEJALA === */}
        {!diagnosisResult && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Pilih Gejala Terlihat
              </h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                {selectedSymptoms.length} Dipilih
              </span>
            </div>

            {isLoading ? (
              // Skeleton Loading
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {symptomsList.length > 0 ? (
                    symptomsList.map((gejala) => (
                      <label 
                        key={gejala.code}
                        className={`
                          flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                          ${selectedSymptoms.includes(gejala.code) 
                            ? 'bg-red-500/10 border-red-500/50 translate-x-1' 
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'}
                        `}
                      >
                        <div className={`
                          w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors
                          ${selectedSymptoms.includes(gejala.code) ? 'bg-red-500 border-red-500' : 'border-slate-500'}
                        `}>
                          {selectedSymptoms.includes(gejala.code) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={selectedSymptoms.includes(gejala.code)}
                          onChange={() => handleToggleSymptom(gejala.code)}
                        />
                        <span className={`flex-1 ${selectedSymptoms.includes(gejala.code) ? 'text-white font-medium' : 'text-slate-300'}`}>
                          {gejala.name}
                        </span>
                      </label>
                    ))
                ) : (
                   <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-xl">
                     <p>⚠️ Data gejala kosong.</p>
                     <p className="text-xs mt-2">Pastikan sudah menjalankan Query SQL di Vercel.</p>
                   </div>
                )}
              </div>
            )}
            
            {/* Action Button */}
            <div className="mt-8 pt-4 border-t border-slate-700 sticky bottom-0 bg-[#0f172a]/0 backdrop-blur-sm p-2 -mx-2 -mb-2 rounded-b-xl">
                <button
                  onClick={calculateDiagnosis}
                  disabled={selectedSymptoms.length === 0 || isProcessing}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all
                    ${selectedSymptoms.length === 0 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-red-500/30 text-white transform hover:-translate-y-1 active:scale-95'}
                  `}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Menganalisis...
                    </span>
                  ) : `Diagnosa Sekarang (${selectedSymptoms.length})`}
                </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}