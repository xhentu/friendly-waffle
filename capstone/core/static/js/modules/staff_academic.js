// academic year modules


export function getAcademicYears() {
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

export function editAcademicYear(id, year, isActive) {
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

export function deleteAcademicYear(id) {
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

export function createAcademicYear() {
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