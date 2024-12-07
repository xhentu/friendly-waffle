document.addEventListener('DOMContentLoaded', {

})

function profile() {
    fetch('/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            // Clear existing content in the #main div
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = "";

            // Populate the #main div with profile content
            mainContainer.innerHTML = `
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
                        ${
                            data.salary
                                ? `
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Salary:</strong></p>
                                    <p class="text-muted">$${data.salary}</p>
                                </div>
                                `
                                : ""
                        }
                    </div>
                    ${
                        data.students
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
}

function academicYear() {
    fetch('/academic-years')
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = "";

            let academicYearContent = `
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
                academicYearContent += `
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

            academicYearContent += `
                            </tbody>
                        </table>
                        <button class="btn btn-secondary" onclick="reloadDashboard()">Back to Dashboard</button>
                    </div>
                </div>
            `;

            mainContainer.innerHTML = academicYearContent;
        })
        .catch(error => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load academic years data. Please try again later.
                </div>
            `;
            console.error("Error fetching academic years data:", error);
        });
}

function editAcademicYear(id, year, isActive) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
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
                    <button type="button" class="btn btn-secondary" onclick="academicYear()">Cancel</button>
                </form>
            </div>
        </div>
    `;

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
                academicYear(); // Refresh the academic year list
            })
            .catch(error => {
                console.error("Error updating academic year:", error);
            });
    });
}

function deleteAcademicYear(id) {
    if (confirm("Are you sure you want to delete this academic year?")) {
        fetch(`/academic-years/${id}/`, {
            method: "DELETE",
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to delete academic year");
                }
                academicYear(); // Refresh the academic year list
            })
            .catch(error => {
                console.error("Error deleting academic year:", error);
            });
    }
}

