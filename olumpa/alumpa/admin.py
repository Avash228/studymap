from django.contrib import admin
from .models import Subject, Topic, TopicDependency

admin.site.register(Subject)
admin.site.register(Topic)
admin.site.register(TopicDependency)