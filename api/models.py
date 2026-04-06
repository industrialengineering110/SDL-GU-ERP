from django.db import models
import uuid

class AppUser(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    section = models.CharField(max_length=100, null=True, blank=True)
    role = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='PENDING')
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.name} ({self.employee_id})"

class StyleMaster(models.Model):
    buyer = models.CharField(max_length=100)
    style_number = models.CharField(max_length=100, unique=True)
    style_code = models.CharField(max_length=100)
    product_category = models.CharField(max_length=100)
    smv = models.FloatField(default=0.0)
    marketing_smv = models.FloatField(default=0.0)
    history = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

class ManpowerBudgetEntry(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4)
    department = models.CharField(max_length=100)
    section = models.CharField(max_length=100)
    area = models.CharField(max_length=100)
    designation = models.CharField(max_length=255)
    category = models.CharField(max_length=50) # MANAGEMENT or NON-MANAGEMENT
    employee_type = models.CharField(max_length=50) # STAFF or WORKER
    budget_per_line = models.IntegerField(default=0)
    num_lines = models.IntegerField(default=1)
    total_budget = models.IntegerField(default=0)
    remarks = models.TextField(blank=True)
    existing = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class ProductionRecord(models.Model):
    date = models.DateField()
    line_id = models.CharField(max_length=50)
    style_code = models.CharField(max_length=100)
    actual = models.IntegerField()
    target = models.IntegerField()
    hour = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

class NPTRecord(models.Model):
    date = models.DateField()
    line_id = models.CharField(max_length=50)
    issue_category = models.CharField(max_length=100)
    reason = models.CharField(max_length=255)
    duration_minutes = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING')
