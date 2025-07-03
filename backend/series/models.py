from django.db import models

class Series(models.Model):
    series_name = models.CharField(max_length=50, unique=True)
    current_sequence = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.series_name

    def get_next_sequence(self):
        """Increment and return the next sequence number."""
        self.current_sequence += 1
        self.save()
        return self.current_sequence