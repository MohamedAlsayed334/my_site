// Supabase Configuration
const SUPABASE_URL = 'https://wyudfqrfxlbfapyycqjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zRoN_lj9tJJOQm1KSh-44Q_uZldZEJp';

console.log('Setting up Supabase configuration...');

// Initialize Supabase client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✓ Supabase client created successfully');
} catch (error) {
    console.error('✗ Failed to create Supabase client:', error);
}

// Grade calculation function
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
}

// Get grade badge class
function getGradeBadgeClass(grade) {
    if (grade.includes('A+')) return 'grade-a';
    if (grade.includes('A')) return 'grade-a';
    if (grade.includes('B')) return 'grade-b';
    if (grade.includes('C')) return 'grade-c';
    return 'grade-d';
}

// Get initials from ID
function getInitials(id) {
    if (!id || typeof id !== 'string') return '??';
    return id.substring(0, 2).toUpperCase();
}

// Safe number parsing
function safeParseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

// Export functions
window.supabaseConfig = {
    supabase: supabaseClient,
    calculateGrade,
    getGradeBadgeClass,
    getInitials,
    safeParseNumber
};

console.log('✓ Supabase configuration ready');