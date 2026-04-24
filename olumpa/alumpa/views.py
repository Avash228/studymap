from collections import defaultdict
from urllib.parse import quote_plus

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Subject, Topic, TopicDependency
from .serializers import SubjectSerializer, TopicSerializer


def build_search_link(query):
    return f"https://www.google.com/search?q={quote_plus(query)}"


def get_learning_resources(topic_title):
    return [
        {
            "title": f"Learn {topic_title} — Khan Academy",
            "url": build_search_link(f"{topic_title} Khan Academy"),
            "snippet": f"Search for Khan Academy lessons and explanations about {topic_title}.",
        },
        {
            "title": f"{topic_title} explanation — YouTube",
            "url": build_search_link(f"{topic_title} explained YouTube"),
            "snippet": f"Search for video explanations and tutorials about {topic_title}.",
        },
        {
            "title": f"{topic_title} notes and examples",
            "url": build_search_link(f"{topic_title} notes examples for students"),
            "snippet": f"Search for notes, examples, and step-by-step explanations on {topic_title}.",
        },
    ]


def get_worksheets(topic_title):
    return [
        {
            "title": f"{topic_title} worksheet PDF",
            "url": build_search_link(f"{topic_title} worksheet pdf"),
            "snippet": f"Search for printable worksheets on {topic_title}.",
        },
        {
            "title": f"{topic_title} practice questions",
            "url": build_search_link(f"{topic_title} practice questions"),
            "snippet": f"Search for extra exercises and practice tasks on {topic_title}.",
        },
        {
            "title": f"{topic_title} exam-style problems",
            "url": build_search_link(f"{topic_title} exam style questions pdf"),
            "snippet": f"Search for harder worksheet and exam-style problems on {topic_title}.",
        },
    ]


@api_view(['GET'])
def subjects_list(request):
    subjects = Subject.objects.all()
    return Response(SubjectSerializer(subjects, many=True).data)


@api_view(['GET'])
def topics_list(request):
    subject_id = request.GET.get('subject_id')
    topics = Topic.objects.filter(subject_id=subject_id).order_by('id')
    return Response(TopicSerializer(topics, many=True).data)


def build_plan(subject_id, scores):
    topics = list(Topic.objects.filter(subject_id=subject_id))
    dependencies = TopicDependency.objects.filter(topic__subject_id=subject_id)

    topic_map = {topic.id: topic for topic in topics}

    graph = defaultdict(list)
    indegree = {topic.id: 0 for topic in topics}
    dependency_count = defaultdict(int)

    for dep in dependencies:
        graph[dep.depends_on_id].append(dep.topic_id)
        indegree[dep.topic_id] += 1
        dependency_count[dep.depends_on_id] += 1

    priority = {}
    for topic in topics:
        score = int(scores.get(str(topic.id), 0))
        base_priority = 100 - score
        prerequisite_bonus = dependency_count[topic.id] * 10
        priority[topic.id] = base_priority + prerequisite_bonus

    queue = [topic.id for topic in topics if indegree[topic.id] == 0]
    ordered = []

    while queue:
        queue.sort(key=lambda topic_id: priority[topic_id], reverse=True)
        current = queue.pop(0)
        ordered.append(current)

        for neighbor in graph[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    strong = []
    medium = []
    weak = []

    for topic in topics:
        score = int(scores.get(str(topic.id), 0))
        item = {
            'topic_id': topic.id,
            'title': topic.title,
            'score': score,
        }

        if score >= 75:
            strong.append(item)
        elif score >= 50:
            medium.append(item)
        else:
            weak.append(item)

    study_plan = []
    for topic_id in ordered:
        topic = topic_map[topic_id]
        study_plan.append({
            'topic_id': topic.id,
            'title': topic.title,
            'score': int(scores.get(str(topic.id), 0)),
            'priority': priority[topic.id],
        })

    if weak:
        weakest = sorted(weak, key=lambda x: x['score'])[0]
        summary = (
            f"You should start with '{weakest['title']}' because it is your "
            f"weakest topic and affects your understanding of other topics."
        )
    else:
        summary = "You do not have critically weak topics right now."

    weak_resources = {}
    for item in weak:
        weak_resources[item["title"]] = get_learning_resources(item["title"])

    strong_worksheets = {}
    for item in strong:
        strong_worksheets[item["title"]] = get_worksheets(item["title"])

    return {
        'strong_topics': strong,
        'medium_topics': medium,
        'weak_topics': weak,
        'study_plan': study_plan,
        'summary': summary,
        'weak_resources': weak_resources,
        'strong_worksheets': strong_worksheets,
    }


@api_view(['POST'])
def analyze(request):
    subject_id = request.data.get('subject_id')
    scores = request.data.get('scores', {})

    if not subject_id:
        return Response({'error': 'subject_id is required'}, status=400)

    result = build_plan(subject_id, scores)
    return Response(result)