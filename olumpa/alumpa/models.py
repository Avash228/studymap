from django.db import models


class Subject(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.title


class TopicDependency(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='unlocks')

    class Meta:
        unique_together = ('topic', 'depends_on')

    def __str__(self):
        return f'{self.topic.title} depends on {self.depends_on.title}'