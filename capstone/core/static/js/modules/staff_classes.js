// classes modules

export function viewClasses() {
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

export function createClasses() {
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

export function editClass(classId) {
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

export function deleteClass(classId) {
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

export function getGrades() {
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

export function editGrade(gradeId, currentName) {
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

export function deleteGrade(gradeId) {
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

export function createGrades() {
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

export function getSubjects() {
    fetch("/get-subjects-forStaff/")
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

export function createSubject() {
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
            document.getElementById("grade").addEventListener("change", fetchClassesForGradeAndYear);
            document.getElementById("academic-year").addEventListener("change", fetchClassesForGradeAndYear);

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

export function fetchClassesForGradeAndYear() {
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

export function editSubject(subjectId) {
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

export function deleteSubject(subjectId) {
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