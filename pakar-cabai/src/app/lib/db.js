// src/lib/db.js
import { sql } from '@vercel/postgres';

export async function getKnowledgeBase() {
  try {
    // Mencegah error caching di Vercel (optional, good practice)
    // Kita ambil data dari tabel yang sudah Anda buat lewat Query Runner Vercel
    const diseasesData = await sql`SELECT * FROM diseases`;
    const rulesData = await sql`SELECT * FROM rules`;
    const symptomsData = await sql`SELECT * FROM symptoms`;

    // 1. Format Data Penyakit (Goals)
    const formattedGoals = diseasesData.rows.map(disease => {
      // Cari rules yang sesuai dengan ID penyakit ini
      const myRules = rulesData.rows
        .filter(r => r.disease_id === disease.id)
        .map(r => r.symptom_code);

      return {
        id: disease.id,
        diagnosis: disease.name,
        solution: disease.solution,
        rules: myRules
      };
    });

    // 2. Format Data Pertanyaan (Symptoms)
    const formattedQuestions = {};
    symptomsData.rows.forEach(sym => {
      formattedQuestions[sym.code] = sym.question;
    });

    return {
      goals: formattedGoals,
      questions: formattedQuestions
    };
  } catch (error) {
    console.error('Database Error:', error);
    // Jika tabel belum dibuat, error akan muncul di sini
    throw new Error('Gagal mengambil data dari database.');
  }
}