from django.utils.timezone import now
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator

# from django.contrib.auth import get_user_model
# CustomUser = get_user_model()

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
# Class Model with Basic Fee
class Class(models.Model):
    name = models.CharField(max_length=20, blank=True, null=True)  # Example: "Class A"
    grade = models.ForeignKey('Grade', on_delete=models.CASCADE)
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.0)  # Basic class fee

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
        ('Break', '12:15 pm - 12:45 pm'),
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

    def clean(self):
        """
        Custom validation to ensure the subject's grade matches the class grade.
        """
        if self.subject and self.subject.grade != self.class_instance.grade:
            raise ValidationError(
                f"Subject '{self.subject.name}' belongs to Grade {self.subject.grade.name}, "
                f"but the class '{self.class_instance.name}' belongs to Grade {self.class_instance.grade.name}."
            )

    def save(self, *args, **kwargs):
        """
        Perform validation before saving.
        """
        self.full_clean()  # Calls the clean method
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.class_instance.name} - {self.subject.name if self.subject else 'No Subject'} ({self.day_of_week})"

class TeacherAssignment(models.Model):
    teacher = models.ForeignKey('TeacherProfile', on_delete=models.CASCADE, blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.teacher.user.username} teaches {self.subject.name} in {self.class_assigned.name} ({self.academic_year.year})"

    def clean(self):
        # Check if the same subject, class, and academic year assignment already exists
        if TeacherAssignment.objects.filter(
            teacher=self.teacher,
            subject=self.subject,
            class_assigned=self.class_assigned,
            academic_year=self.academic_year,
        ).exclude(pk=self.pk).exists():
            raise ValidationError(
                f"{self.teacher.user.username} is already teaching {self.subject.name} in {self.class_assigned.name} "
                f"for the academic year {self.academic_year.year}."
            )

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "subject", "class_assigned", "academic_year"],
                name="unique_teacher_subject_class_year",
            )
        ]
# Student Enrollment with Automatic Basic Fee Creation
class StudentEnrollment(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE)
    grade = models.ForeignKey('Grade', on_delete=models.CASCADE)
    class_assigned = models.ForeignKey('Class', on_delete=models.CASCADE)
    enrollment_date = models.DateField(default=now)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.class_assigned.name} ({self.academic_year.year})"
    
    def clean(self):
        # Ensure the class's grade matches the selected grade
        if self.class_assigned.grade != self.grade:
            raise ValidationError(f"The selected class {self.class_assigned.name} does not match the grade {self.grade.name}.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)

        # Automatically create a basic fee for the enrolled student
        if not Fees.objects.filter(student=self.student, academic_year=self.academic_year).exists():
            Fees.objects.create(
                student=self.student,
                amount_due=self.class_assigned.fee,
                due_date=now().date(),
                academic_year=self.academic_year,
            )
# Student Attendence model
class Attendance(models.Model):
    class_instance = models.ForeignKey('Class', on_delete=models.CASCADE)  # Class for the attendance record
    section = models.CharField(
        max_length=20,
        choices=[
            ('1st Section', '1st Section'),
            ('2nd Section', '2nd Section'),
            ('3rd Section', '3rd Section'),
            ('4th Section', '4th Section'),
        ],
    )  # Section for the attendance
    date = models.DateField()  # Date of the attendance
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE)  # Academic year of the record
    present_students = models.ManyToManyField(
        'StudentProfile', 
        related_name='present_attendance', 
        blank=True
    )  # List of present students
    absent_students = models.ManyToManyField(
        'StudentProfile', 
        related_name='absent_attendance', 
        blank=True
    )  # List of absent students
    total_students = models.PositiveIntegerField(default=0)  # Track total number of students in the class
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for record creation
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp for record update

    def __str__(self):
        return f"{self.class_instance.name} - {self.section} - {self.date}"

    class Meta:
        unique_together = ('class_instance', 'section', 'date')  # Ensure unique records for class, section, and date

    @property
    def present_count(self):
        return self.present_students.count()

    @property
    def absent_count(self):
        return self.absent_students.count()

    @property
    def attendance_summary(self):
        """
        Provides a summary of attendance in a dictionary format.
        """
        return {
            'total_students': self.total_students,
            'present_count': self.present_count,
            'absent_count': self.absent_count,
        }
    
class Exam(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)  # Example: "Mid-term Exam"
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, blank=True, null=True)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, blank=True, null=True)  # Grade-level exams
    classes_assigned = models.ManyToManyField(Class, blank=True, related_name="exams")  # Allow multiple classes
    exam_date = models.DateField(blank=True, null=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.subject.name} - {self.grade.name} ({self.academic_year.year})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "subject", "grade", "academic_year"],
                name="unique_exam_per_subject_grade_academic_year",
            )
        ]

class ExamGrade(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE, blank=True, null=True)
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE, blank=True, null=True)
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE, blank=True, null=True)
    grade = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],  # Grades between 0-100
        blank=True, null=True
    )
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.exam.name} - {self.subject.name} ({self.grade})"

    def clean(self):
        """Ensure student is enrolled in the correct class and subject matches the exam."""

        # Get student's current enrollment for the given academic year
        student_enrollment = StudentEnrollment.objects.filter(
            student=self.student, academic_year=self.academic_year
        ).order_by("-enrollment_date").first()  # Get the most recent enrollment

        if not student_enrollment:
            raise ValidationError(f"{self.student.user.username} is not enrolled in any class for this academic year.")

        # Ensure student’s class is assigned to the exam
        if not self.exam.classes_assigned.filter(id=student_enrollment.class_assigned.id).exists():
            raise ValidationError(f"{self.student.user.username} is not enrolled in a class assigned to {self.exam.name}")

        # Ensure subject matches the exam's subject
        if self.subject != self.exam.subject:
            raise ValidationError(f"Exam subject mismatch: Expected {self.exam.subject.name}, got {self.subject.name}")

    def save(self, *args, **kwargs):
        self.full_clean()  # Validate before saving
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "exam"],
                name="unique_student_exam_grade",
            )
        ]
# Fees Model
class Fees(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, blank=True, null=True)

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
# Additional Fees Model
class AdditionalFee(models.Model):
    student = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)  # Example: "Sports Fee"
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.student.user.username} - {self.description} - {self.amount}"

class Notification(models.Model):
    SCOPE_CHOICES = [
        ("School", "Entire School"),
        ("Grade", "Grade-level"),
        ("Class", "Specific Class"),
        ("Personal", "Personal"),
        ("Admin", "Admins"),
        ("Staff", "Staff"),
        ("Teacher", "Teachers"),
        ("Student", "Students"),
        ("Parent", "Parents")
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    sender = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    recipients = models.ManyToManyField(CustomUser, blank=True, related_name="notifications_received")  # General recipient field
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

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
