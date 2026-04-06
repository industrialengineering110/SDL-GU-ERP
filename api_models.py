from django.db import models
from django.contrib.auth.models import AbstractUser

class User(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50)
    designation = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='PENDING')
    permissions = models.JSONField(default=dict)

class StyleMaster(models.Model):
    buyer = models.CharField(max_length=100)
    style_number = models.CharField(max_length=100, unique=True)
    style_code = models.CharField(max_length=100)
    product_category = models.CharField(max_length=100)
    smv = models.FloatField()
    marketing_smv = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    history = models.JSONField(default=list)

class StylePlan(models.Model):
    so_number = models.CharField(max_length=50)
    buyer = models.CharField(max_length=100)
    style_number = models.CharField(max_length=100)
    color = models.CharField(max_length=50)
    plan_quantity = models.IntegerField()
    line_id = models.CharField(max_length=50)
    sections_meta = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

class ProductionRecord(models.Model):
    date = models.DateField()
    line_id = models.CharField(max_length=50)
    style_code = models.CharField(max_length=100)
    so_number = models.CharField(max_length=50)
    actual = models.IntegerField()
    target = models.IntegerField()
    hour = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
