function loadAssignedClasses(onClickHandler) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>My Classes</h3>
            </div>
            <div class="card-body">
                <ul id="class-list" class="list-group">
                    <li class="list-group-item text-center">Loading...</li>
                </ul>
            </div>
        </div>
    `;

    fetch("/get-assigned-classes/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch class list");
            }
            return response.json();
        })
        .then(data => {
            const classList = document.getElementById("class-list");
            classList.innerHTML = ""; // Clear loading state

            if (data.classes.length > 0) {
                data.classes.forEach(classItem => {
                    classList.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${classItem.name} - ${classItem.grade}
                            <button class="btn btn-sm btn-primary" onclick="${onClickHandler}(${classItem.id})">Select</button>
                        </li>
                    `;
                });
            } else {
                classList.innerHTML = `<li class="list-group-item text-center">No classes assigned</li>`;
            }
        })
        .catch(error => {
            console.error("Error fetching class list:", error.message);
            const classList = document.getElementById("class-list");
            classList.innerHTML = `<li class="list-group-item text-danger text-center">Failed to load classes</li>`;
        });
}

export function viewMyClassesForAttendance() {
    loadAssignedClasses("viewStudentRoster");
}

export function markAttendance() {
    loadAssignedClasses("markClassAttendance");
}

export function viewStudentRoster(classId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Student Roster</h3>
            </div>
            <div class="card-body">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>Grade</th>
                            <th>Class</th>
                        </tr>
                    </thead>
                    <tbody id="student-roster">
                        <tr>
                            <td colspan="4" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetch(`/get-student-roster/${classId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch student roster");
            }
            return response.json();
        })
        .then(students => {
            const rosterBody = document.getElementById("student-roster");
            rosterBody.innerHTML = ""; // Clear loading state

            if (students.length > 0) {
                students.forEach((student, index) => {
                    rosterBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${student.username}</td>
                            <td>${student.grade || "N/A"}</td>
                            <td>${student.class || "N/A"}</td>
                        </tr>
                    `;
                });
            } else {
                rosterBody.innerHTML = `<tr><td colspan="4" class="text-center">No students found</td></tr>`;
            }
        })
        .catch(error => {
            console.error("Error fetching student roster:", error.message);
            const rosterBody = document.getElementById("student-roster");
            rosterBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Failed to load roster</td></tr>`;
        });
}

export function markClassAttendance(classId) {
    fetch(`/get-class-attendance-details/${classId}/`)
        .then(response => response.json())
        .then(classData => {
            const today = new Date().toISOString().split("T")[0];

            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Mark Attendance</h3>
                    </div>
                    <div class="card-body">
                        <form id="attendance-form">
                            <div class="mb-3">
                                <label for="section" class="form-label">Select Section</label>
                                <select id="section" class="form-select">
                                    <option value="" disabled selected>Select a section</option>
                                    ${classData.sections.map(section => `
                                        <option value="${section}">${section}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="subject" class="form-label">Select Subject</label>
                                <select id="subject" class="form-select">
                                    <option value="" disabled selected>Select a subject</option>
                                    ${classData.subjects.map(subject => `
                                        <option value="${subject.id}">${subject.name}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="date" class="form-label">Date</label>
                                <input type="date" id="date" class="form-control" value="${today}">
                            </div>
                            <div class="mb-3">
                                <h5>Students</h5>
                                <ul id="student-list" class="list-group">
                                    ${classData.students.map(student => `
                                        <li class="list-group-item">
                                            <label>
                                                <input type="checkbox" value="${student.id}" class="present-checkbox"> 
                                                ${student.username}
                                            </label>
                                        </li>
                                    `).join("")}
                                </ul>
                            </div>
                            <button type="submit" class="btn btn-primary">Submit Attendance</button>
                        </form>
                    </div>
                </div>
            `;

            // Handle form submission
            document.getElementById("attendance-form").addEventListener("submit", function (e) {
                e.preventDefault();
            
                const section = document.getElementById("section").value;
                const subjectId = document.getElementById("subject").value;
                const date = document.getElementById("date").value;
            
                if (!section || !subjectId || !date) {
                    alert("Please select all required fields!");
                    return;
                }
            
                // Get total students
                const totalStudents = classData.students.length;
            
                // Get present students
                const presentStudentIds = Array.from(document.querySelectorAll(".present-checkbox:checked"))
                    .map(checkbox => checkbox.value);
            
                // Calculate absent students dynamically
                const allStudentIds = classData.students.map(student => student.id);
                const absentStudentIds = allStudentIds.filter(id => !presentStudentIds.includes(id));

                // Submit attendance
                fetch(`/mark-attendance/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        class_id: classId,
                        section: section,
                        date: date,
                        subject_id: subjectId,
                        academic_year_id: classData.academic_year_id,
                        present_students: presentStudentIds,
                        absent_students: absentStudentIds,
                        total_students: totalStudents
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message || "Attendance marked successfully!");
                })
                .catch(error => {
                    alert("Failed to mark attendance: " + error.message);
                });
            });
        })
        .catch(error => {
            document.getElementById("main").innerHTML = `
                <div class="alert alert-danger text-center">Failed to load attendance form: ${error.message}</div>
            `;
        });
}

export function viewAttendanceHistory() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Attendance History</h3>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label for="filter-class" class="form-label">Filter by Class</label>
                    <select id="filter-class" class="form-select">
                        <option value="">All Classes</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="filter-date" class="form-label">Filter by Date</label>
                    <input type="date" id="filter-date" class="form-control">
                </div>
                <button class="btn btn-primary mb-3" onclick="fetchAttendanceHistory()">Apply Filters</button>
                
                <table class="table table-striped" id="attendance-history-table">
                    <thead>
                        <tr>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Date</th>
                            <th>Total Students</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch classes for filtering
    fetch("/get-assigned-classes/")
        .then(response => response.json())
        .then(data => {
            const classDropdown = document.getElementById("filter-class");
            data.classes.forEach(classItem => {
                classDropdown.innerHTML += `<option value="${classItem.id}">${classItem.name} - ${classItem.grade}</option>`;
            });
        })
        .catch(error => console.error("Error fetching class list:", error));

    fetchAttendanceHistory(); // Initial fetch without filters
}

export function fetchAttendanceHistory() {
    const classId = document.getElementById("filter-class").value;
    const date = document.getElementById("filter-date").value;
    
    let url = `/get-attendance-history/?`;
    if (classId) url += `class_id=${classId}&`;
    if (date) url += `date=${date}&`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector("#attendance-history-table tbody");
            tableBody.innerHTML = ""; // Clear existing data

            if (data.attendance.length > 0) {
                data.attendance.forEach(record => {
                    tableBody.innerHTML += `
                        <tr>
                            <td>${record.class_name}</td>
                            <td>${record.section}</td>
                            <td>${record.date}</td>
                            <td>${record.total_students}</td>
                            <td>${record.present_count}</td>
                            <td>${record.absent_count}</td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="viewAttendanceDetails(${record.id})">View</button>
                            </td>
                        </tr>
                    `;
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No records found</td></tr>`;
            }
        })
        .catch(error => console.error("Error fetching attendance history:", error));
}

export function viewAttendanceDetails(attendanceId) {
    fetch(`/get-attendance-details/${attendanceId}/`)
        .then(response => response.json())
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-info text-white">
                        <h3>Attendance Details</h3>
                    </div>
                    <div class="card-body">
                        <p><strong>Class:</strong> ${data.class_name}</p>
                        <p><strong>Section:</strong> ${data.section}</p>
                        <p><strong>Date:</strong> ${data.date}</p>
                        <p><strong>Total Students:</strong> ${data.total_students}</p>
                        <p><strong>Present:</strong> ${data.present_count}</p>
                        <p><strong>Absent:</strong> ${data.absent_count}</p>

                        <h5>Present Students</h5>
                        <ul class="list-group">
                            ${data.present_students.map(student => `
                                <li class="list-group-item">${student.username}</li>
                            `).join("")}
                        </ul>

                        <h5 class="mt-3">Absent Students</h5>
                        <ul class="list-group">
                            ${data.absent_students.map(student => `
                                <li class="list-group-item">${student.username}</li>
                            `).join("")}
                        </ul>

                        <button class="btn btn-secondary mt-3" onclick="viewAttendanceHistory()">Back</button>
                    </div>
                </div>
            `;
        })
        .catch(error => console.error("Error fetching attendance details:", error));
}




