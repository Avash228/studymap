import { useEffect, useState } from 'react';
import { fetchSubjects, fetchTopics, analyzeScores } from './api';
import './styles.css';

function ScoreBar({ title, score, variant }) {
  return (
    <div className={`score-card ${variant}`}>
      <div className="score-card-header">
        <span>{title}</span>
        <span>{score}%</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${variant}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;

    fetchTopics(selectedSubject).then((data) => {
      setTopics(data);

      const initialScores = {};
      data.forEach((topic) => {
        initialScores[topic.id] = 50;
      });

      setScores(initialScores);
      setResult(null);
    });
  }, [selectedSubject]);

  const handleScoreChange = (topicId, value) => {
    let safeValue = Number(value);

    if (safeValue < 0) safeValue = 0;
    if (safeValue > 100) safeValue = 100;

    setScores((prev) => ({
      ...prev,
      [topicId]: safeValue,
    }));
  };

  const handleAnalyze = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    const data = await analyzeScores(selectedSubject, scores);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <h1>StudyMap</h1>
          <p>
            StudyMap analyzes your knowledge and builds a personalized learning
            path based on weak topics and topic dependencies.
          </p>
        </header>

        <section className="card info-card">
          <h2>Problem</h2>
          <p>
            Students often study inefficiently because they do not know which
            topics are weak and what order they should learn them in.
          </p>
        </section>

        <section className="card info-card">
          <h2>Solution</h2>
          <p>
            StudyMap identifies weak areas and generates a personalized roadmap
            using results by topic and prerequisite relationships between
            concepts.
          </p>
        </section>

        <section className="card">
          <h2>1. Select subject</h2>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Choose a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </section>

        {topics.length > 0 && (
          <section className="card">
            <h2>2. Enter scores by topic</h2>
            <p className="section-text">
              Enter your estimated performance for each topic from 0 to 100.
            </p>

            <div className="topics-grid">
              {topics.map((topic) => (
                <div key={topic.id} className="topic-box">
                  <div>
                    <strong>{topic.title}</strong>
                    <p>{topic.description}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scores[topic.id] ?? 0}
                    onChange={(e) => handleScoreChange(topic.id, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyzing...' : 'Build Study Plan'}
            </button>
          </section>
        )}

        {result && (
          <section className="results">
            <div className="card">
              <h2>Intelligent Summary</h2>
              <p>{result.summary}</p>
            </div>

            <div className="three-columns">
              <div className="card">
                <h3>Strong Topics (Already mastered)</h3>
                {result.strong_topics.length === 0 ? (
                  <p>None</p>
                ) : (
                  result.strong_topics.map((item) => (
                    <ScoreBar
                      key={item.topic_id}
                      title={item.title}
                      score={item.score}
                      variant="success"
                    />
                  ))
                )}
              </div>

              <div className="card">
                <h3>Medium Topics (Need more practice)</h3>
                {result.medium_topics.length === 0 ? (
                  <p>None</p>
                ) : (
                  result.medium_topics.map((item) => (
                    <ScoreBar
                      key={item.topic_id}
                      title={item.title}
                      score={item.score}
                      variant="warning"
                    />
                  ))
                )}
              </div>

              <div className="card">
                <h3>Weak Topics (Focus first)</h3>
                {result.weak_topics.length === 0 ? (
                  <p>None</p>
                ) : (
                  result.weak_topics.map((item) => (
                    <ScoreBar
                      key={item.topic_id}
                      title={item.title}
                      score={item.score}
                      variant="danger"
                    />
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h2>Your Optimal Learning Path</h2>
              <ol className="route-list">
                {result.study_plan.map((item, index) => (
                  <li key={item.topic_id}>
                    <div className="route-left">
                      <span className="step-badge">Step {index + 1}</span>
                      <span>{item.title}</span>
                    </div>
                    <span>{item.score}%</span>
                  </li>
                ))}
              </ol>

              <p className="route-note">
                This path is generated based on your weakest topics and
                prerequisite relationships between concepts.
              </p>
            </div>

            <div className="card">
              <h2>Recommended Learning Websites</h2>
              {Object.keys(result.weak_resources || {}).length === 0 ? (
                <p>No weak topics detected.</p>
              ) : (
                Object.entries(result.weak_resources).map(([topic, links]) => (
                  <div key={topic} className="resource-block">
                    <h3>{topic}</h3>
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="resource-link"
                      >
                        <strong>{link.title}</strong>
                        <span>{link.snippet}</span>
                      </a>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h2>Worksheets for Strong Topics</h2>
              {Object.keys(result.strong_worksheets || {}).length === 0 ? (
                <p>No strong topics detected.</p>
              ) : (
                Object.entries(result.strong_worksheets).map(([topic, links]) => (
                  <div key={topic} className="resource-block">
                    <h3>{topic}</h3>
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="resource-link"
                      >
                        <strong>{link.title}</strong>
                        <span>{link.snippet}</span>
                      </a>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}