// scripts/generate-qrcodes.js
// Usage: node scripts/generate-qrcodes.js
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateQR() {
    console.log('Fetching students...');
    const { data: students, error } = await supabase
        .from('students')
        .select('id, name, nisn');

    if (error) {
        console.error('Error fetching students:', error.message);
        return;
    }

    console.log(`Generating QR codes for ${students.length} students...`);

    for (const student of students) {
        try {
            // Encode the Supabase UUID (id) into the QR code
            const qrDataUrl = await QRCode.toDataURL(student.id, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });

            // You can save this to a file or upload to Supabase Storage
            // For now, let's just log success. 
            // In a real scenario, you might want to save to 'd:/rekap_bp/public/qrcodes/${student.id}.png'
            console.log(`[SUCCESS] QR generated for: ${student.name} (${student.nisn || 'no-nisn'})`);
        } catch (err) {
            console.error(`[ERROR] Failed to generate QR for ${student.name}:`, err.message);
        }
    }

    console.log('Done!');
}

generateQR();
