document.addEventListener('DOMContentLoaded', function() {
    console.log('Results page loaded');
    
    // ===================================================================
    // CONFIGURATION SECTION - EASILY CUSTOMIZE YOUR SUBJECTS AND COLUMNS
    // ===================================================================
    
    // Database column names for student identification
    // Add more column names here if your database uses different names
    const STUDENT_ID_COLUMNS = ['Student ID', 'student_id', 'id', 'ID', 'studentId'];
    
    // Column name for total marks (optional)
    const TOTAL_COLUMN = 'Total';
    
    // ===== SUBJECTS CONFIGURATION =====
    // This is the MAIN SECTION to customize based on your database
    // 
    // HOW TO ADD/REMOVE SUBJECTS:
    // 1. Add/remove objects from this array
    // 2. For each subject, specify:
    //    - code: Short code (e.g., 'ASG1')
    //    - name: Full subject name
    //    - marksColumn: EXACT database column name for marks
    //    - maxMarks: Maximum possible marks for this subject
    //
    // EXAMPLE: To add a new subject called "Final Exam":
    // {
    //     code: 'FINAL',
    //     name: 'Final Examination',
    //     marksColumn: 'Final_Exam_Marks', // ← Your database column name
    //     maxMarks: 100
    // }
    
    const SUBJECTS_CONFIG = [
        {
            code: 'ASG1',
            name: 'Assignment 1',
            marksColumn: 'Assign 1 Grade(3 marks)',
            maxMarks: 3
        },
        {
            code: 'ASG2',
            name: 'Assignment 2',
            marksColumn: 'Assign 2 Grade(3 marks)',
            maxMarks: 3
        },
        {
            code: 'ASG3',
            name: 'Assignment 3',
            marksColumn: 'Assign 3 Grade(3 marks)',
            maxMarks: 3
        },
        {
            code: 'ASG4',
            name: 'Assignment 4',
            marksColumn: 'Assign 4 Grade(3 marks)',
            maxMarks: 3
        },
        {
            code: 'ASG5',
            name: 'Assignment 5',
            marksColumn: 'Assign 5 Grade(3 marks)',
            maxMarks: 3
        },
        {
            code: 'ASGT',
            name: 'Assignments Total',
            marksColumn: 'TotalAssignments (Scaled - 10 marks)',
            maxMarks: 10
        },
        {
            code: 'MID',
            name: 'Midterm Exam',
            marksColumn: 'Midterm(Scaled - 15 marks)',
            maxMarks: 15
        },
        {
            code: 'QUIZ',
            name: 'Quiz Total',
            marksColumn: 'Quiz (Scaled - 15 marks)',
            maxMarks: 15
        },
        {
            code: 'BONUS',
            name: 'Bonus Points',
            marksColumn: 'bonus',
            maxMarks: 5
        }
        // Add more subjects here as needed...
    ];
    
    // ===== OPTIONAL: CUSTOMIZE TABLE COLUMNS =====
    // You can modify which columns appear in the table
    // Current columns: Subject Code, Subject Name, Marks Obtained, Total Marks, Percentage, Grade, Status
    // To remove a column, simply remove its header from result.html
    // ===================================================================
    
    // Check if supabaseConfig exists
    if (!window.supabaseConfig) {
        console.error('supabaseConfig is not defined!');
        showPageError('System configuration error. Please refresh the page.');
        return;
    }
    
    const { supabase, calculateGrade, getGradeBadgeClass, getInitials, safeParseNumber } = window.supabaseConfig;
    
    if (!supabase) {
        console.error('Supabase client not available');
        showPageError('Database connection failed.');
        return;
    }

    // ===================================================================
    // UTILITY FUNCTIONS - You don't need to modify these usually
    // ===================================================================
    
    // Show error message on page
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

    // Safely get a column value from data (tries multiple possible column names)
    function getColumnValue(data, possibleColumns) {
        for (const column of possibleColumns) {
            if (data[column] !== undefined && data[column] !== null) {
                return data[column];
            }
        }
        return null;
    }
    
    // Calculate percentage safely
    function calculatePercentage(marks, maxMarks) {
        if (maxMarks <= 0) return 0;
        return (marks / maxMarks) * 100;
    }
    
    // Get pass/fail status
    function getStatus(percentage) {
        return percentage >= 50 ? 'Passed' : 'Failed';
    }

    // ===================================================================
    // MAIN DATA LOADING FUNCTION
    // ===================================================================
    
    async function loadStudentData() {
        try {
            console.log('Loading student data...');
            
            // Get student data from session storage
            const storedData = sessionStorage.getItem('studentData');
            
            if (!storedData) {
                console.error('No student data in session storage');
                showPageError('No student data found. Please search again.');
                return;
            }
            
            let studentData;
            try {
                studentData = JSON.parse(storedData);
                console.log('✓ Student data parsed:', studentData);
            } catch (parseError) {
                console.error('Failed to parse student data:', parseError);
                showPageError('Invalid student data. Please search again.');
                return;
            }
            
            // Debug: Log all available columns (helpful for customization)
            console.log('Available columns in database:', Object.keys(studentData));
            
            // Populate the page with data
            populateStudentData(studentData);
            
        } catch (error) {
            console.error('Error loading student data:', error);
            showPageError('Failed to load student data. Please try again.');
        }
    }
    
    // ===================================================================
    // POPULATE PAGE WITH STUDENT DATA
    // ===================================================================
    
    function populateStudentData(data) {
        console.log('Populating page with data...');
        
        // Get student ID
        const studentId = getColumnValue(data, STUDENT_ID_COLUMNS) || 'Unknown';
        const initials = getInitials(studentId);
        
        console.log('Student ID:', studentId);
        console.log('All data:', data);
        
        // Get total marks (optional - used for rank badge if needed)
        const totalValue = getColumnValue(data, [TOTAL_COLUMN, 'total', 'TOTAL', 'final_total', 'Final Total']);
        const total = safeParseNumber(totalValue);
        
        console.log('Total value:', totalValue, 'Parsed as:', total);
        
        // 1. Update Student Profile Section
        const avatarElement = document.querySelector('.student-avatar');
        const nameElement = document.querySelector('.student-name');
        const metaElement = document.querySelector('.meta-item span');
        
        if (avatarElement) avatarElement.textContent = initials;
        if (nameElement) nameElement.textContent = `Student ${studentId}`;
        if (metaElement) metaElement.textContent = `ID: ${studentId}`;
        
        // 2. Update Rank Badge (showing Total Score)
        const rankBadge = document.querySelector('.rank-badge span');
        if (rankBadge) {
            rankBadge.textContent = `Rank: ${total.toFixed(1)}`;
        }
        
        // 3. Populate Grades Table
        const tbody = document.querySelector('.grades-table tbody');
        if (tbody) {
            // Clear loading message
            tbody.innerHTML = '';
            
            // Process each subject from configuration
            SUBJECTS_CONFIG.forEach(subject => {
                // Get marks from the specified database column
                const marks = safeParseNumber(data[subject.marksColumn] || 0);
                const maxMarks = subject.maxMarks;
                const percentage = calculatePercentage(marks, maxMarks);
                const grade = calculateGrade(percentage);
                const gradeClass = getGradeBadgeClass(grade);
                const status = getStatus(percentage);
                
                // Create table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${subject.code}</td>
                    <td>${subject.name}</td>
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
        }
        
        console.log('✓ Page populated successfully');
    }
    
    // ===================================================================
    // INITIALIZATION - Start loading data when page is ready
    // ===================================================================
    
    loadStudentData();
});