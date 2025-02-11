// profile module here

export function profile() {
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