from django.db import models

class NumberSeries(models.Model):
    series_name = models.CharField(max_length=100, unique=True)
    prefix = models.CharField(max_length=50, unique=True)
    current_sequence = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.series_name

    def get_next_sequence(self):
        self.current_sequence += 1
        self.save()
        return f"{self.prefix}-{str(self.current_sequence).zfill(7)}"