export function createExam() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Exam</h3>
            </div>
            <div class="card-body">
                <form id="exam-form">
                    <div class="mb-3">
                        <label for="exam-name" class="form-label">Exam Name</label>
                        <input type="text" id="exam-name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="subject" class="form-label">Select Subject</label>
                        <select id="subject" class="form-select" required>
                            <option disabled selected>Loading subjects...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="class-list" class="form-label">Select Classes</label>
                        <select id="class-list" class="form-select" multiple required>
                            <option disabled selected>Loading classes...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="exam-date" class="form-label">Exam Date</label>
                        <input type="date" id="exam-date" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select" required>
                            <option disabled selected>Loading academic years...</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Exam</button>
                </form>
            </div>
        </div>
    `;

    // Fetch subjects, classes, and academic years
    fetch("/get-subjects/")
        .then(response => response.json())
        .then(subjects => {
            const subjectDropdown = document.getElementById("subject");
            subjectDropdown.innerHTML = subjects.map(subject => `
                <option value="${subject.id}">${subject.name}</option>
            `).join("");
        });

    fetch("/get-classes/")
        .then(response => response.json())
        .then(classes => {
            const classDropdown = document.getElementById("class-list");
            classDropdown.innerHTML = classes.map(cls => `
                <option value="${cls.id}">${cls.name}</option>
            `).join("");
        });

    fetch("/get-academic-years/")
        .then(response => response.json())
        .then(years => {
            const yearDropdown = document.getElementById("academic-year");
            yearDropdown.innerHTML = years.map(year => `
                <option value="${year.id}">${year.year}</option>
            `).join("");
        });

    // Handle form submission
    document.getElementById("exam-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("exam-name").value;
        const subjectId = document.getElementById("subject").value;
        const classIds = Array.from(document.getElementById("class-list").selectedOptions).map(option => option.value);
        const examDate = document.getElementById("exam-date").value;
        const academicYearId = document.getElementById("academic-year").value;

        fetch("/create-exam/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                subject_id: subjectId,
                class_ids: classIds,
                exam_date: examDate,
                academic_year_id: academicYearId
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Exam created successfully!");
        })
        .catch(error => {
            console.error("Error creating exam:", error);
            alert("Failed to create exam: " + error.message);
        });
    });
}

export function updateExamGrades() {
    fetch("/get-exam-filters/")
        .then(response => response.json())
        .then(filters => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Search Exams</h3>
                    </div>
                    <div class="card-body">
                        <form id="exam-filter-form">
                            ${generateDropdown("academic-year", "Academic Year", filters.academic_years)}
                            ${generateDropdown("grade", "Grade", filters.grades)}
                            ${generateDropdown("class", "Class", filters.classes)}
                            ${generateDropdown("subject", "Subject", filters.subjects)}
                            <button type="submit" class="btn btn-primary">Search Exams</button>
                        </form>
                        <hr>
                        <h5>Available Exams</h5>
                        <ul id="exam-list" class="list-group">
                            <li class="list-group-item text-center">No exams found</li>
                        </ul>
                    </div>
                </div>
            `;

            document.getElementById("exam-filter-form").addEventListener("submit", function (e) {
                e.preventDefault();
                fetchFilteredExams();
            });
        })
        .catch(error => {
            console.error("Error fetching filters:", error.message);
            document.getElementById("main").innerHTML = `<div class="alert alert-danger text-center">Failed to load filters</div>`;
        });
}

function generateDropdown(id, label, options) {
    return `
        <div class="mb-3">
            <label for="${id}" class="form-label">${label}</label>
            <select id="${id}" class="form-select">
                <option value="">All</option>
                ${options.map(option => `<option value="${option.id}">${option.name || option.year}</option>`).join("")}
            </select>
        </div>
    `;
}

function fetchFilteredExams() {
    const academicYearId = document.getElementById("academic-year").value;
    const gradeId = document.getElementById("grade").value;
    const classId = document.getElementById("class").value;
    const subjectId = document.getElementById("subject").value;

    const queryParams = new URLSearchParams();
    if (academicYearId) queryParams.append("academic_year", academicYearId);
    if (gradeId) queryParams.append("grade", gradeId);
    if (classId) queryParams.append("class_assigned", classId);
    if (subjectId) queryParams.append("subject", subjectId);

    fetch(`/search-exams/?${queryParams.toString()}`)
        .then(response => response.json())
        .then(exams => {
            const examList = document.getElementById("exam-list");
            examList.innerHTML = exams.length > 0 ? exams.map(exam => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${exam.name} - ${exam.subject__name} (${exam.academic_year__year})
                    <button class="btn btn-sm btn-success" onclick="loadExamStudents(${exam.id})">Select</button>
                </li>
            `).join("") : `<li class="list-group-item text-center">No exams found</li>`;
        })
        .catch(error => {
            console.error("Error fetching exams:", error.message);
            document.getElementById("exam-list").innerHTML = `<li class="list-group-item text-danger text-center">Failed to fetch exams</li>`;
        });
}

export function loadExamStudents(examId, classId = null) {
    // If classId is not provided, get it from the dropdown
    if (!classId) {
        const classDropdown = document.getElementById("class");
        if (classDropdown) {
            classId = classDropdown.value;
        }
    }

    // Check if classId is still missing
    if (!classId) {
        alert("Please select a class before fetching students.");
        console.error("Error: Missing classId.");
        return;
    }

    console.log(`Fetching students for Exam ID: ${examId}, Class ID: ${classId}`);

    fetch(`/get-exam-students/${examId}/?class_id=${classId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received Exam Students:", data);

            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Update Grades for ${data.exam_name} - ${data.subject}</h3>
                    </div>
                    <div class="card-body">
                        <h5>Exam Details</h5>
                        <table class="table table-bordered">
                            <tr><th>Exam</th><td>${data.exam_name}</td></tr>
                            <tr><th>Subject</th><td>${data.subject}</td></tr>
                            <tr><th>Grade</th><td>${data.grade}</td></tr>
                            <tr><th>Class</th><td>${data.class_name}</td></tr>
                        </table>

                        <h5 class="mt-4">Students & Grades</h5>
                        <form id="exam-grades-form">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student Name</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody id="exam-students-list">
                                    ${data.students.length > 0 ? data.students.map((student, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${student.username}</td>
                                            <td>
                                                <input type="number" min="0" max="100" step="0.01" 
                                                    class="form-control grade-input"
                                                    data-student-id="${student.id}" 
                                                    value="${student.grade !== null ? student.grade : ''}">
                                            </td>
                                        </tr>
                                    `).join("") : `<tr><td colspan="3" class="text-center text-danger">No students found</td></tr>`}
                                </tbody>
                            </table>
                            <button type="submit" class="btn btn-success">Save Grades</button>
                        </form>
                    </div>
                </div>
            `;

            // Handle form submission
            document.getElementById("exam-grades-form").addEventListener("submit", function (e) {
                e.preventDefault();

                const grades = [];
                document.querySelectorAll(".grade-input").forEach(input => {
                    const studentId = input.dataset.studentId;
                    const gradeValue = input.value.trim();
                    if (gradeValue !== "") {
                        grades.push({ student_id: studentId, grade: parseFloat(gradeValue) });
                    }
                });

                fetch(`/update-exam-grades/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ exam_id: examId, grades: grades }),
                })
                .then(response => response.json())
                .then(result => {
                    alert(result.message || "Grades updated successfully!");
                })
                .catch(error => {
                    console.error("Error updating grades:", error.message);
                });
            });
        })
        .catch(error => {
            console.error("Error fetching exam students:", error.message);
            document.getElementById("main").innerHTML = `
                <div class="alert alert-danger text-center">Failed to load students</div>
            `;
        });
}

export function viewExamGrades() {
    // Fetch filters (academic years, grades, classes, subjects)
    fetch("/get-exam-filters/")
        .then(response => response.json())
        .then(filters => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Search Exams</h3>
                    </div>
                    <div class="card-body">
                        <form id="exam-filter-form">
                            <div class="mb-3">
                                <label for="academic-year" class="form-label">Academic Year</label>
                                <select id="academic-year" class="form-select">
                                    <option value="">All</option>
                                    ${filters.academic_years.map(year => `
                                        <option value="${year.id}">${year.year}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade</label>
                                <select id="grade" class="form-select">
                                    <option value="">All</option>
                                    ${filters.grades.map(grade => `
                                        <option value="${grade.id}">${grade.name}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="class" class="form-label">Class</label>
                                <select id="class" class="form-select">
                                    <option value="">All</option>
                                    ${filters.classes.map(cls => `
                                        <option value="${cls.id}" data-grade="${cls.grade_id}">${cls.name}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="subject" class="form-label">Subject</label>
                                <select id="subject" class="form-select">
                                    <option value="">All</option>
                                    ${filters.subjects.map(subject => `
                                        <option value="${subject.id}" data-grade="${subject.grade_id}">${subject.name}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Search Exams</button>
                        </form>
                        <hr>
                        <h5>Available Exams</h5>
                        <ul id="exam-list" class="list-group">
                            <li class="list-group-item text-center">No exams found</li>
                        </ul>
                    </div>
                </div>
            `;

            // Attach event listener for filtering exams
            document.getElementById("exam-filter-form").addEventListener("submit", function (e) {
                e.preventDefault();

                const academicYearId = document.getElementById("academic-year").value;
                const gradeId = document.getElementById("grade").value;
                const classId = document.getElementById("class").value;
                const subjectId = document.getElementById("subject").value;

                fetch(`/search-exams/?academic_year_id=${academicYearId}&grade_id=${gradeId}&class_id=${classId}&subject_id=${subjectId}`)
                    .then(response => response.json())
                    .then(exams => {
                        const examList = document.getElementById("exam-list");
                        examList.innerHTML = exams.length > 0 ? exams.map(exam => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${exam.name} - ${exam.subject__name} (${exam.academic_year__year})
                                <button class="btn btn-sm btn-info" onclick="loadExamGrades(${exam.id}, ${classId})">View</button>
                            </li>
                        `).join("") : `<li class="list-group-item text-center">No exams found</li>`;
                    })
                    .catch(error => {
                        console.error("Error fetching exams:", error.message);
                        document.getElementById("exam-list").innerHTML = `<li class="list-group-item text-danger text-center">Failed to fetch exams</li>`;
                    });
            });
        })
        .catch(error => {
            console.error("Error fetching filters:", error.message);
            document.getElementById("main").innerHTML = `<div class="alert alert-danger text-center">Failed to load filters</div>`;
        });
}

export function loadExamGrades(examId, classId) {
    fetch(`/get-exam-grades/${examId}/?class_id=${classId}`)
        .then(response => response.json())
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Exam Grades for ${data.exam_name} - ${data.subject}</h3>
                    </div>
                    <div class="card-body">
                        <h5>Exam Details</h5>
                        <table class="table table-bordered">
                            <tr><th>Exam</th><td>${data.exam_name}</td></tr>
                            <tr><th>Subject</th><td>${data.subject}</td></tr>
                            <tr><th>Grade</th><td>${data.grade}</td></tr>
                            <tr><th>Class</th><td>${data.class_name}</td></tr>
                        </table>

                        <h5 class="mt-4">Students & Grades</h5>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student Name</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody id="exam-students-list">
                                ${data.students.map((student, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${student.username}</td>
                                        <td>${student.grade !== null ? student.grade : 'N/A'}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error fetching exam grades:", error.message);
            document.getElementById("main").innerHTML = `
                <div class="alert alert-danger text-center">Failed to load exam grades</div>
            `;
        });
}
    




