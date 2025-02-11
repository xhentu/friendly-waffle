// user modules

export function viewUsers() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>All Users</h3>
            </div>
            <div class="card-body">
                <button class="btn btn-primary mb-3" onclick="createUserForm()">Create New User</button>
                <table class="table table-striped" id="users-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Gender</th>
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

    fetch("/get-users/")
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message); });
            }
            return response.json();
        })
        .then(userList => {
            const tableBody = document.querySelector("#users-table tbody");
            tableBody.innerHTML = ""; // Clear loading state

            userList.forEach((user, index) => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <a href="/user-profile/${user.id}/" class="text-primary">
                                ${user.username}
                            </a>
                        </td>
                        <td>${user.role}</td>
                        <td>${user.email || "N/A"}</td>
                        <td>${user.phone_number || "N/A"}</td>
                        <td>${user.gender || "N/A"}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching users:", error.message);
            const tableBody = document.querySelector("#users-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">Failed to load users</td>
                </tr>
            `;
        });
}

export function editUser(userId) {
    fetch(`/get-user-details/${userId}/`)
        .then(response => response.json())
        .then(user => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Edit User</h3>
                    </div>
                    <div class="card-body">
                        <form id="edit-user-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" id="username" class="form-control" value="${user.username}" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" class="form-control" value="${user.email || ""}">
                            </div>
                            <div class="mb-3">
                                <label for="role" class="form-label">Role</label>
                                <select id="role" class="form-select">
                                    <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                                    <option value="staff" ${user.role === "staff" ? "selected" : ""}>Staff</option>
                                    <option value="teacher" ${user.role === "teacher" ? "selected" : ""}>Teacher</option>
                                    <option value="student" ${user.role === "student" ? "selected" : ""}>Student</option>
                                    <option value="parent" ${user.role === "parent" ? "selected" : ""}>Parent</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="phone_number" class="form-label">Phone Number</label>
                                <input type="text" id="phone_number" class="form-control" value="${user.phone_number || ""}">
                            </div>
                            <div class="mb-3">
                                <label for="gender" class="form-label">Gender</label>
                                <select id="gender" class="form-select">
                                    <option value="male" ${user.gender === "male" ? "selected" : ""}>Male</option>
                                    <option value="female" ${user.gender === "female" ? "selected" : ""}>Female</option>
                                    <option value="other" ${user.gender === "other" ? "selected" : ""}>Other</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-primary" onclick="submitEditUser(${userId})">Save Changes</button>
                        </form>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error fetching user details:", error);
            alert("Failed to load user details. Please try again.");
        });
}

export function submitEditUser(userId) {
    const data = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        role: document.getElementById("role").value,
        phone_number: document.getElementById("phone_number").value,
        gender: document.getElementById("gender").value,
    };

    fetch(`/edit-user/${userId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("User updated successfully!");
                viewUsers(); // Refresh the user list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error updating user:", error);
            alert("An unexpected error occurred.");
        });
}

export function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) {
        return;
    }

    fetch(`/delete-user/${userId}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("User deleted successfully!");
                viewUsers(); // Refresh the user list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error deleting user:", error);
            alert("An unexpected error occurred.");
        });
}

export function createUserForm() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create New User</h3>
            </div>
            <div class="card-body">
                <form id="create-user-form">
                    <!-- Common Fields -->
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" id="username" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="role" class="form-label">Role</label>
                        <select id="role" class="form-select" onchange="toggleRoleFields()">
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="teacher">Teacher</option>
                            <option value="student">Student</option>
                            <option value="parent">Parent</option>
                        </select>
                    </div>

                    <!-- Role-Specific Fields -->
                    <div id="role-specific-fields"></div>

                    <!-- Additional Fields -->
                    <div class="mb-3">
                        <label for="nrc_no" class="form-label">NRC/ID Number</label>
                        <input type="text" id="nrc_no" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label for="gender" class="form-label">Gender</label>
                        <select id="gender" class="form-select">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="religion" class="form-label">Religion</label>
                        <select id="religion" class="form-select">
                            <option value="islam">Islam</option>
                            <option value="christianity">Christianity</option>
                            <option value="hinduism">Hinduism</option>
                            <option value="buddhism">Buddhism</option>
                            <option value="none">None</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="phone_number" class="form-label">Phone Number</label>
                        <input type="text" id="phone_number" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label for="address" class="form-label">Address</label>
                        <textarea id="address" class="form-control"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="date_of_birth" class="form-label">Date of Birth</label>
                        <input type="date" id="date_of_birth" class="form-control">
                    </div>

                    <button type="button" class="btn btn-primary" onclick="submitUserForm()">Create User</button>
                </form>
            </div>
        </div>
    `;
}

export function toggleRoleFields() {
    const role = document.getElementById("role").value;
    const roleSpecificFields = document.getElementById("role-specific-fields");
    roleSpecificFields.innerHTML = ""; // Clear previous fields

    if (role === "staff" || role === "teacher") {
        roleSpecificFields.innerHTML = `
            <div class="mb-3">
                <label for="salary" class="form-label">Salary</label>
                <input type="number" id="salary" class="form-control">
            </div>
        `;
    } else if (role === "parent") {
        roleSpecificFields.innerHTML = `
            <div class="mb-3">
                <label for="linked_students" class="form-label">Link Students</label>
                <select id="linked_students" class="form-select" multiple>
                    <!-- Populate dynamically with students -->
                </select>
            </div>
        `;

        // Fetch students dynamically
        fetch("/fetch-students/")
            .then(response => response.json())
            .then(students => {
                const studentDropdown = document.getElementById("linked_students");
                students.forEach(student => {
                    const option = document.createElement("option");
                    option.value = student.id;
                    option.textContent = student.username;
                    studentDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error loading students:", error);
                alert("Failed to load students. Please try again.");
            });
    }
}

export function submitUserForm() {
    // Collect data from the form
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const nrc_no = document.getElementById("nrc_no").value;
    const gender = document.getElementById("gender").value;
    const religion = document.getElementById("religion").value;
    const phone_number = document.getElementById("phone_number").value;
    const address = document.getElementById("address").value;
    const date_of_birth = document.getElementById("date_of_birth").value;

    // Role-specific fields
    let roleSpecificData = {};
    if (role === "staff" || role === "teacher") {
        const salary = document.getElementById("salary").value;
        roleSpecificData = { salary };
    } else if (role === "parent") {
        const linkedStudents = Array.from(document.getElementById("linked_students").selectedOptions).map(
            (option) => option.value
        );
        roleSpecificData = { linked_students: linkedStudents };
    }

    // Combine all data
    const userData = {
        username,
        email,
        password,
        role,
        nrc_no,
        gender,
        religion,
        phone_number,
        address,
        date_of_birth,
        roleSpecificData, // Add role-specific data dynamically
    };

    // Log the userData object
    console.log("Data sent to the server:", userData);
    // Send data to the backend
    fetch("/create-user/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(), // Include CSRF token for security
        },
        body: JSON.stringify(userData),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("User created successfully!");
                viewUsers();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("An unexpected error occurred.");
        });
}

export function listAllStudents() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>All Students</h3>
            </div>
            <div class="card-body">
                <table class="table table-striped" id="all-students-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Grade</th>
                            <th>Class</th>
                            <th>Enrollment Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetch("/fetch-all-students/")
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector("#all-students-table tbody");
            tableBody.innerHTML = ""; // Clear loading state
            data.forEach((student, index) => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.username}</td>
                        <td>${student.grade || "N/A"}</td>
                        <td>${student.class || "N/A"}</td>
                        <td>${student.is_enrolled ? "Enrolled" : "Not Enrolled"}</td>
                        <td>
                            ${student.is_enrolled
                                ? `
                                <button class="btn btn-sm btn-warning" onclick="editEnrollment(${student.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEnrollment(${student.id})">Delete</button>
                                `
                                : `<button class="btn btn-sm btn-primary" onclick="enrollStudentPage(${student.id})">Enroll</button>`}
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching students:", error);
            const tableBody = document.querySelector("#all-students-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Failed to load students</td>
                </tr>
            `;
        });
}

export function enrollStudentPage(studentId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Enroll Student</h3>
            </div>
            <div class="card-body">
                <form id="enrollment-form">
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="grade" class="form-label">Grade</label>
                        <select id="grade" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="class" class="form-label">Class</label>
                        <select id="class" class="form-select"></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitEnrollment(${studentId})">Enroll</button>
                </form>
            </div>
        </div>
    `;

    // Fetch dropdown data
    fetchAcademicYears();
    fetchGrades();
    document.getElementById("grade").addEventListener("change", fetchClasses);
}

export function fetchAcademicYears() {
    fetch("/fetch-academic-years/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("academic-year");
            dropdown.innerHTML = data.map(year => `
                <option value="${year.id}">${year.year}</option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching academic years:", error);
            alert("Failed to load academic years. Please try again.");
        });
}

export function fetchGrades() {
    fetch("/fetch-grades/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("grade");
            dropdown.innerHTML = data.map(grade => `
                <option value="${grade.id}">${grade.name}</option>
            `).join("");
        })
        .catch(error => console.error("Error fetching grades:", error));
}

export function fetchClasses() {
    const gradeId = document.getElementById("grade").value;
    const academicYearId = document.getElementById("academic-year").value;

    fetch(`/fetch-classes-for-grade/${gradeId}/${academicYearId}/`)
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("class");
            dropdown.innerHTML = data.map(cls => `
                <option value="${cls.id}">${cls.name}</option>
            `).join("");
        })
        .catch(error => console.error("Error fetching classes:", error));
}

export function submitEnrollment(studentId) {
    const data = {
        student_id: studentId,
        academic_year_id: document.getElementById("academic-year").value,
        grade_id: document.getElementById("grade").value,
        class_id: document.getElementById("class").value,
    };

    fetch("/enroll-student/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Student enrolled successfully!");
                listAllStudents(); // Return to the student list
            } else {
                alert(data.error);
            }
        })
        .catch(error => {
            console.error("Error enrolling student:", error);
            alert("An unexpected error occurred.");
        });
}

export function editEnrollment(studentId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Edit Enrollment</h3>
            </div>
            <div class="card-body">
                <form id="edit-enrollment-form">
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="grade" class="form-label">Grade</label>
                        <select id="grade" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="class" class="form-label">Class</label>
                        <select id="class" class="form-select"></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitEditEnrollment(${studentId})">Save Changes</button>
                </form>
            </div>
        </div>
    `;

    // Fetch data and prefill the form
    fetch(`/get-enrollment-details/${studentId}/`)
        .then(response => response.json())
        .then(data => {
            populateDropdown("academic-year", data.academic_years, data.current_academic_year);
            populateDropdown("grade", data.grades, data.current_grade);
            populateDropdown("class", data.classes, data.current_class);
        })
        .catch(error => {
            console.error("Error fetching enrollment details:", error);
            alert("Failed to load enrollment details. Please try again.");
        });
}

export function populateDropdown(dropdownId, options, selectedValue) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = `<option value="" disabled>Select an option</option>`; // Default option

    options.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option.id;
        optionElement.textContent = option.name || option.year;

        if (option.id === selectedValue) {
            optionElement.selected = true;
        }

        dropdown.appendChild(optionElement);
    });
}

export function submitEditEnrollment(studentId) {
    // Collect data from the form
    const data = {
        academic_year_id: document.getElementById("academic-year").value,
        grade_id: document.getElementById("grade").value,
        class_id: document.getElementById("class").value,
    };

    // Validate form data
    if (!data.academic_year_id || !data.grade_id || !data.class_id) {
        alert("All fields are required.");
        return;
    }

    // Send the data to the server
    fetch(`/edit-enrollment/${studentId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(), // Include CSRF token for security
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Enrollment updated successfully!");
                listAllStudents(); // Redirect back to the student list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error updating enrollment:", error);
            alert("An unexpected error occurred.");
        });
}

export function deleteEnrollment(studentId) {
    if (!confirm("Are you sure you want to delete this enrollment?")) {
        return;
    }

    fetch(`/delete-enrollment/${studentId}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(), // Include CSRF token for security
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Enrollment deleted successfully!");
                listAllStudents(); // Refresh the list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error deleting enrollment:", error);
            alert("An unexpected error occurred.");
        });
}

export function listAllParentStudentRelationships() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>All Parent-Student Relationships</h3>
            </div>
            <div class="card-body">
                <table class="table table-striped" id="parent-student-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Parent Name</th>
                            <th>Student Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetch("/fetch-parent-student-relationships/")
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector("#parent-student-table tbody");
            tableBody.innerHTML = ""; // Clear loading state
            data.forEach((relationship, index) => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${relationship.parent_name}</td>
                        <td>${relationship.student_name}</td>
                        <td>
                            ${relationship.student_id
                                ? `
                                <button class="btn btn-sm btn-warning" onclick="editParentRelationship(${relationship.parent_id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteParentRelationship(${relationship.parent_id}, ${relationship.student_id})">Delete</button>
                                `
                                : `<button class="btn btn-sm btn-primary" onclick="addParentRelationship(${relationship.parent_id})">Add</button>`}
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching relationships:", error);
            const tableBody = document.querySelector("#parent-student-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">Failed to load relationships</td>
                </tr>
            `;
        });
}

export function addParentRelationship(parentId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Add Parent-Student Relationship</h3>
            </div>
            <div class="card-body">
                <form id="add-relationship-form">
                    <div class="mb-3">
                        <label for="student" class="form-label">Select Students</label>
                        <select id="student" class="form-select" multiple></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitAddRelationship(${parentId})">Save</button>
                </form>
            </div>
        </div>
    `;

    fetch("/fetch-all-students/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("student");
            dropdown.innerHTML = data.map(student => `
                <option value="${student.id}">${student.username}</option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching students:", error);
            alert("Failed to load students. Please try again.");
        });
}

export function submitAddRelationship(parentId) {
    const selectedStudents = Array.from(document.getElementById("student").selectedOptions).map(opt => opt.value);

    if (selectedStudents.length === 0) {
        alert("Please select at least one student.");
        return;
    }

    fetch(`/add-parent-relationship/${parentId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(), // Include CSRF token for security
        },
        body: JSON.stringify({ student_ids: selectedStudents }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Relationship added successfully!");
                listAllParentStudentRelationships(); // Return to parent list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error adding relationship:", error);
            alert("An unexpected error occurred.");
        });
}

export function editParentRelationship(parentId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Edit Parent-Student Relationship</h3>
            </div>
            <div class="card-body">
                <form id="edit-relationship-form">
                    <div class="mb-3">
                        <label for="student" class="form-label">Select Students</label>
                        <select id="student" class="form-select" multiple></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitEditRelationship(${parentId})">Save Changes</button>
                </form>
            </div>
        </div>
    `;

    // Fetch students and preselect related students
    fetch(`/get-parent-relationship/${parentId}/`)
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("student");
            dropdown.innerHTML = data.all_students.map(student => `
                <option value="${student.id}" ${data.related_students.includes(student.id) ? "selected" : ""}>
                    ${student.username}
                </option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching relationship data:", error);
            alert("Failed to load relationship data. Please try again.");
        });
}

export function submitEditRelationship(parentId) {
    const selectedStudents = Array.from(document.getElementById("student").selectedOptions).map(opt => opt.value);

    fetch(`/edit-parent-relationship/${parentId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ student_ids: selectedStudents }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Relationship updated successfully!");
                listAllParentStudentRelationships(); // Return to the parent list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error editing relationship:", error);
            alert("An unexpected error occurred.");
        });
}

export function deleteParentRelationship(parentId, studentId) {
    if (!confirm("Are you sure you want to delete this relationship?")) {
        return;
    }

    fetch(`/delete-parent-student-relationship/${parentId}/${studentId}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Relationship deleted successfully!");
                listAllParentStudentRelationships();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error deleting relationship:", error);
            alert("An unexpected error occurred.");
        });
}

export function listAllTeachers() {
    const mainContainer = document.getElementById("main");

    // Create the table and global Assign Teachers button dynamically
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                <h3>All Teachers</h3>
                <button class="btn btn-light" onclick="assignTeacherForm()">Assign Teachers</button>
            </div>
            <div class="card-body">
                <table class="table table-striped" id="teachers-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Teacher Name</th>
                            <th>Subject</th>
                            <th>Grade</th>
                            <th>Class</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Fetch all teachers and their assignments
    fetch("/fetch-teacher-overview/")
        .then((response) => response.json())
        .then((data) => {
            const tableBody = document.querySelector("#teachers-table tbody");
            tableBody.innerHTML = ""; // Clear loading state

            data.forEach((teacher, index) => {
                if (teacher.assignments.length > 0) {
                    // Add a row for each assignment
                    teacher.assignments.forEach((assignment) => {
                        tableBody.innerHTML += `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${teacher.teacher_name}</td>
                                <td>${assignment.subject}</td>
                                <td>${assignment.grade}</td>
                                <td>${assignment.class}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTeacherAssignment(${assignment.assignment_id})">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    // Add a single row for unassigned teachers
                    tableBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${teacher.teacher_name}</td>
                            <td colspan="3" class="text-center">Unassigned</td>
                            <td></td>
                        </tr>
                    `;
                }
            });
        })
        .catch((error) => {
            console.error("Error fetching teacher data:", error);
            const tableBody = document.querySelector("#teachers-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Failed to load teacher data.</td>
                </tr>
            `;
        });
}

export function assignTeacherForm() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Assign Teacher</h3>
            </div>
            <div class="card-body">
                <form id="assign-teacher-form">
                    <div class="mb-3">
                        <label for="teacher" class="form-label">Select Teacher</label>
                        <select id="teacher" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="grade" class="form-label">Grade</label>
                        <select id="grade" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="class" class="form-label">Class</label>
                        <select id="class" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="subject" class="form-label">Subject</label>
                        <select id="subject" class="form-select"></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitTeacherAssignment()">Assign</button>
                </form>
            </div>
        </div>
    `;

    // Fetch dropdown data
    fetchTeachers();
    fetchAcademicYears();
    document.getElementById("academic-year").addEventListener("change", fetchGradesForAcademicYear);
    document.getElementById("grade").addEventListener("change", fetchClassesAndSubjects);
}
// Fetch grades for the selected academic year
export function fetchGradesForAcademicYear() {
    const academicYearId = document.getElementById("academic-year").value;

    if (!academicYearId) {
        alert("Please select an academic year.");
        return Promise.resolve(); // Return a resolved promise for async consistency
    }

    return fetch(`/fetch-grades-teacherAssignment/${academicYearId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const gradeDropdown = document.getElementById("grade");
            gradeDropdown.innerHTML = data.map(grade => `
                <option value="${grade.id}">${grade.name}</option>
            `).join("");
            gradeDropdown.dispatchEvent(new Event("change")); // Trigger class/subject fetch
        })
        .catch(error => {
            console.error("Error fetching grades:", error);
            alert("Failed to load grades. Please try again.");
        });
}
// Fetch classes and subjects for the selected grade and academic year
export function fetchClassesAndSubjects() {
    const academicYearId = document.getElementById("academic-year").value;
    const gradeId = document.getElementById("grade").value;

    if (!academicYearId || !gradeId) {
        alert("Please select both academic year and grade.");
        return;
    }

    fetch(`/fetch-classes-and-subjects/${academicYearId}/${gradeId}/`) // Updated endpoint for classes/subjects
        .then(response => response.json())
        .then(data => {
            // Populate classes
            const classDropdown = document.getElementById("class");
            classDropdown.innerHTML = data.classes.map(cls => `
                <option value="${cls.id}">${cls.name}</option>
            `).join("");

            // Populate subjects
            const subjectDropdown = document.getElementById("subject");
            subjectDropdown.innerHTML = data.subjects.map(subject => `
                <option value="${subject.id}">${subject.name}</option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching classes and subjects:", error);
            alert("Failed to load classes and subjects. Please try again.");
        });
}

export function fetchTeachers() {
    fetch("/fetch-teachers/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("teacher");
            dropdown.innerHTML = data.map(teacher => `
                <option value="${teacher.id}">${teacher.username}</option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching teachers:", error);
            alert("Failed to load teachers. Please try again.");
        });
}

export function submitTeacherAssignment() {
    const data = {
        teacher_id: document.getElementById("teacher").value,
        academic_year_id: document.getElementById("academic-year").value,
        class_id: document.getElementById("class").value,
        subject_id: document.getElementById("subject").value,
    };

    fetch("/assign-teacher/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Teacher assigned successfully!");
                listAllTeachers();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error assigning teacher:", error);
            alert("An unexpected error occurred.");
        });
}

export function deleteTeacherAssignment(assignmentId) {
    if (!confirm("Are you sure you want to delete this assignment?")) {
        return;
    }

    fetch(`/delete-teacher-assignment/${assignmentId}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Assignment deleted successfully!");
                listAllTeachers(); // Refresh the teacher list
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error deleting assignment:", error);
            alert("An unexpected error occurred.");
        });
}

export function manageFees() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Fee Management</h3>
            </div>
            <div class="card-body">
                <button class="btn btn-primary mb-3" onclick="createSchoolFeesForm()">Create Fees for Entire School</button>
                <button class="btn btn-secondary mb-3" onclick="createBatchFeesForm()">Create Fees for Grade or Class</button>
                <button class="btn btn-info mb-3" onclick="createStudentFeeForm()">Create Fee for Individual Student</button>
            </div>
        </div>
    `;
}

export function createSchoolFeesForm() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Fees for Entire School</h3>
            </div>
            <div class="card-body">
                <form id="school-fees-form">
                    <div class="mb-3">
                        <label for="description" class="form-label">Fee Description</label>
                        <input type="text" id="description" class="form-control" placeholder="Enter fee description" required>
                    </div>
                    <div class="mb-3">
                        <label for="amount" class="form-label">Fee Amount</label>
                        <input type="number" id="amount" class="form-control" placeholder="Enter fee amount" required>
                    </div>
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitSchoolFees()">Create Fees</button>
                </form>
            </div>
        </div>
    `;

    fetchAcademicYears(); // Populate academic years dynamically
}

export function createClassFees() {
    const classId = document.getElementById("class").value;
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;

    fetch("/create-class-fees/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ class_id: classId, description, amount, academic_year_id: academicYearId }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating class fees:", error);
        });
}

export function createGradeFees() {
    const gradeId = document.getElementById("grade").value;
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;

    fetch("/create-grade-fees/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ grade_id: gradeId, description, amount, academic_year_id: academicYearId }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating grade fees:", error);
        });
}

export function createStudentFee() {
    const studentId = document.getElementById("student").value;
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;

    fetch("/create-student-fee/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ student_id: studentId, description, amount, academic_year_id: academicYearId }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating student fee:", error);
        });
}

export function createBatchFeesForm() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Fees for Grade or Class</h3>
            </div>
            <div class="card-body">
                <form id="batch-fees-form">
                    <div class="mb-3">
                        <label for="description" class="form-label">Fee Description</label>
                        <input type="text" id="description" class="form-control" placeholder="Enter fee description" required>
                    </div>
                    <div class="mb-3">
                        <label for="amount" class="form-label">Fee Amount</label>
                        <input type="number" id="amount" class="form-control" placeholder="Enter fee amount" required>
                    </div>
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="scope" class="form-label">Apply To</label>
                        <select id="scope" class="form-select" onchange="toggleBatchScope()">
                            <option value="">Select Scope</option>
                            <option value="grade">Grade</option>
                            <option value="class">Class</option>
                        </select>
                    </div>
                    <div id="batch-scope-fields"></div>
                    <button type="button" class="btn btn-primary" onclick="submitBatchFees()">Create Fees</button>
                </form>
            </div>
        </div>
    `;

    fetchAcademicYears(); // Populate academic years dynamically
}

export function createStudentFeeForm() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Fee for Individual Student</h3>
            </div>
            <div class="card-body">
                <form id="student-fees-form">
                    <div class="mb-3">
                        <label for="description" class="form-label">Fee Description</label>
                        <input type="text" id="description" class="form-control" placeholder="Enter fee description" required>
                    </div>
                    <div class="mb-3">
                        <label for="amount" class="form-label">Fee Amount</label>
                        <input type="number" id="amount" class="form-control" placeholder="Enter fee amount" required>
                    </div>
                    <div class="mb-3">
                        <label for="academic-year" class="form-label">Academic Year</label>
                        <select id="academic-year" class="form-select"></select>
                    </div>
                    <div class="mb-3">
                        <label for="student" class="form-label">Student</label>
                        <select id="student" class="form-select"></select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="submitStudentFee()">Create Fee</button>
                </form>
            </div>
        </div>
    `;

    fetchAcademicYears(); // Populate academic years dynamically
    fetchAvailableStudents(); // Populate students dynamically
}

export function submitSchoolFees() {
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;

    fetch("/create-school-fees/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ description, amount, academic_year_id: academicYearId }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating school fees:", error);
        });
}

export function toggleBatchScope() {
    const scope = document.getElementById("scope").value;
    const batchScopeFields = document.getElementById("batch-scope-fields");
    batchScopeFields.innerHTML = ""; // Clear previous fields

    if (scope === "grade") {
        // If scope is Grade, populate the grade dropdown
        batchScopeFields.innerHTML = `
            <div class="mb-3">
                <label for="grade" class="form-label">Grade</label>
                <select id="grade" class="form-select"></select>
            </div>
        `;

        fetch("/fetch-grades/")
            .then(response => response.json())
            .then(grades => {
                const gradeDropdown = document.getElementById("grade");
                grades.forEach(grade => {
                    const option = document.createElement("option");
                    option.value = grade.id;
                    option.textContent = grade.name;
                    gradeDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error loading grades:", error);
                alert("Failed to load grades. Please try again.");
            });
    } else if (scope === "class") {
        // If scope is Class, populate the class dropdown
        batchScopeFields.innerHTML = `
            <div class="mb-3">
                <label for="class" class="form-label">Class</label>
                <select id="class" class="form-select"></select>
            </div>
        `;

        fetch("/fetch-classes/")
            .then(response => response.json())
            .then(classes => {
                const classDropdown = document.getElementById("class");
                classes.forEach(cls => {
                    const option = document.createElement("option");
                    option.value = cls.id;
                    option.textContent = `${cls.name} (${cls.grade})`;
                    classDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error loading classes:", error);
                alert("Failed to load classes. Please try again.");
            });
    }
}

export function submitBatchFees() {
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;
    const scope = document.getElementById("scope").value;

    if (!scope) {
        alert("Please select a scope (Grade or Class).");
        return;
    }

    let payload = {
        description,
        amount,
        academic_year_id: academicYearId,
    };

    // Add grade or class based on the selected scope
    if (scope === "grade") {
        const gradeId = document.getElementById("grade").value;
        if (!gradeId) {
            alert("Please select a grade.");
            return;
        }
        payload.grade_id = gradeId;
    } else if (scope === "class") {
        const classId = document.getElementById("class").value;
        if (!classId) {
            alert("Please select a class.");
            return;
        }
        payload.class_id = classId;
    }

    // Determine the endpoint based on scope
    const endpoint = scope === "grade" ? "/create-grade-fees/" : "/create-class-fees/";

    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating batch fees:", error);
        });
}

export function fetchAvailableStudents() {
    fetch("/fetch-available-students/")
        .then(response => response.json())
        .then(students => {
            const studentDropdown = document.getElementById("student");
            studentDropdown.innerHTML = students.map(student => `
                <option value="${student.id}">${student.username}</option>
            `).join("");
        })
        .catch(error => {
            console.error("Error fetching available students:", error);
            alert("Failed to load students. Please try again.");
        });
}

export function submitStudentFee() {
    const studentId = document.getElementById("student").value;
    const description = document.getElementById("description").value;
    const amount = document.getElementById("amount").value;
    const academicYearId = document.getElementById("academic-year").value;

    if (!studentId || !description || !amount || !academicYearId) {
        alert("All fields are required. Please fill out the form completely.");
        return;
    }

    fetch("/create-student-fee/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({
            student_id: studentId,
            description,
            amount,
            academic_year_id: academicYearId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Fee created successfully for the student.");
                document.getElementById("student-fees-form").reset(); // Reset the form after submission
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error("Error creating student fee:", error);
            alert("An unexpected error occurred. Please try again.");
        });
}

function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue || "";
}