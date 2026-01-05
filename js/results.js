document.addEventListener('DOMContentLoaded', async function() {
    console.log('Results page loaded');
    
    // ============================================
    // CONFIGURATION SECTION - EDIT HERE ONLY
    // ============================================
    
    // 1. Which column in database has student ID?
    const STUDENT_ID_COLUMNS = ['Student ID', 'student_id', 'id', 'ID', 'studentId'];
    
    // 2. Define what columns to show in table
    // Add/remove objects here to control table display
    const TABLE_COLUMNS = [
        // Format: {columnName: 'Database Column', displayName: 'Shown in Table', maxMarks: optional}
        {
            columnName: 'Assign 1 Grade(3 marks)',
            displayName: 'Assignment 1',
            maxMarks: 3  // Optional - will auto-detect if not set
        },
        {
            columnName: 'Assign 2 Grade(3 marks)',
            displayName: 'Assignment 2'
        },
        {
            columnName: 'Assign 3 Grade(3 marks)',
            displayName: 'Assignment 3'
        },
        {
            columnName: 'Assign 4 Grade(3 marks)',
            displayName: 'Assignment 4'
        },
        {
            columnName: 'Assign 5 Grade(3 marks)',
            displayName: 'Assignment 5'
        },
        {
            columnName: 'TotalAssignments (Scaled - 10 marks)',
            displayName: 'Assignments Total'
        },
        {
            columnName: 'Midterm(Scaled - 15 marks)',
            displayName: 'Midterm Exam'
        },
        {
            columnName: 'Quiz (Scaled - 15 marks)',
            displayName: 'Quiz Total'
        },
        {
            columnName: 'bonus',
            displayName: 'Bonus Points',
            maxMarks: 5
        },
        {
            columnName: 'Total',
            displayName: 'Total Marks',
            maxMarks: 40
        }
        // Add more columns as needed...
    ];
    
    // ============================================
    // DON'T EDIT BELOW (unless you know what you're doing)
    // ============================================
    
    // Get Supabase functions from your config file
    if (!window.supabaseConfig) {
        showPageError('System configuration error.');
        return;
    }
    
    const { supabase, calculateGrade, getGradeBadgeClass, getInitials, safeParseNumber } = window.supabaseConfig;
    
    if (!supabase) {
        showPageError('Database connection failed.');
        return;
    }
    
    // ============================================
    // UTILITY FUNCTIONS - EXPLAINED
    // ============================================
    
    /**
     * FUNCTION 1: showPageError(message)
     * Purpose: Display error message on page when something goes wrong
     * How it works: Replaces main content with error card
     */
    function showPageError(message) {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="card">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${message}
                    </div>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Back to Search
                    </a>
                </div>
            `;
        }
    }
    
    /**
     * FUNCTION 2: getColumnValue(data, possibleColumns)
     * Purpose: Safely get a value from database row
     * How it works: Tries multiple column names (like 'Student ID', 'student_id')
     * Example: getColumnValue(studentData, ['Student ID', 'id']) → returns the ID
     */
    function getColumnValue(data, possibleColumns) {
        for (const column of possibleColumns) {
            if (data[column] !== undefined && data[column] !== null) {
                return data[column];
            }
        }
        return null;
    }
    
    /**
     * FUNCTION 3: extractMaxMarks(columnName, configMaxMarks)
     * Purpose: Figure out maximum possible marks for a column
     * How it works: 
     *   1. First uses maxMarks from config if provided
     *   2. Otherwise extracts from column name like "(3 marks)"
     *   3. Uses defaults if nothing found
     */
    function extractMaxMarks(columnName, configMaxMarks) {
        // Use config value if provided
        if (configMaxMarks !== undefined && configMaxMarks !== null) {
            return configMaxMarks;
        }
        
        // Try to extract from column name
        const patterns = [
            /\((\d+)\s*marks?\)/i,      // Matches "(3 marks)"
            /\(Scaled\s*-\s*(\d+)\s*marks?\)/i, // Matches "(Scaled - 15 marks)"
            /(\d+)\s*marks?/i           // Matches "3 marks"
        ];
        
        for (const pattern of patterns) {
            const match = columnName.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1]);
            }
        }
        
        // Default values for known patterns
        if (columnName.includes('Assign')) return 3;
        if (columnName.includes('Quiz')) return 15;
        if (columnName.includes('Midterm')) return 15;
        if (columnName.includes('bonus')) return 5;
        
        return 0; // Unknown
    }
    
    /**
     * FUNCTION 4: calculatePercentage(marks, maxMarks)
     * Purpose: Calculate percentage from marks and maximum
     * Formula: (marks ÷ maxMarks) × 100
     * Example: calculatePercentage(2.5, 3) → 83.33
     */
    function calculatePercentage(marks, maxMarks) {
        if (maxMarks <= 0) return 0;
        return (marks / maxMarks) * 100;
    }
    
    /**
     * FUNCTION 5: getStatus(percentage)
     * Purpose: Determine pass/fail status
     * Rule: 50% or above = Passed, below 50% = Failed
     */
    function getStatus(percentage) {
        return percentage >= 50 ? 'Passed' : 'Failed';
    }
    
    // ============================================
    // MAIN DATA LOADING FUNCTION
    // ============================================
    
    /**
     * FUNCTION 7: loadStudentData()
     * Purpose: Main function that loads and processes student data
     * Flow: Get data → Parse → Call populateStudentData()
     */
    async function loadStudentData() {
        try {
            // Get data from session storage (set by search.js)
            const storedData = sessionStorage.getItem('studentData');
            
            if (!storedData) {
                showPageError('No student data found. Please search again.');
                return;
            }
            
            // Parse JSON data
            const studentData = JSON.parse(storedData);
            console.log('Student data loaded:', Object.keys(studentData));
            
            // Populate the page
            populateStudentData(studentData);
            
        } catch (error) {
            console.error('Error:', error);
            showPageError('Failed to load student data.');
        }
    }
    
    // ============================================
    // POPULATE PAGE FUNCTION
    // ============================================
    
    /**
     * FUNCTION 8: populateStudentData(data)
     * Purpose: Fill the HTML page with student data
     * What it does:
     *   1. Updates student profile section
     *   2. Updates rank badge
     *   3. Creates table rows for each configured column
     */
    function populateStudentData(data) {
        // Get student ID
        const studentId = getColumnValue(data, STUDENT_ID_COLUMNS) || 'Unknown';
        const initials = getInitials(studentId);
        
        // 1. Update Student Profile
        const avatarElement = document.querySelector('.student-avatar');
        const nameElement = document.querySelector('.student-name');
        const metaElement = document.querySelector('.meta-item span');
        
        if (avatarElement) avatarElement.textContent = initials;
        if (nameElement) nameElement.textContent = `Student ${studentId}`;
        if (metaElement) metaElement.textContent = `ID: ${studentId}`;
        
    // 2. Update Rank Badge (shows rank from database)
        const rankBadge = document.querySelector('.rank-badge span');
        if (rankBadge) {
            // Try different column names for rank
        const rankValue = data['Rank'] || data['rank'] || data['Class Rank'] || data['Position'] || 'Error';
        rankBadge.textContent = `Rank: ${rankValue}`;
        }
        // 3. Populate Grades Table
        const tbody = document.querySelector('.grades-table tbody');
        if (tbody) {
            tbody.innerHTML = ''; // Clear loading message
            
            let foundColumns = false;
            
            // Loop through each column in TABLE_COLUMNS config
            TABLE_COLUMNS.forEach(config => {
                // Check if column exists in database
                if (data[config.columnName] === undefined) {
                    console.warn(`Column "${config.columnName}" not found`);
                    return; // Skip this column
                }
                
                foundColumns = true;
                
                // Get data and calculate values
                const marks = safeParseNumber(data[config.columnName] || 0);
                const maxMarks = extractMaxMarks(config.columnName, config.maxMarks);
                const percentage = calculatePercentage(marks, maxMarks);
                const grade = calculateGrade(percentage);
                const gradeClass = getGradeBadgeClass(grade);
                const status = getStatus(percentage);
                
                // Create table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${config.displayName}</td>
                    <td>${marks.toFixed(1)}</td>
                    <td>${maxMarks}</td>
                    <td>${percentage.toFixed(1)}%</td>
                    <td><span class="grade-badge ${gradeClass}">${grade}</span></td>
                    <td><span class="${percentage >= 50 ? 'text-success' : 'text-danger'}">
                        <i class="fas ${percentage >= 50 ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                        ${status}
                    </span></td>
                `;
                tbody.appendChild(row);
            });
            
            // If no columns found, show message
            if (!foundColumns) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center p-4">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                            No data found for configured columns.
                        </td>
                    </tr>
                `;
            }
        }
        
        console.log('Page populated successfully');
    }
    
    // ============================================
    // START THE PROCESS
    // ============================================
    
    // When page loads, run loadStudentData()
    loadStudentData();
});