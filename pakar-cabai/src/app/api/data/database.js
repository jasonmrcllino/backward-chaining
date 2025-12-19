import { sql } from '@vercel/postgres';

export async function getKnowledgeBase() {
  try {
    // 1. Ambil daftar gejala untuk Form Checkbox
    const gejalaQuery = await sql`SELECT * FROM gejala ORDER BY code ASC`;
    
    // 2. Ambil semua aturan dan penyakitnya untuk Logika Diagnosa
    // Kita lakukan JOIN tabel biar lengkap datanya
    const rulesQuery = await sql`
      SELECT 
        p.code as penyakit_code,
        p.name as penyakit_name,
        p.solution,
        p.severity,
        a.gejala_code
      FROM aturan a
      JOIN penyakit p ON a.penyakit_code = p.code
    `;

    // Return kedua data tersebut
    return {
      gejala: gejalaQuery.rows,
      rules: rulesQuery.rows
    };

  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
}