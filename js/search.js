document.addEventListener('DOMContentLoaded', function () {
    console.log('Search page loaded');

    // Check if supabaseConfig exists
    if (!window.supabaseConfig) {
        console.error('supabaseConfig is not defined!');
        showError('System configuration error. Please refresh the page.');
        return;
    }

    const { supabase } = window.supabaseConfig;

    if (!supabase) {
        console.error('Supabase client not available');
        showError('Database connection failed. Please check configuration.');
        return;
    }

    const searchForm = document.getElementById('searchForm');
    const studentIdInput = document.getElementById('studentId');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // Show error function
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        console.error('Error:', message);
    }

    // Clear error function
    function clearError() {
        errorAlert.classList.add('d-none');
    }

    // Test connection on load
    async function testConnection() {
        try {
            console.log('Testing database connection...');
            const { data, error } = await supabase
                .from('students')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('Database connection failed:', error);
                showError('Cannot connect to database. Please check RLS policies.');
                return false;
            }

            console.log('✓ Database connection successful');
            return true;
        } catch (error) {
            console.error('Connection test error:', error);
            return false;
        }
    }

    // Handle search form submission
    async function handleSearch(event) {
        event.preventDefault();

        const studentId = studentIdInput.value.trim();
        console.log('Searching for student ID:', studentId);

        if (!studentId) {
            showError("Please enter a Student ID");
            return;
        }

        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            submitBtn.disabled = true;

            // Debug: Test if we can query the table
            console.log('Testing query...');
            const testResult = await supabase
                .from('students')
                .select('*')
                .limit(1);

            console.log('Test query result:', testResult);

            // Search for student - try different column name formats
            let queryResult;

            // Try with exact column name first
            queryResult = await supabase
                .from('students')
                .select('*')
                .eq('Student ID', studentId)
                .single();

            console.log('Query result with "Student ID":', queryResult);

            // If not found, try lowercase
            if (queryResult.error || !queryResult.data) {
                console.log('Trying with lowercase...');
                queryResult = await supabase
                    .from('students')
                    .select('*')
                    .eq('student_id', studentId)
                    .single();
                console.log('Query result with "student_id":', queryResult);
            }

            const { data, error } = queryResult;

            if (error) {
                console.error('Database query error:', error);

                // Check if it's a policy error
                if (error.message.includes('policy') || error.message.includes('permission')) {
                    showError("Access denied. Please check RLS policies.");
                } else if (error.message.includes('found')) {
                    showError("Student ID not found. Please check and try again.");
                } else {
                    showError("Database error: " + error.message);
                }

                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            if (!data) {
                console.error('Student not found');
                showError("Student ID not found. Please check and try again.");

                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            console.log('✓ Student found:', data);

            // Store student data in session storage and redirect
            sessionStorage.setItem('studentData', JSON.stringify(data));
            window.location.href = 'result.html';

        } catch (error) {
            console.error('Search error:', error);
            showError("An error occurred. Please try again.");

            // Reset button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-search btn-icon"></i> Search Academic Records';
            submitBtn.disabled = false;
        }
    }

    // Initialize event listeners
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
        console.log('✓ Search form event listener added');
    }

    if (studentIdInput) {
        studentIdInput.addEventListener('input', clearError);
    }

    // Test connection on load
    testConnection();
});