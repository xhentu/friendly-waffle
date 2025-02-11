from django_filters import rest_framework as filters
from .models import Exam, AcademicYear, Grade, Class, Subject

class ExamFilter(filters.FilterSet):
    academic_year = filters.ModelChoiceFilter(queryset=AcademicYear.objects.all(), field_name="academic_year_id")
    grade = filters.ModelChoiceFilter(queryset=Grade.objects.all(), field_name="subject__grade")
    class_assigned = filters.ModelChoiceFilter(queryset=Class.objects.all(), field_name="classes_assigned")
    subject = filters.ModelChoiceFilter(queryset=Subject.objects.all())

    class Meta:
        model = Exam
        fields = ["academic_year", "grade", "class_assigned", "subject"]
