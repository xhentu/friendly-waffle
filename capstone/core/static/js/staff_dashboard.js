document.addEventListener('DOMContentLoaded', () => {
    // Add any initialization logic here, if needed

});
// Function to handle profile data fetching and rendering
function profile() {
    fetch('/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = "";

            const profileContent = `
                <div id="profile-content" class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Profile Details</h3>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Username:</strong></p>
                                <p class="text-muted">${data.username}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Email:</strong></p>
                                <p class="text-muted">${data.email}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Role:</strong></p>
                                <p class="text-muted">${data.role}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Gender:</strong></p>
                                <p class="text-muted">${data.gender || "Not specified"}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Religion:</strong></p>
                                <p class="text-muted">${data.religion || "Not specified"}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Phone:</strong></p>
                                <p class="text-muted">${data.phone_number || "Not specified"}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <p class="mb-1"><strong>Address:</strong></p>
                                <p class="text-muted">${data.address || "Not specified"}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Date of Birth:</strong></p>
                                <p class="text-muted">${data.date_of_birth || "Not specified"}</p>
                            </div>
                            ${data.salary
                                ? `
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Salary:</strong></p>
                                    <p class="text-muted">$${data.salary}</p>
                                </div>
                                `
                                : ""
                            }
                        </div>
                        ${data.students
                            ? `
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <p class="mb-1"><strong>Students:</strong></p>
                                    <p class="text-muted">${data.students.join(", ")}</p>
                                </div>
                            </div>
                            `
                            : ""
                        }
                    </div>
                    <div class="card-footer text-center">
                        <button class="btn btn-secondary" onclick="reloadDashboard()">Back to Dashboard</button>
                    </div>
                </div>
            `;
            mainContainer.innerHTML = profileContent;
        })
        .catch(error => {
            console.error("Error fetching profile data:", error);
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load profile data. Please try again later.
                </div>
            `;
        });
};

function getAcademicYears() {
    fetch('/getAcademicYears/')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = "";

            let academicYearsContent = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Academic Years</h3>
                    </div>
                    <div class="card-body">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Academic Year</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            data.forEach((year, index) => {
                academicYearsContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${year.year}</td>
                        <td>${year.is_active ? "Active" : "Inactive"}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editAcademicYear(${year.id}, '${year.year}', ${year.is_active})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAcademicYear(${year.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });

            academicYearsContent += `
                            </tbody>
                        </table>
                        <button class="btn btn-secondary" onclick="reloadDashboard()">Back to Dashboard</button>
                    </div>
                </div>
            `;
            mainContainer.innerHTML = academicYearsContent;
        })
        .catch(error => {
            console.error("Error fetching academic years data:", error);
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load academic years data. Please try again later.
                </div>
            `;
        });
};

function editAcademicYear(id, year, isActive) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = "";

    const editAcademicYearContent = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Edit Academic Year</h3>
            </div>
            <div class="card-body">
                <form id="edit-academic-year-form">
                    <div class="mb-3">
                        <label for="year" class="form-label">Academic Year</label>
                        <input type="text" class="form-control" id="year" value="${year}" required>
                    </div>
                    <div class="mb-3">
                        <label for="is_active" class="form-label">Active</label>
                        <select class="form-select" id="is_active">
                            <option value="true" ${isActive ? "selected" : ""}>Yes</option>
                            <option value="false" ${!isActive ? "selected" : ""}>No</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="getAcademicYears()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    mainContainer.innerHTML = editAcademicYearContent;

    document.getElementById("edit-academic-year-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const updatedYear = document.getElementById("year").value;
        const updatedIsActive = document.getElementById("is_active").value === "true";

        fetch(`/academic-years/${id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ year: updatedYear, is_active: updatedIsActive }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update academic year");
                }
                return response.json();
            })
            .then(() => {
                getAcademicYears();
            })
            .catch(error => {
                console.error("Error updating academic year:", error);
            });
    });
}
// funny fucking reloadDashboard 
function reloadDashboard() {
    const main = document.getElementById('main');
    main.innerHTML = 'this is main';
}

function deleteAcademicYear(id) {
    // Confirmation dialog before deletion
    if (!confirm("Are you sure you want to delete this academic year?")) {
        return;
    }

    // Making the DELETE request to the server
    fetch(`/academic-years/${id}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to delete academic year");
            }
            return response.json();
        })
        .then(data => {
            alert(data.message); // Display success message
            getAcademicYears();  // Refresh the list of academic years
        })
        .catch(error => {
            console.error("Error deleting academic year:", error);
            alert("An error occurred while deleting the academic year.");
        });
}

function createAcademicYear() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Academic Year</h3>
            </div>
            <div class="card-body">
                <form id="create-academic-year-form">
                    <div class="mb-3">
                        <label for="year" class="form-label">Academic Year</label>
                        <input type="text" class="form-control" id="year" placeholder="Enter academic year" required>
                    </div>
                    <div class="mb-3">
                        <label for="is_active" class="form-label">Active</label>
                        <select class="form-select" id="is_active">
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Create</button>
                    <button type="button" class="btn btn-secondary" onclick="getAcademicYears()">Cancel</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById("create-academic-year-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const newYear = document.getElementById("year").value;
        const isActive = document.getElementById("is_active").value === "true";

        fetch('/academic-years/add/', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ year: newYear, is_active: isActive }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create academic year");
                }
                return response.json();
            })
            .then(() => {
                getAcademicYears();
            })
            .catch(error => {
                console.error("Error creating academic year:", error);
            });
    });
}

function viewClasses() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>All Classes</h3>
            </div>
            <div class="card-body">
                <button class="btn btn-primary mb-3" onclick="createClasses()">Create New Class</button>
                <table class="table table-striped" id="classes-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Class Name</th>
                            <th>Grade</th>
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

    fetch("/view-classes/")
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message); });
            }
            return response.json();
        })
        .then(classList => {
            const tableBody = document.querySelector("#classes-table tbody");
            tableBody.innerHTML = ""; // Clear loading state
            classList.forEach((classItem, index) => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${classItem.name}</td>
                        <td>${classItem.grade}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editClass(${classItem.id}, '${classItem.name}', '${classItem.grade}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteClass(${classItem.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching classes:", error.message);
            const tableBody = document.querySelector("#classes-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">Failed to load classes</td>
                </tr>
            `;
        });
}

function createClasses() {
    // Fetch active options for academic years and grades
    fetch("/get-active-options/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch active options");
            }
            return response.json();
        })
        .then(data => {
            // Construct the form dynamically with fetched data
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Create Class</h3>
                    </div>
                    <div class="card-body">
                        <form id="create-class-form">
                            <div class="mb-3">
                                <label for="class-name" class="form-label">Class Name</label>
                                <input type="text" class="form-control" id="class-name" placeholder="Enter class name" required>
                            </div>
                            <div class="mb-3">
                                <label for="academic-year" class="form-label">Academic Year</label>
                                <select class="form-select" id="academic-year" required>
                                    ${
                                        data.academic_years.length
                                            ? data.academic_years.map(
                                                  year => `<option value="${year.id}">${year.year}</option>`
                                              ).join("")
                                            : `<option disabled>No Active Academic Year</option>`
                                    }
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade</label>
                                <select class="form-select" id="grade" required>
                                    ${
                                        data.grades.length
                                            ? data.grades.map(
                                                  grade => `<option value="${grade.id}">${grade.name}</option>`
                                              ).join("")
                                            : `<option disabled>No Active Grades</option>`
                                    }
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Create Class</button>
                        </form>
                    </div>
                </div>
            `;

            // Attach event listener for form submission
            document.getElementById("create-class-form").addEventListener("submit", function (e) {
                e.preventDefault();
                const className = document.getElementById("class-name").value;
                const academicYearId = document.getElementById("academic-year").value;
                const gradeId = document.getElementById("grade").value;

                fetch("/create-class/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: className,
                        academic_year_id: academicYearId,
                        grade_id: gradeId,
                    }),
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => { throw new Error(err.error); });
                        }
                        return response.json();
                    })
                    .then(data => {
                        alert("Class created successfully!");
                        viewClasses(); // Redirect to class list or reload page
                    })
                    .catch(error => {
                        console.error("Error creating class:", error.message);
                        alert("Failed to create class: " + error.message);
                    });
            });
        })
        .catch(error => {
            console.error("Error fetching active options:", error.message);
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    Failed to load active options: ${error.message}
                </div>
            `;
        });
}

function editClass(classId) {
    // Fetch the current class details to populate the form
    fetch(`/get-class-details/${classId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch class details");
            }
            return response.json();
        })
        .then(classData => {
            // Construct the edit form dynamically
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-warning text-white">
                        <h3>Edit Class</h3>
                    </div>
                    <div class="card-body">
                        <form id="edit-class-form">
                            <div class="mb-3">
                                <label for="class-name" class="form-label">Class Name</label>
                                <input type="text" class="form-control" id="class-name" value="${classData.name}" required>
                            </div>
                            <div class="mb-3">
                                <label for="academic-year" class="form-label">Academic Year</label>
                                <select class="form-select" id="academic-year" required>
                                    ${
                                        classData.active_academic_years.map(ay => `
                                            <option value="${ay.id}" ${ay.id === classData.academic_year.id ? "selected" : ""}>
                                                ${ay.year}
                                            </option>
                                        `).join("")
                                    }
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade</label>
                                <select class="form-select" id="grade" required>
                                    ${
                                        classData.grades.map(grade => `
                                            <option value="${grade.id}" ${grade.id === classData.grade.id ? "selected" : ""}>
                                                ${grade.name}
                                            </option>
                                        `).join("")
                                    }
                                </select>
                            </div>
                            <button type="submit" class="btn btn-warning">Update Class</button>
                        </form>
                    </div>
                </div>
            `;

            // Attach event listener for form submission
            document.getElementById("edit-class-form").addEventListener("submit", function (e) {
                e.preventDefault();
                const updatedClassName = document.getElementById("class-name").value;
                const updatedAcademicYearId = document.getElementById("academic-year").value;
                const updatedGradeId = document.getElementById("grade").value;

                fetch(`/update-class/${classId}/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: updatedClassName,
                        academic_year_id: updatedAcademicYearId,
                        grade_id: updatedGradeId,
                    }),
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => { throw new Error(err.error); });
                        }
                        return response.json();
                    })
                    .then(data => {
                        alert("Class updated successfully!");
                        viewClasses(); // Refresh the class list
                    })
                    .catch(error => {
                        console.error("Error updating class:", error.message);
                        alert("Failed to update class: " + error.message);
                    });
            });
        })
        .catch(error => {
            console.error("Error fetching class details:", error.message);
            alert("Failed to load class details: " + error.message);
        });
}

function deleteClass(classId) {
    if (confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
        fetch(`/delete-class/${classId}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error); });
                }
                return response.json();
            })
            .then(data => {
                alert("Class deleted successfully!");
                viewClasses(); // Refresh the class list
            })
            .catch(error => {
                console.error("Error deleting class:", error.message);
                alert("Failed to delete class: " + error.message);
            });
    }
}

function getGrades() {
    // Fetch grades from the server
    fetch("/get-grades/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch grades");
            }
            return response.json();
        })
        .then(data => {
            // Construct the grades table dynamically
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
            <div class="card shadow-sm p-4">
                <div class="card-header text-center bg-primary text-white">
                <h3>Grades</h3>
                </div>
            <div class="card-body">
            <button class="btn btn-primary mb-3" onclick="createGrades()">Create New Grade</button>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Grade Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                        data.grades.length
                            ? data.grades.map((grade, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${grade.name}</td>
                                    <td>
                                        <button class="btn btn-sm btn-warning" onclick="editGrade(${grade.id}, '${grade.name}')">Edit</button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteGrade(${grade.id})">Delete</button>
                                    </td>
                                </tr>
                            `).join("")
                            : `<tr><td colspan="3" class="text-center">No Grades Available</td></tr>`
                    }
                </tbody>
            </table>
            </div>
            </div>
        `;
        })
        .catch(error => {
            console.error("Error fetching grades:", error.message);
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    Failed to load grades: ${error.message}
                </div>
            `;
        });
}

function editGrade(gradeId, currentName) {
    const newName = prompt("Enter the new name for the grade:", currentName);
    if (newName) {
        fetch(`/edit-grade/${gradeId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: newName }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update grade");
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                getGrades(); // Refresh the grade list
            })
            .catch(error => {
                console.error("Error updating grade:", error.message);
                alert("Failed to update grade: " + error.message);
            });
    }
}

function deleteGrade(gradeId) {
    if (confirm("Are you sure you want to delete this grade? This action cannot be undone.")) {
        fetch(`/delete-grade/${gradeId}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to delete grade");
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                getGrades(); // Refresh the grade list
            })
            .catch(error => {
                console.error("Error deleting grade:", error.message);
                alert("Failed to delete grade: " + error.message);
            });
    }
}

function createGrades() {
    const gradeName = prompt("Enter the name of the new grade:");
    if (gradeName) {
        fetch("/create-grade/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: gradeName }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create grade");
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                getGrades(); // Refresh the grade list
            })
            .catch(error => {
                console.error("Error creating grade:", error.message);
                alert("Failed to create grade: " + error.message);
            });
    }
}

function getSubjects() {
    fetch("/get-subjects/")
        .then(response => response.json())
        .then(data => {
            if (data.subjects) {
                const mainContainer = document.getElementById("main");
                mainContainer.innerHTML = `
                    <div class="card shadow-sm p-4">
                        <div class="card-header text-center bg-primary text-white">
                            <h3>Subjects</h3>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-primary mb-3" onclick="createSubject()">Create New Subject</button>
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Grade</th>
                                        <th>Academic Year</th>
                                        <th>Classes</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.subjects.map((subject, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${subject.name}</td>
                                            <td>${subject.grade}</td>
                                            <td>${subject.academic_year || "N/A"}</td>
                                            <td>${subject.classes.join(", ") || "N/A"}</td>
                                            <td>${subject.is_active ? "Active" : "Inactive"}</td>
                                            <td>
                                                <button class="btn btn-sm btn-warning" onclick="editSubject(${subject.id})">Edit</button>
                                                <button class="btn btn-sm btn-danger" onclick="deleteSubject(${subject.id})">Delete</button>
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                alert("Failed to load subjects");
            }
        })
        .catch(error => console.error("Error fetching subjects:", error));
}

function createSubject() {
    // Fetch active options for academic years and grades
    fetch("/get-active-subject-options/")
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch active options");
            return response.json();
        })
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Create Subject</h3>
                    </div>
                    <div class="card-body">
                        <form id="create-subject-form">
                            <div class="mb-3">
                                <label for="subject-name" class="form-label">Subject Name</label>
                                <input type="text" class="form-control" id="subject-name" placeholder="Enter subject name" required>
                            </div>
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade</label>
                                <select class="form-select" id="grade" required>
                                    ${data.grades.map(grade => `<option value="${grade.id}">${grade.name}</option>`).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="academic-year" class="form-label">Academic Year</label>
                                <select class="form-select" id="academic-year" required>
                                    ${data.academic_years.map(year => `<option value="${year.id}">${year.year}</option>`).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="classes" class="form-label">Classes</label>
                                <select class="form-select" id="classes" multiple required>
                                    <option disabled>Select a grade and academic year first</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Create Subject</button>
                        </form>
                    </div>
                </div>
            `;

            // Attach event listeners for grade and academic year selection
            document.getElementById("grade").addEventListener("change", fetchClasses);
            document.getElementById("academic-year").addEventListener("change", fetchClasses);

            // Form submission event listener
            document.getElementById("create-subject-form").addEventListener("submit", function (e) {
                e.preventDefault();
                const subjectName = document.getElementById("subject-name").value;
                const gradeId = document.getElementById("grade").value;
                const academicYearId = document.getElementById("academic-year").value;
                const classIds = Array.from(document.querySelectorAll("#classes option:checked")).map(opt => opt.value);

                fetch("/create-subject/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: subjectName,
                        grade_id: gradeId,
                        academic_year_id: academicYearId,
                        class_ids: classIds,
                    }),
                })
                    .then(response => {
                        if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
                        return response.json();
                    })
                    .then(data => {
                        alert("Subject created successfully!");
                        getSubjects(); // Refresh the subject list
                    })
                    .catch(error => {
                        console.error("Error creating subject:", error.message);
                        alert("Failed to create subject: " + error.message);
                    });
            });
        })
        .catch(error => {
            console.error("Error fetching active options:", error.message);
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `<div class="alert alert-danger text-center">Failed to load active options: ${error.message}</div>`;
        });
}

function fetchClasses() {
    const gradeId = document.getElementById("grade").value;
    const academicYearId = document.getElementById("academic-year").value;

    if (gradeId && academicYearId) {
        fetch(`/get-classes-for-grade-and-year/?grade_id=${gradeId}&academic_year_id=${academicYearId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch classes");
                return response.json();
            })
            .then(data => {
                const classesDropdown = document.getElementById("classes");
                classesDropdown.innerHTML = data.classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join("");
            })
            .catch(error => {
                console.error("Error fetching classes:", error.message);
                alert("Failed to fetch classes: " + error.message);
            });
    }
}

function editSubject(subjectId) {
    // Fetch current subject details
    fetch(`/get-subject/${subjectId}/`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch subject details");
            return response.json();
        })
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-primary text-white">
                        <h3>Edit Subject</h3>
                    </div>
                    <div class="card-body">
                        <form id="edit-subject-form">
                            <div class="mb-3">
                                <label for="subject-name" class="form-label">Subject Name</label>
                                <input type="text" class="form-control" id="subject-name" value="${data.name}" required>
                            </div>
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade</label>
                                <select class="form-select" id="grade" required>
                                    ${data.grades.map(grade => `
                                        <option value="${grade.id}" ${grade.id === data.grade.id ? "selected" : ""}>
                                            ${grade.name}
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="academic-year" class="form-label">Academic Year</label>
                                <select class="form-select" id="academic-year" required>
                                    ${data.academic_years.map(year => `
                                        <option value="${year.id}" ${year.id === data.academic_year.id ? "selected" : ""}>
                                            ${year.year}
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="classes" class="form-label">Classes</label>
                                <select class="form-select" id="classes" multiple required>
                                    ${data.classes.map(cls => `
                                        <option value="${cls.id}" ${data.selected_classes.includes(cls.id) ? "selected" : ""}>
                                            ${cls.name}
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="is-active" class="form-label">Status</label>
                                <select class="form-select" id="is-active" required>
                                    <option value="true" ${data.is_active ? "selected" : ""}>Active</option>
                                    <option value="false" ${!data.is_active ? "selected" : ""}>Inactive</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Update Subject</button>
                        </form>
                    </div>
                </div>
            `;

            // Handle form submission
            document.getElementById("edit-subject-form").addEventListener("submit", function (e) {
                e.preventDefault();
                const subjectName = document.getElementById("subject-name").value;
                const gradeId = document.getElementById("grade").value;
                const academicYearId = document.getElementById("academic-year").value;
                const classIds = Array.from(document.querySelectorAll("#classes option:checked")).map(opt => opt.value);
                const isActive = document.getElementById("is-active").value === "true";

                fetch(`/edit-subject/${subjectId}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: subjectName,
                        grade_id: gradeId,
                        academic_year_id: academicYearId,
                        class_ids: classIds,
                        is_active: isActive,
                    }),
                })
                    .then(response => {
                        if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
                        return response.json();
                    })
                    .then(data => {
                        alert("Subject updated successfully!");
                        getSubjects(); // Refresh the subject list
                    })
                    .catch(error => {
                        console.error("Error updating subject:", error.message);
                        alert("Failed to update subject: " + error.message);
                    });
            });
        })
        .catch(error => {
            console.error("Error fetching subject details:", error.message);
            alert("Failed to fetch subject details: " + error.message);
        });
}

function deleteSubject(subjectId) {
    if (confirm("Are you sure you want to delete this subject?")) {
        fetch(`/delete-subject/${subjectId}/`, {
            method: "DELETE",
        })
            .then(response => {
                if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
                return response.json();
            })
            .then(data => {
                alert("Subject deleted successfully!");
                getSubjects(); // Refresh the subject list
            })
            .catch(error => {
                console.error("Error deleting subject:", error.message);
                alert("Failed to delete subject: " + error.message);
            });
    }
}

function viewUsers() {
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
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching users:", error.message);
            const tableBody = document.querySelector("#users-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Failed to load users</td>
                </tr>
            `;
        });
}

function createUserForm() {
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

function toggleRoleFields() {
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

function submitUserForm() {
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
                document.getElementById("create-user-form").reset(); // Reset the form
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("An unexpected error occurred.");
        });
}
// Helper function to get CSRF token
function getCSRFToken() {
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];
    return cookieValue || "";
}

function listAllStudents() {
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
                                ? `<button class="btn btn-sm btn-warning" onclick="editEnrollment(${student.id})">Edit</button>`
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

function enrollStudentPage(studentId) {
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

function fetchAcademicYears() {
    fetch("/fetch-academic-years/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("academic-year");
            dropdown.innerHTML = data.map(year => `
                <option value="${year.id}">${year.year}${year.is_active ? " (Active)" : ""}</option>
            `).join("");
        })
        .catch(error => console.error("Error fetching academic years:", error));
}

function fetchGrades() {
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

function fetchClasses() {
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

function submitEnrollment(studentId) {
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

function editEnrollment(studentId) {
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

// populateDropdown function is not defined yet


