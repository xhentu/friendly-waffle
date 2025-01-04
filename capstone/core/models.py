from django.utils.timezone import now
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.exceptions import ValidationError

# Create your models here.
class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('parent', 'Parent'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    RELIGION_CHOICES = [
        ('islam', 'Islam'),
        ('christianity', 'Christianity'),
        ('hinduism', 'Hinduism'),
        ('buddhism', 'Buddhism'),
        ('none', 'None'),
        ('other', 'Other'),
    ]

    USERNAME_FIELD = 'username'
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    nrc_no = models.CharField(max_length=50, blank=True, null=True)  # NRC/ID number
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    religion = models.CharField(max_length=20, choices=RELIGION_CHOICES, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)  # Physical address
    email = models.EmailField(blank=True, null=True)  # Overriding or additional
    date_of_birth = models.DateField(blank=True, null=True)

    groups = models.ManyToManyField(
        Group,
        related_name='customuser_groups',  # Custom related_name to resolve the clash
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_permissions',  # Custom related_name to resolve the clash
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    def __str__(self):
        return f'{self.user.username} (Admin)'

class StaffProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Monthly Salary
    def __str__(self):
        return f'{self.user.username} (Staff)'

class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Monthly Salary
    def __str__(self):
        return f'{self.user.username} (Teacher)'

class SalaryPayment(models.Model):
    profile = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # Could be Staff or Teacher
    payment_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)  # Optional notes about the payment

    def __str__(self):
        return f'{self.profile.username} - {self.payment_date} - {self.amount_paid}'

# Profile model for Students
class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    def __str__(self):
        return f'{self.user.username} (Student)'

class ParentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    students = models.ManyToManyField(StudentProfile, blank=True, related_name="parents")
    def __str__(self):
        return f'{self.user.username} (Parent)'

class AcademicYear(models.Model):
    year = models.CharField(max_length=20, blank=True, null=True)  # Example: "2024-2025"
    is_active = models.BooleanField(default=True, blank=True, null=True)

    def __str__(self):
        return self.year

    def save(self, *args, **kwargs):
        # If this academic year is set to active, deactivate all others
        if self.is_active:
            # Set all other academic years' is_active to False
            AcademicYear.objects.exclude(id=self.id).update(is_active=False)
        
        # Call the original save method to save this instance
        super(AcademicYear, self).save(*args, **kwargs)

class Grade(models.Model):
    name = models.CharField(max_length=20)  # Example: "Grade 1", "Grade 2", etc.

    def __str__(self):
        return self.name

class Class(models.Model):
    name = models.CharField(max_length=20, blank=True, null=True)  # Example: "Class A"
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.grade.name} - {self.academic_year.year}"

class Subject(models.Model):
    name = models.CharField(max_length=50, blank=True, null=True)  # Example: "Mathematics"
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)  # Subject's grade
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)
    classes = models.ManyToManyField(Class, blank=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.grade.name} - {self.academic_year.year}"

    def clean(self):
        """
        Validates that all classes assigned to this subject belong to the same grade as the subject.
        """
        if self.pk:  # Ensure the instance exists in the database
            invalid_classes = [
                class_instance.name
                for class_instance in self.classes.all()
                if class_instance.grade != self.grade
            ]
            if invalid_classes:
                raise ValidationError(
                    f"The following classes are invalid for this subject: {', '.join(invalid_classes)}. "
                    "Classes must match the grade of the subject."
                )

    def save(self, *args, **kwargs):
        """
        Save the Subject instance and perform validation.
        """
        # Perform validation before saving
        self.full_clean()  # Calls the `clean` method and ensures field-level validation
        super().save(*args, **kwargs)  # Save the object

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "grade", "academic_year"],
                name="unique_subject_per_grade_academic_year",
            )
        ]

# Schedule Model
class Schedule(models.Model):
    SECTION_CHOICES = [
        ('1st Section', '9:00 am - 10:30 am'),
        ('2nd Section', '10:45 am - 12:15 pm'),
        ('Break', '12:15 pm - 12:45 pm'),  # 30-minute break
        ('3rd Section', '12:45 pm - 1:15 pm'),
        ('4th Section', '2:00 pm - 3:30 pm'),
    ]

    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
    ]

    class_instance = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="timetable")
    section = models.CharField(max_length=20, choices=SECTION_CHOICES)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, related_name="scheduled_sections")
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)

    def __str__(self):
        return f"{self.class_instance.name} - {self.section} ({self.day_of_week}) - {self.subject.name if self.subject else 'No Subject'}"

# Teacher Assignment Model
class TeacherAssignment(models.Model):
    teacher = models.ForeignKey('TeacherProfile', on_delete=models.CASCADE, blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.teacher.user.username} teaches {self.subject.name} in {self.class_assigned.name} ({self.academic_year.year})"
    
    def clean(self):
        if not self.class_assigned.is_active:
            raise ValidationError(f"Cannot assign teacher to an inactive class: {self.class_assigned.name}")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

# Student Enrollment Model
class StudentEnrollment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)  # Reference to the student
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)  # Academic year
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)  # Associated grade
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE)  # Class within the grade
    enrollment_date = models.DateField(default=now)  # Enrollment date
    is_active = models.BooleanField(default=True)  # Status of the enrollment

    def __str__(self):
        return f"{self.student.user.username} - {self.class_assigned.name} ({self.academic_year.year})"

    def clean(self):
        # Ensure the class's grade matches the selected grade
        if self.class_assigned.grade != self.grade:
            raise ValidationError(f"The selected class {self.class_assigned.name} does not match the grade {self.grade.name}.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)


# Attendance Model
class Attendance(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE, blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=[('Present', 'Present'), ('Absent', 'Absent')], blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.subject.name} - {self.date} ({self.status})"

class Exam(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)  # Example: "Mid-term Exam"
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, blank=True, null=True)
    exam_date = models.DateField(blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.subject.name} - {self.class_assigned.name} ({self.academic_year.year})"

class ExamGrade(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE, blank=True, null=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)  # Example: 95.50
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.exam.name} - {self.subject.name} ({self.grade})"

class Fees(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE, blank=True, null=True)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.username} - Due: {self.amount_due}, Paid: {self.amount_paid}"

    @property
    def fee_status(self):
        if self.amount_paid == self.amount_due:
            return "Complete"
        elif self.amount_paid > 0 and self.amount_paid < self.amount_due:
            return "Partially Paid"
        else:
            return "Not Paid"
        
class Notification(models.Model):
    SCOPE_CHOICES = [
        ('Class', 'Specific Class'),
        ('Grade', 'Grade-level Classes'),
        ('School', 'Entire School'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    sender = models.ForeignKey('StaffProfile', on_delete=models.CASCADE)  # Assuming StaffProfile includes admin, staff, teachers
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='School')
    class_target = models.ManyToManyField(Class, blank=True)  # For 'Class' scope
    grade_target = models.ManyToManyField(Grade, blank=True)  # For 'Grade' scope
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.sender.user.username}"

    def clean(self):
        # Skip ManyToManyField validation here
        pass

    def save(self, *args, **kwargs):
        # Only call super().save; defer validation to signals or forms
        super().save(*args, **kwargs)

class TeacherDailyAttendance(models.Model):
    date = models.DateField()
    teacher = models.ForeignKey('TeacherProfile', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=[('Present', 'Present'), ('Absent', 'Absent')], blank=True, null=True)

    class Meta:
        unique_together = ('date', 'teacher')  # Ensures a teacher can't have multiple attendance records for the same day

    def __str__(self):
        return f"{self.teacher.user.username} - {self.date} ({self.status})"
    
class StaffDailyAttendance(models.Model):
    date = models.DateField()
    staff = models.ForeignKey('StaffProfile', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=[('Present', 'Present'), ('Absent', 'Absent')], blank=True, null=True)

    class Meta:
        unique_together = ('date', 'staff')  # Ensures a staff member can't have multiple attendance records for the same day

    def __str__(self):
        return f"{self.staff.user.username} - {self.date} ({self.status})"
