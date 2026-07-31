"""
Seeds the question_bank table with a curated set of interview
questions, organized by (role, interview_type, difficulty).

Run manually, once, after applying
backend/migrations/2026_07_31_mock_interview.sql:

    cd backend
    python -m scripts.seed_question_bank

Why this lives in a Python script instead of the SQL migration file:
~500 rows of real, readable question text is far easier to author,
review, and extend as a structured Python dict than as one enormous
SQL INSERT block - and unlike the placement_drives sample data (a
handful of demo rows), this *is* the actual production content for the
feature, not throwaway seed data, so it deserves to be organized and
diffable like real content.

Safe to re-run: for every (role, interview_type, difficulty) bucket,
it first checks whether that bucket already has rows and skips it if
so, rather than appending duplicates.

`role = None` means "not role-specific" - used for the General
technical bucket (Target Role = "None (General Interview)") as well as
every HR and Behavioral question, none of which are written for a
specific role. "Mixed" interview type deliberately has no dedicated
bucket of its own - question_bank_service.py blends the Technical,
HR, and Behavioral pools together for a Mixed interview instead of
duplicating ~100 more questions that would just restate what those
three pools already cover.
"""

from app.database.db import supabase

# ---------------------------------------------------------------------
# QUESTION_BANK[(role, interview_type, difficulty)] = [question, ...]
#
# role is one of the exact Target Role labels the frontend sends, or
# None for General/HR/Behavioral. interview_type is one of
# 'Technical' | 'HR' | 'Behavioral'. difficulty is 'Easy' | 'Medium' | 'Hard'.
# ---------------------------------------------------------------------

QUESTION_BANK = {

    # ============================== GENERAL (Target Role = None) ==============================

    (None, "Technical", "Easy"): [
        "What is the difference between a compiler and an interpreter?",
        "Explain the difference between an array and a linked list.",
        "What is Big O notation and why is it used?",
        "What is the difference between a stack and a queue?",
        "What is object-oriented programming?",
        "Explain the difference between synchronous and asynchronous execution.",
        "What is a database index and why is it useful?",
        "What is the difference between GET and POST HTTP methods?",
        "What is version control and why is Git widely used?",
        "Explain the difference between a process and a thread.",
        "What is recursion? Give a simple example.",
        "What is the difference between SQL and NoSQL databases?",
    ],
    (None, "Technical", "Medium"): [
        "Explain how a hash table works internally.",
        "What is the difference between REST and GraphQL APIs?",
        "Describe the concept of time and space complexity trade-offs.",
        "What is normalization in databases, and why is it used?",
        "Explain the difference between multithreading and multiprocessing.",
        "What is dependency injection and why is it useful?",
        "How does garbage collection work in most modern languages?",
        "Explain the CAP theorem in distributed systems.",
        "What is a race condition, and how can it be prevented?",
        "Describe the differences between monolithic and microservices architectures.",
        "What is caching, and what are common cache invalidation strategies?",
        "Explain how load balancing works in a web application.",
    ],
    (None, "Technical", "Hard"): [
        "How would you design a URL shortening service like bit.ly?",
        "Explain how a distributed consensus algorithm like Raft works.",
        "How would you design a rate limiter for an API?",
        "What are the trade-offs between strong and eventual consistency?",
        "How would you scale a database that has outgrown a single server?",
        "Explain how a content delivery network reduces latency.",
        "Describe how you would design a notification system for millions of users.",
        "What is idempotency, and why does it matter in distributed systems?",
        "How would you detect and prevent a memory leak in a long-running service?",
        "Explain the trade-offs between vertical and horizontal scaling.",
        "How would you design a system to handle millions of concurrent WebSocket connections?",
        "What strategies would you use to migrate a live production database with zero downtime?",
    ],

    # ============================== SOFTWARE ENGINEER ==============================

    ("Software Engineer", "Technical", "Easy"): [
        "What is the difference between an abstract class and an interface?",
        "Explain the SOLID principles briefly.",
        "What is unit testing, and why is it important?",
        "What is the difference between == and === in JavaScript?",
        "What is a null pointer exception, and how can it be avoided?",
        "Explain the difference between pass-by-value and pass-by-reference.",
        "What is exception handling, and why is it necessary?",
        "What is the purpose of a constructor in object-oriented programming?",
        "What is the difference between an array and a dynamic array (like ArrayList)?",
        "Explain what a design pattern is, with one example.",
        "What is the difference between compile-time and run-time errors?",
        "What is code refactoring, and why is it done?",
    ],
    ("Software Engineer", "Technical", "Medium"): [
        "Explain the Singleton design pattern and when you would use it.",
        "What is the difference between composition and inheritance?",
        "How does a binary search algorithm work, and what is its time complexity?",
        "Explain the Observer design pattern with a real-world example.",
        "What is technical debt, and how do you manage it in a codebase?",
        "Describe how continuous integration and continuous deployment (CI/CD) work.",
        "What is the difference between a shallow copy and a deep copy?",
        "Explain how memory is managed on the stack versus the heap.",
        "What is polymorphism, and how is it implemented in most languages?",
        "How would you handle versioning in a public API?",
        "What is test-driven development, and what are its benefits?",
        "Explain the difference between horizontal and vertical code reuse.",
    ],
    ("Software Engineer", "Technical", "Hard"): [
        "How would you design a code review process for a fast-moving engineering team?",
        "Explain how you would refactor a large legacy monolith incrementally without downtime.",
        "How would you design a plugin architecture that allows third-party extensions?",
        "What trade-offs would you consider when choosing between synchronous and event-driven architectures?",
        "How would you design a system for feature flagging at scale?",
        "Explain how you would debug a production issue that only occurs intermittently.",
        "How would you design an efficient CI pipeline for a monorepo with hundreds of services?",
        "What approach would you take to enforce backward compatibility across API versions?",
        "How would you design a system to safely roll back a bad deployment automatically?",
        "Explain the trade-offs between build-vs-buy decisions for internal tooling.",
        "How would you architect a system to support multi-region failover?",
        "Describe how you would design an audit-logging system for a financial application.",
    ],

    # ============================== AI ENGINEER ==============================

    ("AI Engineer", "Technical", "Easy"): [
        "What is a neural network?",
        "What is the difference between supervised and unsupervised learning?",
        "What is overfitting, and how can it be prevented?",
        "What is a loss function, and why is it needed?",
        "What is the difference between training data and test data?",
        "What is gradient descent?",
        "What is an activation function, and why is it used?",
        "What is the difference between classification and regression?",
        "What is a confusion matrix?",
        "What is transfer learning?",
        "What is the difference between AI, machine learning, and deep learning?",
        "What is tokenization in natural language processing?",
    ],
    ("AI Engineer", "Technical", "Medium"): [
        "Explain the difference between batch gradient descent and stochastic gradient descent.",
        "What is backpropagation, and how does it work?",
        "Explain the vanishing gradient problem and how it can be mitigated.",
        "What is regularization, and what are L1 and L2 regularization?",
        "What is the attention mechanism in transformer models?",
        "Explain the difference between precision, recall, and F1 score.",
        "What is a convolutional neural network, and where is it typically used?",
        "What is the difference between a generative and a discriminative model?",
        "Explain the concept of embeddings in machine learning.",
        "What is the difference between fine-tuning and prompt engineering?",
        "How does a recurrent neural network handle sequential data?",
        "What is model quantization, and why is it useful?",
    ],
    ("AI Engineer", "Technical", "Hard"): [
        "Explain how the transformer architecture computes self-attention.",
        "How would you design a system to detect and mitigate hallucinations in a large language model application?",
        "What are the trade-offs between RAG (retrieval-augmented generation) and fine-tuning?",
        "How would you evaluate the performance of a large language model in production?",
        "Explain how reinforcement learning from human feedback (RLHF) works.",
        "How would you design an ML pipeline that supports continuous retraining?",
        "What strategies would you use to reduce inference latency for a large model in production?",
        "Explain the trade-offs between model size, accuracy, and inference cost.",
        "How would you detect and address data drift in a deployed model?",
        "Describe how you would design a feature store for a machine learning platform.",
        "How would you approach responsible AI concerns like bias and fairness in a production model?",
        "Explain how mixture-of-experts models reduce compute while maintaining capacity.",
    ],

    # ============================== MACHINE LEARNING ENGINEER ==============================

    ("Machine Learning Engineer", "Technical", "Easy"): [
        "What is the difference between a parameter and a hyperparameter?",
        "What is cross-validation, and why is it used?",
        "What is feature engineering?",
        "What is the bias-variance trade-off?",
        "What is a decision tree?",
        "What is the purpose of a validation set?",
        "What is one-hot encoding?",
        "What is the difference between bagging and boosting?",
        "What is the purpose of normalizing or standardizing data?",
        "What is a random forest?",
        "What is the k-nearest neighbors algorithm?",
        "What is the difference between a parametric and non-parametric model?",
    ],
    ("Machine Learning Engineer", "Technical", "Medium"): [
        "Explain how gradient boosting algorithms like XGBoost work.",
        "What is the difference between L1 and L2 regularization, and when would you use each?",
        "How would you handle an imbalanced dataset in a classification problem?",
        "Explain how a support vector machine finds a decision boundary.",
        "What is the purpose of a learning rate, and how do you choose one?",
        "Explain the difference between model accuracy and model calibration.",
        "What is dimensionality reduction, and how does PCA work?",
        "How do you detect and handle multicollinearity in a dataset?",
        "Explain the concept of ensemble learning and why it improves performance.",
        "What is the difference between online learning and batch learning?",
        "How would you tune hyperparameters efficiently for a large model?",
        "What is the difference between a generative adversarial network and an autoencoder?",
    ],
    ("Machine Learning Engineer", "Technical", "Hard"): [
        "How would you design a machine learning pipeline that goes from raw data to a served model?",
        "What approach would you take to make a model's predictions explainable to non-technical stakeholders?",
        "How would you architect an A/B testing framework to evaluate a new model in production?",
        "Explain how you would design a system to monitor model performance degradation over time.",
        "What trade-offs would you consider when choosing between a simple interpretable model and a complex black-box model?",
        "How would you design a distributed training setup for a very large model?",
        "Explain how you would handle label noise in a large training dataset.",
        "How would you build a recommendation system that balances relevance and diversity?",
        "What strategies would you use to reduce training cost for large-scale experimentation?",
        "How would you design a feedback loop to continuously improve a deployed model safely?",
        "Explain how you would approach causal inference versus correlation in a real-world ML problem.",
        "How would you design an anomaly detection system for a high-volume streaming dataset?",
    ],

    # ============================== BACKEND DEVELOPER ==============================

    ("Backend Developer", "Technical", "Easy"): [
        "What is an API, and how does a client communicate with a server?",
        "What is the difference between SQL joins - INNER, LEFT, and RIGHT?",
        "What is middleware in a backend framework?",
        "What is the purpose of environment variables in a backend application?",
        "What is a primary key, and why is it important in a database table?",
        "What is the difference between authentication and authorization?",
        "What is JSON, and why is it commonly used in APIs?",
        "What is a foreign key, and what problem does it solve?",
        "What is the purpose of an ORM?",
        "What is the difference between a synchronous and an asynchronous API call?",
        "What are HTTP status codes, and what does a 404 mean?",
        "What is the purpose of logging in a backend application?",
    ],
    ("Backend Developer", "Technical", "Medium"): [
        "Explain how JWT-based authentication works.",
        "What is database connection pooling, and why is it important?",
        "Explain the difference between optimistic and pessimistic locking.",
        "What is a message queue, and when would you use one?",
        "How would you design a rate-limited API endpoint?",
        "Explain the N+1 query problem and how to avoid it.",
        "What is the difference between vertical and horizontal database sharding?",
        "How does a webhook differ from polling for real-time updates?",
        "Explain how database transactions and ACID properties work.",
        "What is the purpose of an API gateway in a microservices architecture?",
        "How would you design pagination for an API returning large datasets?",
        "What is the difference between stateful and stateless backend services?",
    ],
    ("Backend Developer", "Technical", "Hard"): [
        "How would you design the backend architecture for a ride-sharing application?",
        "Explain how you would design a system to guarantee exactly-once message processing.",
        "How would you design a multi-tenant SaaS backend architecture?",
        "What approach would you take to migrate a monolithic backend to microservices safely?",
        "How would you design a backend to handle a sudden 10x spike in traffic?",
        "Explain how distributed transactions work across multiple microservices.",
        "How would you design an event-driven architecture using a message broker like Kafka?",
        "What strategies would you use to secure sensitive data at rest and in transit?",
        "How would you design a backend system for real-time collaborative editing?",
        "Explain how you would implement idempotent APIs for payment processing.",
        "How would you design a backend to support offline-first mobile clients?",
        "What approach would you take to design a backend audit trail for compliance purposes?",
    ],

    # ============================== FRONTEND DEVELOPER ==============================

    ("Frontend Developer", "Technical", "Easy"): [
        "What is the difference between HTML, CSS, and JavaScript?",
        "What is the DOM, and how does JavaScript interact with it?",
        "What is the difference between let, const, and var in JavaScript?",
        "What is responsive design, and why is it important?",
        "What is the box model in CSS?",
        "What is the difference between inline, block, and inline-block elements?",
        "What is a callback function in JavaScript?",
        "What is the purpose of semantic HTML?",
        "What is the difference between margin and padding?",
        "What is event bubbling in JavaScript?",
        "What is the purpose of a CSS preprocessor like Sass?",
        "What is the difference between == and === in JavaScript?",
    ],
    ("Frontend Developer", "Technical", "Medium"): [
        "Explain the virtual DOM and how it improves rendering performance.",
        "What is the difference between props and state in React?",
        "Explain how React's useEffect hook works and when it runs.",
        "What is CSS specificity, and how is it calculated?",
        "What is the difference between client-side rendering and server-side rendering?",
        "Explain how JavaScript's event loop and call stack work.",
        "What is the purpose of keys in React lists?",
        "What is debouncing, and when would you use it in a frontend application?",
        "Explain the difference between controlled and uncontrolled components in React.",
        "What is code splitting, and why is it important for performance?",
        "What is the difference between local storage, session storage, and cookies?",
        "How does CSS Flexbox differ from CSS Grid?",
    ],
    ("Frontend Developer", "Technical", "Hard"): [
        "How would you optimize a React application that is re-rendering too often?",
        "Explain how you would design a component library that scales across multiple teams.",
        "How would you approach accessibility (a11y) for a complex web application?",
        "What strategies would you use to improve the Largest Contentful Paint of a web page?",
        "How would you design state management for a large-scale single-page application?",
        "Explain how you would implement optimistic UI updates for a slow network.",
        "How would you architect a micro-frontend system for a large product?",
        "What approach would you take to handle real-time data updates in the UI efficiently?",
        "Explain how you would design a caching strategy for API responses on the client.",
        "How would you debug a memory leak in a long-running single-page application?",
        "What trade-offs would you consider between server-side rendering and static site generation?",
        "How would you design a design-token system to keep UI consistent across products?",
    ],

    # ============================== FULL STACK DEVELOPER ==============================

    ("Full Stack Developer", "Technical", "Easy"): [
        "What is the difference between frontend and backend development?",
        "What is an API endpoint?",
        "What is the purpose of a database schema?",
        "What is CORS, and why does it matter for a full stack application?",
        "What is the difference between a GET and a POST request?",
        "What is npm, and what problem does it solve?",
        "What is the purpose of a .env file in a full stack project?",
        "What is client-server architecture?",
        "What is the difference between frontend routing and backend routing?",
        "What is a JSON Web Token used for in a full stack application?",
        "What is the purpose of middleware in a full stack framework?",
        "What is the difference between a relational and non-relational database?",
    ],
    ("Full Stack Developer", "Technical", "Medium"): [
        "How would you structure a full stack application to keep the frontend and backend loosely coupled?",
        "Explain how authentication state is typically shared between frontend and backend.",
        "What is the difference between server-side and client-side validation, and why do you need both?",
        "How would you handle file uploads in a full stack application?",
        "Explain how you would design an API contract before building the frontend and backend in parallel.",
        "What is the purpose of environment-specific configuration across development, staging, and production?",
        "How would you implement real-time features like notifications across the stack?",
        "Explain the trade-offs of using a monorepo versus separate repositories for frontend and backend.",
        "How would you handle error responses consistently across a full stack application?",
        "What is the role of a reverse proxy in a full stack deployment?",
        "How would you design database migrations to avoid breaking the frontend during deployment?",
        "Explain how you would implement role-based access control across frontend and backend.",
    ],
    ("Full Stack Developer", "Technical", "Hard"): [
        "How would you design a full stack application to support multiple clients (web, mobile) with one backend?",
        "Explain how you would architect a full stack application for high availability across regions.",
        "How would you design a full stack system for real-time collaboration, like a shared document editor?",
        "What approach would you take to implement end-to-end testing across the full stack?",
        "How would you design a full stack application to gracefully degrade when the backend is partially down?",
        "Explain how you would coordinate a breaking API change between frontend and backend teams safely.",
        "How would you design caching across the full stack, from database to CDN?",
        "What strategies would you use to secure a full stack application from common web vulnerabilities end to end?",
        "How would you design a full stack system to support feature flags and gradual rollouts?",
        "Explain how you would architect a full stack application for offline-first functionality.",
        "How would you design observability (logging, metrics, tracing) across a full stack system?",
        "What trade-offs would you consider when choosing a full stack framework versus a decoupled frontend/backend?",
    ],

    # ============================== DATA ANALYST ==============================

    ("Data Analyst", "Technical", "Easy"): [
        "What is the difference between qualitative and quantitative data?",
        "What is a pivot table, and what is it used for?",
        "What is the difference between mean, median, and mode?",
        "What is data cleaning, and why is it important?",
        "What is the difference between a bar chart and a histogram?",
        "What is a GROUP BY clause used for in SQL?",
        "What is the difference between a database and a spreadsheet?",
        "What is an outlier in a dataset?",
        "What is the purpose of data visualization?",
        "What is the difference between correlation and causation?",
        "What is a KPI, and why is it useful for a business?",
        "What is the difference between structured and unstructured data?",
    ],
    ("Data Analyst", "Technical", "Medium"): [
        "Explain how you would identify and handle missing data in a dataset.",
        "What is the difference between a left join and an inner join, with an example?",
        "How would you design a dashboard to communicate insights to non-technical stakeholders?",
        "Explain the difference between A/B testing and observational analysis.",
        "What is the purpose of window functions in SQL?",
        "How would you detect seasonality in a time series dataset?",
        "What is statistical significance, and why does it matter in analysis?",
        "Explain the difference between a data warehouse and a data lake.",
        "How would you validate that a dataset is reliable before analyzing it?",
        "What is the purpose of normalization versus denormalization in reporting databases?",
        "Explain how you would choose the right chart type for a given dataset.",
        "What is cohort analysis, and when would you use it?",
    ],
    ("Data Analyst", "Technical", "Hard"): [
        "How would you design an end-to-end analytics pipeline from raw data to a business dashboard?",
        "Explain how you would investigate a sudden drop in a key business metric.",
        "How would you design an experiment to measure the impact of a new product feature?",
        "What approach would you take to build a single source of truth across multiple data sources?",
        "How would you communicate a counter-intuitive data finding to skeptical stakeholders?",
        "Explain how you would detect and correct for selection bias in an analysis.",
        "How would you design a data quality monitoring system for critical business reports?",
        "What trade-offs would you consider when choosing between batch and real-time analytics?",
        "How would you approach forecasting demand for a highly seasonal product?",
        "Explain how you would prioritize which metrics matter most for a growing startup.",
        "How would you design an attribution model for a multi-channel marketing campaign?",
        "What approach would you take to scale analytics reporting as data volume grows tenfold?",
    ],

    # ============================== DATA SCIENTIST ==============================

    ("Data Scientist", "Technical", "Easy"): [
        "What is the difference between data analysis and data science?",
        "What is a p-value, and what does it indicate?",
        "What is the difference between a population and a sample?",
        "What is exploratory data analysis?",
        "What is standard deviation, and what does it measure?",
        "What is the difference between a training set and a test set?",
        "What is linear regression?",
        "What is the purpose of a hypothesis test?",
        "What is the difference between discrete and continuous variables?",
        "What is a normal distribution?",
        "What is feature scaling, and why is it needed?",
        "What is the difference between classification and clustering?",
    ],
    ("Data Scientist", "Technical", "Medium"): [
        "Explain the assumptions behind linear regression.",
        "What is the difference between Type I and Type II error?",
        "How would you evaluate a classification model besides accuracy?",
        "Explain how k-means clustering works.",
        "What is multicollinearity, and how does it affect a regression model?",
        "What is the central limit theorem, and why does it matter in statistics?",
        "Explain the difference between correlation coefficient and R-squared.",
        "How would you handle a dataset with significant class imbalance?",
        "What is A/B testing, and how do you determine statistical significance?",
        "Explain the bias-variance trade-off in the context of model complexity.",
        "What is the difference between random, stratified, and cluster sampling?",
        "How would you decide between a statistical model and a machine learning model for a given problem?",
    ],
    ("Data Scientist", "Technical", "Hard"): [
        "How would you design an end-to-end data science project from problem definition to deployment?",
        "Explain how you would design a causal experiment when randomization is not possible.",
        "How would you build a churn prediction model and validate its business impact?",
        "What approach would you take to explain a complex model's predictions to business stakeholders?",
        "How would you detect and address data leakage in a machine learning pipeline?",
        "Explain how you would design a robust cross-validation strategy for time series data.",
        "How would you approach building a pricing optimization model for an e-commerce platform?",
        "What trade-offs would you consider when choosing between interpretability and predictive performance?",
        "How would you design a system to continuously monitor a deployed model for concept drift?",
        "Explain how you would design a recommendation engine that also accounts for business constraints like inventory.",
        "How would you approach a data science problem with very limited labeled data?",
        "What strategies would you use to ensure reproducibility across a team's data science experiments?",
    ],

    # ============================== CLOUD ENGINEER ==============================

    ("Cloud Engineer", "Technical", "Easy"): [
        "What is cloud computing, and what are its main benefits?",
        "What is the difference between IaaS, PaaS, and SaaS?",
        "What is a virtual machine?",
        "What is the difference between public, private, and hybrid cloud?",
        "What is object storage, and how does it differ from block storage?",
        "What is a load balancer, and why is it used?",
        "What is auto-scaling in a cloud environment?",
        "What is a VPC (Virtual Private Cloud)?",
        "What is the difference between vertical and horizontal scaling?",
        "What is the purpose of a content delivery network?",
        "What is Infrastructure as Code?",
        "What is the difference between availability zones and regions?",
    ],
    ("Cloud Engineer", "Technical", "Medium"): [
        "Explain how you would design a highly available architecture across multiple availability zones.",
        "What is the difference between containers and virtual machines?",
        "How does Kubernetes manage container orchestration at a high level?",
        "Explain the principle of least privilege in cloud security.",
        "What is the difference between a NAT gateway and an internet gateway?",
        "How would you design a disaster recovery plan for a cloud-hosted application?",
        "What is the purpose of Infrastructure as Code tools like Terraform?",
        "Explain how a CI/CD pipeline deploys infrastructure changes safely.",
        "What is the difference between blue-green deployment and canary deployment?",
        "How would you monitor cost across a growing cloud infrastructure?",
        "What is the purpose of a service mesh in a microservices deployment?",
        "Explain how identity and access management (IAM) works in a major cloud provider.",
    ],
    ("Cloud Engineer", "Technical", "Hard"): [
        "How would you design a multi-region, highly available cloud architecture for a global application?",
        "Explain how you would architect a zero-downtime migration from on-premises to the cloud.",
        "How would you design a cost-optimization strategy for a large-scale cloud infrastructure?",
        "What approach would you take to secure a multi-account cloud environment at scale?",
        "How would you design a disaster recovery architecture with a very low recovery time objective?",
        "Explain how you would design auto-scaling policies for an unpredictable traffic pattern.",
        "How would you architect a cloud-native CI/CD pipeline for hundreds of microservices?",
        "What strategies would you use to prevent vendor lock-in when designing on a single cloud provider?",
        "How would you design network architecture to isolate sensitive workloads in the cloud?",
        "Explain how you would approach compliance, such as data residency, in a multi-region cloud deployment.",
        "How would you design a cloud infrastructure to support both batch and real-time data processing?",
        "What approach would you take to design self-healing infrastructure in the cloud?",
    ],

    # ============================== CYBERSECURITY ENGINEER ==============================

    ("Cybersecurity Engineer", "Technical", "Easy"): [
        "What is the difference between authentication and authorization?",
        "What is a firewall, and what does it do?",
        "What is phishing, and how can it be prevented?",
        "What is encryption, and why is it important?",
        "What is the difference between a virus and a worm?",
        "What is two-factor authentication?",
        "What is a VPN, and how does it improve security?",
        "What is the principle of least privilege?",
        "What is a DDoS attack?",
        "What is the difference between symmetric and asymmetric encryption?",
        "What is a security patch, and why is it important to apply them?",
        "What is social engineering in the context of cybersecurity?",
    ],
    ("Cybersecurity Engineer", "Technical", "Medium"): [
        "Explain how SQL injection works and how to prevent it.",
        "What is cross-site scripting (XSS), and how can it be mitigated?",
        "What is the difference between a vulnerability scan and a penetration test?",
        "Explain how public key infrastructure (PKI) works.",
        "What is a zero-day vulnerability?",
        "How does a man-in-the-middle attack work, and how can it be prevented?",
        "What is the purpose of a security information and event management (SIEM) system?",
        "Explain the concept of defense in depth.",
        "What is cross-site request forgery (CSRF), and how is it different from XSS?",
        "How would you secure an API against common attacks?",
        "What is the role of a Web Application Firewall?",
        "Explain how hashing differs from encryption, and when each is used.",
    ],
    ("Cybersecurity Engineer", "Technical", "Hard"): [
        "How would you design an incident response plan for a suspected data breach?",
        "Explain how you would architect a zero-trust security model for an organization.",
        "How would you conduct a threat model for a new application before it launches?",
        "What approach would you take to secure a CI/CD pipeline from supply chain attacks?",
        "How would you design a security architecture for a system handling sensitive financial data?",
        "Explain how you would detect and respond to an advanced persistent threat.",
        "How would you design least-privilege access control across a large cloud environment?",
        "What strategies would you use to secure secrets and credentials across microservices?",
        "How would you design a security awareness program to reduce social engineering risk?",
        "Explain how you would perform a post-incident forensic investigation.",
        "How would you balance security controls against developer productivity in a fast-moving team?",
        "What approach would you take to secure an organization's software supply chain end to end?",
    ],

    # ============================== HR (not role-specific) ==============================

    (None, "HR", "Easy"): [
        "Tell me about yourself.",
        "Why do you want to work for this company?",
        "What are your strengths?",
        "What are your weaknesses?",
        "Where do you see yourself in five years?",
        "Why should we hire you?",
        "What motivates you to do good work?",
        "What do you know about our company?",
        "Are you comfortable working in a team?",
        "What is your preferred work environment?",
        "How do you handle feedback from a manager?",
        "What are your salary expectations?",
        "Are you willing to relocate if required?",
        "What do you do in your free time?",
        "How would your friends describe you?",
        "Why did you choose this career path?",
        "What is your greatest achievement so far?",
        "Are you open to working flexible hours?",
    ],
    (None, "HR", "Medium"): [
        "Why did you leave your previous job or internship?",
        "How do you handle conflict with a coworker?",
        "Describe a time you had to work under a tight deadline.",
        "How do you prioritize tasks when everything feels urgent?",
        "What would you do if you disagreed with a decision made by your manager?",
        "How do you handle constructive criticism?",
        "Describe your ideal manager.",
        "What does teamwork mean to you?",
        "How do you stay motivated during repetitive or boring tasks?",
        "What steps do you take to manage stress at work?",
        "How do you handle working with someone whose working style is very different from yours?",
        "What would you do if you made a mistake that affected your team?",
        "How do you balance quality of work with meeting deadlines?",
        "Describe a situation where you had to learn something new quickly.",
        "What does professional growth mean to you?",
        "How do you handle being asked to do something outside your job description?",
        "What would you do if you felt undervalued at work?",
        "How do you approach giving feedback to a peer?",
    ],
    (None, "HR", "Hard"): [
        "Describe a time you failed at something important and what you learned from it.",
        "How would you handle a situation where you strongly disagree with company policy?",
        "Tell me about a time you had to make a decision without complete information.",
        "How would you handle being asked to do something you believe is ethically questionable?",
        "Describe a time you had to deliver bad news to a manager or client.",
        "How do you handle a situation where your workload is consistently unmanageable?",
        "Tell me about a time you had to influence someone without having authority over them.",
        "How would you approach a situation where a teammate is not pulling their weight?",
        "Describe a time you had to advocate for an unpopular idea.",
        "How do you handle ambiguity when goals or expectations are unclear?",
        "Tell me about a time you received harsh criticism. How did you respond?",
        "How would you handle discovering that a colleague made a serious mistake and tried to hide it?",
        "Describe how you would rebuild trust with a team after a major failure.",
        "Tell me about a time you had to say no to your manager. How did you approach it?",
        "How do you handle competing priorities from two different stakeholders?",
        "Describe a time you had to adapt quickly to a major change in your organization.",
        "How would you handle a situation where you were blamed for something that was not your fault?",
        "Tell me about a time your values conflicted with a business decision. How did you handle it?",
    ],

    # ============================== BEHAVIORAL (not role-specific) ==============================

    (None, "Behavioral", "Easy"): [
        "Tell me about a project you are proud of.",
        "Describe a time you worked well as part of a team.",
        "Tell me about a time you helped a classmate or colleague.",
        "Describe a situation where you had to be patient.",
        "Tell me about a goal you set for yourself and achieved.",
        "Describe a time you had to learn a new skill on your own.",
        "Tell me about a time you took initiative on a task.",
        "Describe a situation where you had to communicate a complex idea simply.",
        "Tell me about a time you managed your time effectively.",
        "Describe a time you asked for help when you needed it.",
        "Tell me about a hobby or interest that has taught you something valuable.",
        "Describe a time you had to adjust to a new environment.",
        "Tell me about a time you received positive feedback. How did it feel?",
        "Describe a situation where attention to detail mattered.",
        "Tell me about a time you worked with someone from a different background.",
        "Describe how you organize your work when you have multiple tasks.",
        "Tell me about a time you stayed motivated despite a setback.",
        "Describe a time you contributed an idea that was well received.",
    ],
    (None, "Behavioral", "Medium"): [
        "Tell me about a time you had to work with a difficult team member.",
        "Describe a situation where you had to meet a deadline with limited resources.",
        "Tell me about a time you took on a leadership role, even informally.",
        "Describe a time you had to persuade someone to see things your way.",
        "Tell me about a time you had to juggle multiple competing priorities.",
        "Describe a situation where you identified a problem before anyone else noticed it.",
        "Tell me about a time you had to give difficult feedback to someone.",
        "Describe a time your plan did not work out and how you adapted.",
        "Tell me about a time you had to collaborate with people outside your immediate team.",
        "Describe a situation where you had to make a trade-off between speed and quality.",
        "Tell me about a time you took a risk and it did not pay off.",
        "Describe a time you had to defend a decision you made.",
        "Tell me about a time you had to quickly build trust with someone new.",
        "Describe a situation where you went beyond what was expected of you.",
        "Tell me about a time you had to manage up to your supervisor.",
        "Describe a time you had to resolve a misunderstanding within a team.",
        "Tell me about a time you used data or evidence to change someone's mind.",
        "Describe a situation where you had to balance multiple stakeholders' needs.",
    ],
    (None, "Behavioral", "Hard"): [
        "Tell me about the most difficult decision you have had to make.",
        "Describe a time you had to lead a team through a crisis or major setback.",
        "Tell me about a time you had to make an unpopular decision for the greater good.",
        "Describe a situation where you had to completely change your approach midway through a project.",
        "Tell me about a time you had to manage conflicting priorities from senior stakeholders.",
        "Describe the biggest professional risk you have taken and its outcome.",
        "Tell me about a time you had to rebuild a broken relationship with a colleague or client.",
        "Describe a situation where you had to challenge a decision made by someone more senior than you.",
        "Tell me about a time you had to operate with very little guidance or structure.",
        "Describe how you handled a situation where a project you were responsible for was failing.",
        "Tell me about a time you had to make a decision that negatively affected some people to benefit the larger group.",
        "Describe a time you significantly changed your mind about something you initially strongly believed.",
        "Tell me about a time you had to hold someone accountable who did not report to you.",
        "Describe a situation where you had to balance short-term pressure with a long-term goal.",
        "Tell me about a time you identified a systemic problem and worked to fix its root cause.",
        "Describe how you have handled repeated failure on the same problem.",
        "Tell me about a time you had to earn credibility in a room where no one knew you.",
        "Describe the most complex trade-off you have had to navigate in your work or studies.",
    ],
}


def seed():
    total_inserted = 0
    total_skipped_buckets = 0

    for (role, interview_type, difficulty), questions in QUESTION_BANK.items():
        query = (
            supabase.table("question_bank")
            .select("id", count="exact")
            .eq("interview_type", interview_type)
            .eq("difficulty", difficulty)
        )
        query = query.is_("role", "null") if role is None else query.eq("role", role)
        existing = query.execute()

        if (existing.count or 0) > 0:
            total_skipped_buckets += 1
            continue

        rows = [
            {
                "role": role,
                "interview_type": interview_type,
                "difficulty": difficulty,
                "question_text": question_text,
            }
            for question_text in questions
        ]

        supabase.table("question_bank").insert(rows).execute()
        total_inserted += len(rows)

    print(f"Inserted {total_inserted} questions.")
    print(f"Skipped {total_skipped_buckets} bucket(s) that already had data.")


if __name__ == "__main__":
    seed()